/**
 * Tạo 2 nguyên liệu mẫu vào collection material (project backend đang dùng)
 * Chạy: npm run seed:material
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from '../src/infrastructure/config/firebase.config';

const MATERIAL = (process.env.MATERIAL_COLLECTION || 'material').trim();

const ITEMS = [
  {
    id: '3EJYCJPtIPxGAnuTs9d2',
    name: 'Cá hồi',
    category: 'Hải sản',
    minimum: 5,
    quantity: 19,
  },
  {
    id: 'i7FE4wYBrlvbpAwoLJVs',
    name: 'Trứng cá hồi',
    category: 'Hải sản',
    minimum: 10,
    quantity: 110,
  },
];

async function main() {
  console.log('Project:', process.env.FIREBASE_PROJECT_ID);
  console.log('Collection:', MATERIAL);

  for (const item of ITEMS) {
    const ref = db.collection(MATERIAL).doc(item.id);
    const existing = await ref.get();
    if (existing.exists) {
      await ref.update({
        name: item.name,
        item_name: item.name,
        category: item.category,
        minimum: item.minimum,
        minimum_quantity: item.minimum,
        quantity: item.quantity,
        current_quantity: item.quantity,
        updated_at: new Date(),
      });
      console.log(`Updated: ${item.name} (${item.id})`);
    } else {
      await ref.set({
        name: item.name,
        item_name: item.name,
        category: item.category,
        minimum: item.minimum,
        minimum_quantity: item.minimum,
        quantity: item.quantity,
        current_quantity: item.quantity,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`Created: ${item.name} (${item.id})`);
    }
  }

  const count = (await db.collection(MATERIAL).get()).size;
  console.log(`\nDone. material collection now has ${count} document(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
