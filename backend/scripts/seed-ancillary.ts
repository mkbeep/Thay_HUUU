/**
 * Seed dữ liệu phụ theo schema firebase/collections:
 * - food_topping (topping dùng chung)
 * - inventory + xóa inventory_transaction
 * - promotion
 * - settings (document system)
 * - Xóa dữ liệu runtime demo: orders, order_item, order_item_topping, kitchen_ticket, payment, notification, support_requests, table_session
 *
 * Chạy: npx ts-node scripts/seed-ancillary.ts
 */

import { db } from '../src/infrastructure/config/firebase.config';
import * as admin from 'firebase-admin';
import { seedInventory } from '../src/infrastructure/database/seeders/inventorySeeder';
import { seedPromotions } from '../src/infrastructure/database/seeders/promotionSeeder';
import { seedDemoRuntimeData } from '../src/infrastructure/database/seeders/demoRuntimeSeeder';

async function deleteCollection(collName: string): Promise<number> {
  const snap = await db.collection(collName).get();
  if (snap.empty) return 0;
  let batch = db.batch();
  let n = 0;
  let total = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    n++;
    total++;
    if (n >= 450) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
  console.log(`   🗑  ${collName}: đã xóa ${total} bản ghi`);
  return total;
}

const FOOD_TOPPINGS = [
  { name: 'Thêm trứng', description: 'Thêm 1 quả trứng', price: 10000, is_available: true },
  { name: 'Thêm thịt', description: 'Thêm phần thịt', price: 20000, is_available: true },
  { name: 'Thêm tôm', description: 'Thêm 3 con tôm', price: 25000, is_available: true },
  { name: 'Thêm rau', description: 'Thêm rau sống', price: 5000, is_available: true },
  { name: 'Thêm phô mai', description: 'Thêm lát phô mai', price: 15000, is_available: true },
];

async function seedFoodToppings() {
  await deleteCollection('food_topping');
  const now = admin.firestore.Timestamp.now();
  for (const t of FOOD_TOPPINGS) {
    await db.collection('food_topping').add({
      ...t,
      created_at: now,
      updated_at: now,
    });
  }
  console.log(`   ✅ food_topping: ${FOOD_TOPPINGS.length} topping`);
}

async function seedSettingsDoc() {
  const now = admin.firestore.Timestamp.now();
  await db
    .collection('settings')
    .doc('system')
    .set(
      {
        restaurant: {
          name: 'Nhà hàng Gourmet',
          address: 'Việt Nam',
          phone: '1900 0000',
          email: 'contact@gourmet.com',
          taxRate: 0.08,
          serviceFeeRate: 0.0,
        },
        payment: {
          enableCash: true,
          enableCard: true,
          enableMomo: true,
          enableZaloPay: true,
          enableBanking: true,
        },
        updated_at: now,
        updated_by: 'seed-ancillary',
      },
      { merge: true }
    );
  console.log('   ✅ settings/system');
}

async function main() {
  console.log('\n📦 Seed ancillary (inventory, promotion, topping, settings, dọn runtime, demo đủ bảng)...\n');

  await deleteCollection('inventory_transaction');
  await deleteCollection('inventory');
  await deleteCollection('promotion');
  await deleteCollection('order_item_topping');
  await deleteCollection('order_item');
  await deleteCollection('orders');
  await deleteCollection('kitchen_ticket');
  await deleteCollection('payment');
  await deleteCollection('notification');
  await deleteCollection('support_requests');
  await deleteCollection('table_session');

  await seedFoodToppings();

  const inv = await seedInventory();
  console.log(`   ✅ inventory: ${inv.length} dòng`);

  const promos = await seedPromotions();
  console.log(`   ✅ promotion: ${promos.length} chương trình`);

  await seedSettingsDoc();

  await seedDemoRuntimeData();

  console.log('\n🎉 Ancillary seed xong (kèm dữ liệu demo đủ bảng).\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
