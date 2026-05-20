/**
 * Copy dữ liệu từ collection inventory sang material (cùng project Firebase backend).
 * Chạy: npm run migrate:inventory-to-material
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from '../src/infrastructure/config/firebase.config';

const MATERIAL = (process.env.MATERIAL_COLLECTION || 'material').trim();

async function main() {
  const inventorySnap = await db.collection('inventory').get();
  console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`inventory docs: ${inventorySnap.size}`);

  if (inventorySnap.empty) {
    console.log('Không có dữ liệu trong inventory để migrate.');
    process.exit(0);
  }

  let copied = 0;
  let skipped = 0;

  for (const doc of inventorySnap.docs) {
    const data = doc.data();
    const targetRef = db.collection(MATERIAL).doc(doc.id);
    const existing = await targetRef.get();
    if (existing.exists) {
      skipped += 1;
      continue;
    }

    const quantity = Number(data.quantity ?? data.current_quantity ?? 0);
    const minimum = Number(data.minimum ?? data.minimum_quantity ?? 0);
    const name = String(data.name ?? data.item_name ?? '').trim();

    await targetRef.set({
      name,
      item_name: name,
      category: String(data.category ?? ''),
      quantity,
      current_quantity: quantity,
      minimum,
      minimum_quantity: minimum,
      migrated_from: 'inventory',
      migrated_at: new Date(),
    });
    copied += 1;
  }

  const materialCount = (await db.collection(MATERIAL).get()).size;
  console.log(`Đã copy ${copied} mục, bỏ qua ${skipped} mục đã tồn tại.`);
  console.log(`material collection hiện có: ${materialCount} documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
