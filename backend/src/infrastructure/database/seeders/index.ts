/**
 * Database Seeder
 * Tạo dữ liệu mẫu cho toàn bộ hệ thống
 */

import { db } from '../../config/firebase.config';

// Import seeders
import { seedRoles } from './roleSeeder';
import { seedUsers } from './userSeeder';
import { seedFoods } from './foodSeeder';
import { seedTables } from './tableSeeder';
import { seedInventory } from './inventorySeeder';
import { seedPromotions } from './promotionSeeder';

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  const collections = [
    'users',
    'role',
    'user_role',
    'food',
    'food_image',
    'food_topping',
    'dining_table',
    'table_session',
    'orders',
    'order_item',
    'order_item_topping',
    'kitchen_ticket',
    'payment',
    'inventory',
    'inventory_transaction',
    'notification',
    'promotion',
    'support_requests',
    'settings',
  ];

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`  ✓ Cleared ${collectionName}`);
  }
}

async function runSeeders() {
  console.log('\n🌱 Starting database seeding...\n');

  try {
    // 1. Seed Roles
    console.log('📋 Seeding roles...');
    const roles = await seedRoles();
    console.log(`  ✓ Created ${roles.length} roles\n`);

    // 2. Seed Users
    console.log('👥 Seeding users...');
    const users = await seedUsers(roles);
    console.log(`  ✓ Created ${users.length} users\n`);

    // 3. Seed Foods
    console.log('🍽️  Seeding foods...');
    const foods = await seedFoods();
    console.log(`  ✓ Created ${foods.length} foods\n`);

    // 4. Seed Tables
    console.log('🪑 Seeding tables...');
    const tables = await seedTables();
    console.log(`  ✓ Created ${tables.length} tables\n`);

    // 5. Seed Inventory
    console.log('📦 Seeding inventory...');
    const inventory = await seedInventory();
    console.log(`  ✓ Created ${inventory.length} inventory items\n`);

    // 6. Seed Promotions
    console.log('🎁 Seeding promotions...');
    const promotions = await seedPromotions();
    console.log(`  ✓ Created ${promotions.length} promotions\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Roles: ${roles.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Foods: ${foods.length}`);
    console.log(`  - Tables: ${tables.length}`);
    console.log(`  - Inventory: ${inventory.length}`);
    console.log(`  - Promotions: ${promotions.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await clearDatabase();
    await runSeeders();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
