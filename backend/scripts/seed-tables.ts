/**
 * Seed Tables Data to Firestore
 * Run: npx ts-node scripts/seed-tables.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
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

interface TableData {
  tableNumber: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location: string;
  qrCode: string;
  currentSessionId: string | null;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

const tables: Omit<TableData, 'createdAt' | 'updatedAt'>[] = [
  // Tầng 1 - Khu A (Bàn nhỏ 2-4 người)
  { tableNumber: 1, capacity: 2, status: 'available', location: 'Tầng 1 - Khu A', qrCode: 'restaurant://table/1', currentSessionId: null },
  { tableNumber: 2, capacity: 2, status: 'available', location: 'Tầng 1 - Khu A', qrCode: 'restaurant://table/2', currentSessionId: null },
  { tableNumber: 3, capacity: 4, status: 'available', location: 'Tầng 1 - Khu A', qrCode: 'restaurant://table/3', currentSessionId: null },
  { tableNumber: 4, capacity: 4, status: 'available', location: 'Tầng 1 - Khu A', qrCode: 'restaurant://table/4', currentSessionId: null },
  { tableNumber: 5, capacity: 4, status: 'available', location: 'Tầng 1 - Khu A', qrCode: 'restaurant://table/5', currentSessionId: null },

  // Tầng 1 - Khu B (Bàn trung 4-6 người)
  { tableNumber: 6, capacity: 4, status: 'available', location: 'Tầng 1 - Khu B', qrCode: 'restaurant://table/6', currentSessionId: null },
  { tableNumber: 7, capacity: 6, status: 'available', location: 'Tầng 1 - Khu B', qrCode: 'restaurant://table/7', currentSessionId: null },
  { tableNumber: 8, capacity: 6, status: 'available', location: 'Tầng 1 - Khu B', qrCode: 'restaurant://table/8', currentSessionId: null },
  { tableNumber: 9, capacity: 6, status: 'available', location: 'Tầng 1 - Khu B', qrCode: 'restaurant://table/9', currentSessionId: null },
  { tableNumber: 10, capacity: 4, status: 'available', location: 'Tầng 1 - Khu B', qrCode: 'restaurant://table/10', currentSessionId: null },

  // Tầng 2 - Khu VIP (Bàn lớn 6-10 người)
  { tableNumber: 11, capacity: 8, status: 'available', location: 'Tầng 2 - VIP', qrCode: 'restaurant://table/11', currentSessionId: null },
  { tableNumber: 12, capacity: 8, status: 'available', location: 'Tầng 2 - VIP', qrCode: 'restaurant://table/12', currentSessionId: null },
  { tableNumber: 13, capacity: 10, status: 'available', location: 'Tầng 2 - VIP', qrCode: 'restaurant://table/13', currentSessionId: null },
  { tableNumber: 14, capacity: 10, status: 'available', location: 'Tầng 2 - VIP', qrCode: 'restaurant://table/14', currentSessionId: null },
  { tableNumber: 15, capacity: 12, status: 'available', location: 'Tầng 2 - VIP', qrCode: 'restaurant://table/15', currentSessionId: null },

  // Tầng 2 - Khu ngoài trời
  { tableNumber: 16, capacity: 4, status: 'available', location: 'Tầng 2 - Ngoài trời', qrCode: 'restaurant://table/16', currentSessionId: null },
  { tableNumber: 17, capacity: 4, status: 'available', location: 'Tầng 2 - Ngoài trời', qrCode: 'restaurant://table/17', currentSessionId: null },
  { tableNumber: 18, capacity: 6, status: 'available', location: 'Tầng 2 - Ngoài trời', qrCode: 'restaurant://table/18', currentSessionId: null },
  { tableNumber: 19, capacity: 6, status: 'available', location: 'Tầng 2 - Ngoài trời', qrCode: 'restaurant://table/19', currentSessionId: null },
  { tableNumber: 20, capacity: 8, status: 'available', location: 'Tầng 2 - Ngoài trời', qrCode: 'restaurant://table/20', currentSessionId: null },
];

async function seedTables() {
  console.log('🌱 Starting to seed tables...');
  
  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();

  for (const table of tables) {
    // Use tableNumber as document ID for easy lookup
    const docRef = db.collection('dining_table').doc(`table${table.tableNumber}`);
    
    const tableData: TableData = {
      ...table,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(docRef, tableData);
    console.log(`✅ Added table ${table.tableNumber} (${table.location})`);
  }

  try {
    await batch.commit();
    console.log('\n🎉 Successfully seeded all tables!');
    console.log(`📊 Total tables created: ${tables.length}`);
    console.log('\n📋 Summary:');
    console.log(`   - Tầng 1 Khu A: 5 bàn (2-4 người)`);
    console.log(`   - Tầng 1 Khu B: 5 bàn (4-6 người)`);
    console.log(`   - Tầng 2 VIP: 5 bàn (8-12 người)`);
    console.log(`   - Tầng 2 Ngoài trời: 5 bàn (4-8 người)`);
  } catch (error) {
    console.error('❌ Error seeding tables:', error);
    throw error;
  }
}

// Run the seed function
seedTables()
  .then(() => {
    console.log('\n✨ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed failed:', error);
    process.exit(1);
  });
