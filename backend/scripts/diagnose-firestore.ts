/**
 * Chẩn đoán Firestore: so sánh collection material với Firebase Console
 * Chạy: npx ts-node scripts/diagnose-firestore.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';

dotenv.config({ path: path.join(__dirname, '../.env') });

import firebaseApp, { db } from '../src/infrastructure/config/firebase.config';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID?.trim();
const MATERIAL_IDS = [
  '3EJYCJPtIPxGAnuTs9d2',
  '3EJYCJPTiPxGAnuTs9d2',
  'i7FE4wYBrlvbpAwoLJVs',
];

async function listFirestoreDatabases() {
  if (!PROJECT_ID) return;
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases`,
      { headers: { Authorization: `Bearer ${token.token}` } }
    );
    const body = (await res.json()) as { databases?: Array<{ name?: string; type?: string; locationId?: string }> };
    console.log('\n=== FIRESTORE DATABASES (API) ===');
    if (!res.ok) {
      console.log('Lỗi:', body);
      return;
    }
    const databases = body.databases || [];
    for (const dbInfo of databases) {
      const name = dbInfo.name?.split('/').pop() || dbInfo.name;
      console.log(` - ${name} (${dbInfo.type || '?'}) location=${dbInfo.locationId || '?'}`);
    }
    if (databases.length === 0) console.log(' (không có database nào hoặc không có quyền)');
  } catch (e) {
    console.log('Không liệt kê được databases:', e);
  }
}

async function main() {
  console.log('=== BACKEND FIREBASE DIAGNOSTIC ===');
  console.log('Project ID:', PROJECT_ID);
  console.log('App name:', firebaseApp.name);
  console.log('MATERIAL_COLLECTION:', JSON.stringify(process.env.MATERIAL_COLLECTION || 'material'));

  await listFirestoreDatabases();

  const collections = await db.listCollections();
  const names = collections.map((c) => c.id).sort();
  console.log('\n=== COLLECTIONS (default DB, có ít nhất 1 doc) ===');
  console.log(names.join(', '));
  console.log('Có "material"?', names.includes('material'));

  const materialSnap = await db.collection('material').get();
  const inventorySnap = await db.collection('inventory').get();
  console.log('\n=== DOCUMENT COUNTS ===');
  console.log('material:', materialSnap.size);
  console.log('inventory:', inventorySnap.size);

  if (materialSnap.size > 0) {
    console.log('\n=== material documents ===');
    materialSnap.docs.forEach((d) => console.log(' ', d.id, d.data()));
  }

  console.log('\n=== Thử fetch doc ID từ Firebase Console ===');
  for (const id of MATERIAL_IDS) {
    const doc = await db.collection('material').doc(id).get();
    console.log(` material/${id} exists=${doc.exists}`, doc.exists ? doc.data() : '');
  }

  console.log('\n=== Gợi ý ===');
  if (materialSnap.size === 0 && inventorySnap.size > 0) {
    console.log(
      'Backend KHÔNG thấy collection material trên project này.\n' +
        'Nếu Console vẫn có 2 doc trong material → kiểm tra Project ID trên Console (⚙️ Project settings)\n' +
        'phải khớp:', PROJECT_ID
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
