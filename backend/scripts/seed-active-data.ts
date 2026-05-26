/**
 * Seed the collections actively used by the restaurant app, excluding menu.
 *
 * Menu is seeded separately by seed-foods-cloudinary.ts because it must use
 * the Cloudinary URL mapping from scripts/menu-image-urls.flat.json.
 */

import { db } from '../src/infrastructure/config/firebase.config';
import { seedRoles } from '../src/infrastructure/database/seeders/roleSeeder';
import { seedUsers } from '../src/infrastructure/database/seeders/userSeeder';
import { seedTables } from '../src/infrastructure/database/seeders/tableSeeder';
import { seedPromotions } from '../src/infrastructure/database/seeders/promotionSeeder';
import { firebaseAdmin } from '../src/infrastructure/config/firebase.config';

const COLLECTIONS_TO_CLEAR = [
  'users',
  'role',
  'user_role',
  'dining_table',
  'table_session',
  'orders',
  'order_item',
  'order_item_topping',
  'kitchen_ticket',
  'payment',
  'material',
  'inventory',
  'inventory_transaction',
  'promotion',
  'notification',
  'support_requests',
  'settings',
];

const MATERIALS = [
  { name: 'Thịt bò Úc', category: 'Thịt', quantity: 50, minimum: 10, price: 350000, supplier: 'Công ty TNHH Thực phẩm Sạch' },
  { name: 'Thịt heo', category: 'Thịt', quantity: 80, minimum: 20, price: 120000, supplier: 'Công ty TNHH Thực phẩm Sạch' },
  { name: 'Tôm sú', category: 'Hải sản', quantity: 30, minimum: 5, price: 450000, supplier: 'Công ty Hải sản Biển Đông' },
  { name: 'Mực ống', category: 'Hải sản', quantity: 25, minimum: 5, price: 280000, supplier: 'Công ty Hải sản Biển Đông' },
  { name: 'Cá hồi', category: 'Hải sản', quantity: 20, minimum: 5, price: 550000, supplier: 'Công ty Hải sản Biển Đông' },
  { name: 'Rau xà lách', category: 'Rau củ', quantity: 15, minimum: 3, price: 35000, supplier: 'Nông trại Đà Lạt' },
  { name: 'Cà chua', category: 'Rau củ', quantity: 25, minimum: 5, price: 25000, supplier: 'Nông trại Đà Lạt' },
  { name: 'Hành tây', category: 'Rau củ', quantity: 20, minimum: 5, price: 18000, supplier: 'Nông trại Đà Lạt' },
  { name: 'Khoai tây', category: 'Rau củ', quantity: 40, minimum: 10, price: 22000, supplier: 'Nông trại Đà Lạt' },
  { name: 'Muối', category: 'Gia vị', quantity: 50, minimum: 10, price: 8000, supplier: 'Công ty Gia vị Việt Nam' },
  { name: 'Đường', category: 'Gia vị', quantity: 60, minimum: 15, price: 18000, supplier: 'Công ty Gia vị Việt Nam' },
  { name: 'Nước mắm', category: 'Gia vị', quantity: 30, minimum: 10, price: 85000, supplier: 'Công ty Gia vị Việt Nam' },
  { name: 'Dầu ăn', category: 'Gia vị', quantity: 40, minimum: 10, price: 45000, supplier: 'Công ty Gia vị Việt Nam' },
  { name: 'Gạo ST25', category: 'Gia vị', quantity: 200, minimum: 50, price: 28000, supplier: 'Công ty Lương thực Miền Nam' },
  { name: 'Bún tươi', category: 'Gia vị', quantity: 50, minimum: 10, price: 18000, supplier: 'Xưởng bánh Hà Nội' },
  { name: 'Bánh phở', category: 'Gia vị', quantity: 60, minimum: 15, price: 20000, supplier: 'Xưởng bánh Hà Nội' },
  { name: 'Mì trứng', category: 'Gia vị', quantity: 40, minimum: 10, price: 35000, supplier: 'Xưởng bánh Hà Nội' },
  { name: 'Cà phê hạt', category: 'Đồ uống', quantity: 20, minimum: 5, price: 280000, supplier: 'Công ty Cà phê Trung Nguyên' },
  { name: 'Trà xanh', category: 'Đồ uống', quantity: 10, minimum: 2, price: 350000, supplier: 'Công ty Trà Việt' },
  { name: 'Sữa tươi', category: 'Sữa', quantity: 50, minimum: 10, price: 32000, supplier: 'Công ty Sữa Vinamilk' },
];

async function clearCollection(collectionName: string): Promise<number> {
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection(collectionName).limit(400).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
  }

  return deleted;
}

async function seedMaterials(): Promise<number> {
  const now = firebaseAdmin.firestore.FieldValue.serverTimestamp();

  for (const material of MATERIALS) {
    const materialRef = db.collection('material').doc();
    const importRef = materialRef.collection('import').doc();
    const { price, supplier, ...materialData } = material;

    await db.runTransaction(async (transaction) => {
      transaction.set(materialRef, materialData);
      transaction.set(importRef, {
        createAt: now,
        price,
        quantity: material.quantity,
        supplier,
      });
    });
  }

  return MATERIALS.length;
}

async function main() {
  console.log('Clearing active app collections...');
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    const deleted = await clearCollection(collectionName);
    console.log(`  ${collectionName}: deleted ${deleted}`);
  }

  console.log('\nSeeding roles...');
  const roles = await seedRoles();
  console.log(`  roles: ${roles.length}`);

  console.log('Seeding users...');
  const users = await seedUsers(roles);
  console.log(`  users: ${users.length}`);

  console.log('Seeding dining tables...');
  const tables = await seedTables();
  console.log(`  dining_table: ${tables.length}`);

  console.log('Seeding material inventory...');
  const materials = await seedMaterials();
  console.log(`  material: ${materials}`);

  console.log('Seeding promotions...');
  const promotions = await seedPromotions();
  console.log(`  promotion: ${promotions.length}`);

  console.log('\nActive data seed completed.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Active data seed failed:', error);
    process.exit(1);
  });
