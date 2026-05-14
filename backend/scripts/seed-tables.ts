/**
 * Seed bàn vào collection `dining_table` (schema backend / admin).
 * Chạy: npm run seed:tables
 *
 * Xóa toàn bộ `dining_table` + `table_session` trước khi ghi lại (phù hợp Firebase mới).
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

async function deleteCollection(collName: string) {
  const snap = await db.collection(collName).get();
  if (snap.empty) return;
  let batch = db.batch();
  let n = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    n++;
    if (n >= 450) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
  console.log(`   🗑  Đã xóa collection: ${collName} (${snap.size} doc)`);
}

const TABLES: Array<{
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location: string;
}> = [
  { table_number: '1', capacity: 2, status: 'available', location: 'Tầng 1 - Khu A' },
  { table_number: '2', capacity: 2, status: 'available', location: 'Tầng 1 - Khu A' },
  { table_number: '3', capacity: 4, status: 'available', location: 'Tầng 1 - Khu A' },
  { table_number: '4', capacity: 4, status: 'available', location: 'Tầng 1 - Khu A' },
  { table_number: '5', capacity: 4, status: 'available', location: 'Tầng 1 - Khu A' },
  { table_number: '6', capacity: 4, status: 'available', location: 'Tầng 1 - Khu B' },
  { table_number: '7', capacity: 6, status: 'available', location: 'Tầng 1 - Khu B' },
  { table_number: '8', capacity: 6, status: 'available', location: 'Tầng 1 - Khu B' },
  { table_number: '9', capacity: 6, status: 'available', location: 'Tầng 1 - Khu B' },
  { table_number: '10', capacity: 4, status: 'available', location: 'Tầng 1 - Khu B' },
  { table_number: '11', capacity: 8, status: 'available', location: 'Tầng 2 - VIP' },
  { table_number: '12', capacity: 8, status: 'available', location: 'Tầng 2 - VIP' },
  { table_number: '13', capacity: 10, status: 'available', location: 'Tầng 2 - VIP' },
  { table_number: '14', capacity: 10, status: 'available', location: 'Tầng 2 - VIP' },
  { table_number: '15', capacity: 12, status: 'available', location: 'Tầng 2 - VIP' },
  { table_number: '16', capacity: 4, status: 'available', location: 'Tầng 2 - Ngoài trời' },
  { table_number: '17', capacity: 4, status: 'available', location: 'Tầng 2 - Ngoài trời' },
  { table_number: '18', capacity: 6, status: 'available', location: 'Tầng 2 - Ngoài trời' },
  { table_number: '19', capacity: 6, status: 'available', location: 'Tầng 2 - Ngoài trời' },
  { table_number: '20', capacity: 8, status: 'available', location: 'Tầng 2 - Ngoài trời' },
];

async function seedTables() {
  console.log('🌱 Seed dining_table (20 bàn)...\n');

  await deleteCollection('table_session');
  await deleteCollection('dining_table');

  const now = admin.firestore.Timestamp.now();
  for (const t of TABLES) {
    await db.collection('dining_table').add({
      table_number: t.table_number,
      capacity: t.capacity,
      status: t.status,
      location: t.location,
      created_at: now,
      updated_at: now,
    });
    console.log(`   ✅ Bàn ${t.table_number} — ${t.location}`);
  }

  console.log(`\n🎉 Đã tạo ${TABLES.length} bàn (table_number dùng cho API & QR).`);
}

seedTables()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
