/**
 * Check Tables in Firebase
 * Run: npx ts-node scripts/check-firebase-tables.ts
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
  id: string;
  table_number?: string;
  capacity?: number;
  status?: string;
  location?: string;
  qr_code?: string;
  created_at?: any;
  updated_at?: any;
  [key: string]: any;
}

async function checkTables() {
  console.log('🔍 Checking tables in Firebase...\n');

  try {
    const snapshot = await db.collection('dining_table').get();

    if (snapshot.empty) {
      console.log('❌ NO TABLES FOUND in Firebase!');
      console.log('\n💡 You need to seed tables first:');
      console.log('   cd backend');
      console.log('   npm run seed');
      console.log('   or');
      console.log('   npx ts-node src/infrastructure/database/seeders/index.ts');
      return;
    }

    console.log(`✅ Found ${snapshot.size} tables in Firebase\n`);
    console.log('📋 Table List:\n');

    const tables: TableData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group by location
    const grouped: { [key: string]: TableData[] } = {};
    tables.forEach(table => {
      const location = table.location || 'Unknown';
      if (!grouped[location]) {
        grouped[location] = [];
      }
      grouped[location].push(table);
    });

    // Display grouped
    Object.keys(grouped).sort().forEach(location => {
      console.log(`\n📍 ${location}:`);
      grouped[location].forEach(table => {
        console.log(`   - Bàn ${table.table_number} (${table.capacity} chỗ) - ${table.status}`);
        console.log(`     ID: ${table.id}`);
        if (table.qr_code) {
          const qrPreview = table.qr_code.substring(0, 50);
          console.log(`     QR: ${qrPreview}...`);
        }
      });
    });

    console.log('\n\n🎯 Sample QR Code Data:');
    const sampleTable = tables[0];
    const qrData = {
      type: 'table',
      tableId: sampleTable.id,
      tableNumber: sampleTable.table_number,
      restaurantId: 'restaurant-001',
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(qrData, null, 2));

    console.log('\n\n📊 Summary:');
    console.log(`   Total tables: ${tables.length}`);
    console.log(`   Locations: ${Object.keys(grouped).length}`);
    
    const withQR = tables.filter(t => t.qr_code).length;
    console.log(`   Tables with QR code: ${withQR}/${tables.length}`);

    console.log('\n\n✅ Firebase check completed!');
    console.log('\n💡 Next steps:');
    if (withQR === 0) {
      console.log('   1. Generate QR codes: npm run generate-qr');
    }
    console.log('   2. Test API: curl http://192.168.1.2:3000/api/v1/tables/by-number/G01');
    console.log('   3. Scan QR code in mobile app');

  } catch (error) {
    console.error('❌ Error checking tables:', error);
    throw error;
  }
}

// Run the check
checkTables()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
