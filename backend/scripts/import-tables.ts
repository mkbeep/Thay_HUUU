/**
 * Script to import sample tables into Firebase
 * Run: npx ts-node scripts/import-tables.ts
 */

import { db } from '../src/infrastructure/config/firebase.config';
import * as fs from 'fs';
import * as path from 'path';

async function importTables() {
  try {
    console.log('🚀 Starting table import...');

    // Read sample data
    const dataPath = path.join(__dirname, '../firebase/sample-data/dining_table.json');
    const tablesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`📊 Found ${tablesData.length} tables to import`);

    // Import each table
    const batch = db.batch();
    let count = 0;

    for (const table of tablesData) {
      const docRef = db.collection('dining_table').doc(`table${table.table_number}`);
      batch.set(docRef, {
        ...table,
        created_at: new Date(table.created_at),
        updated_at: new Date(table.updated_at),
      });
      count++;
      console.log(`✅ Prepared table ${table.table_number}`);
    }

    // Commit batch
    await batch.commit();
    console.log(`\n🎉 Successfully imported ${count} tables!`);
    console.log('\n📋 Table IDs:');
    tablesData.forEach((t: any) => {
      console.log(`  - table${t.table_number}: Bàn số ${t.table_number} (${t.capacity} chỗ)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing tables:', error);
    process.exit(1);
  }
}

importTables();
