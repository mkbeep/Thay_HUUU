/**
 * Script kiểm tra tất cả dữ liệu trong Firebase
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

async function checkAllData() {
  console.log('🔍 Đang kiểm tra dữ liệu Firebase...\n');

  try {
    // 1. Kiểm tra Foods
    console.log('📦 FOODS COLLECTION:');
    const foodsSnapshot = await db.collection('food').get();
    console.log(`   Tổng số món: ${foodsSnapshot.size}`);
    
    if (foodsSnapshot.size > 0) {
      const categories: Record<string, number> = {};
      const vegetarianCount = { total: 0, beverages: 0 };
      
      foodsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const category = data.category || 'Unknown';
        categories[category] = (categories[category] || 0) + 1;
        
        if (data.is_vegetarian) {
          vegetarianCount.total++;
          if (category === 'Đồ uống') {
            vegetarianCount.beverages++;
          }
        }
      });
      
      console.log('   Phân loại:');
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`      - ${cat}: ${count} món`);
      });
      console.log(`   Vegetarian: ${vegetarianCount.total} món`);
      console.log(`   Đồ uống vegetarian: ${vegetarianCount.beverages}/${categories['Đồ uống'] || 0}`);
    }
    console.log('');

    // 2. Kiểm tra Tables
    console.log('🪑 TABLES COLLECTION:');
    const tablesSnapshot = await db.collection('dining_table').get();
    console.log(`   Tổng số bàn: ${tablesSnapshot.size}`);
    
    if (tablesSnapshot.size > 0) {
      const statuses: Record<string, number> = {};
      tablesSnapshot.docs.forEach(doc => {
        const status = doc.data().status || 'unknown';
        statuses[status] = (statuses[status] || 0) + 1;
      });
      
      console.log('   Trạng thái:');
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count} bàn`);
      });
    }
    console.log('');

    // 3. Kiểm tra Orders
    console.log('📋 ORDERS COLLECTION:');
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`   Tổng số đơn: ${ordersSnapshot.size}`);
    console.log('');

    // 4. Kiểm tra Support Requests
    console.log('🆘 SUPPORT_REQUESTS COLLECTION:');
    const supportSnapshot = await db.collection('support_requests').get();
    console.log(`   Tổng số yêu cầu: ${supportSnapshot.size}`);
    
    if (supportSnapshot.size > 0) {
      const statuses: Record<string, number> = {};
      supportSnapshot.docs.forEach(doc => {
        const status = doc.data().status || 'unknown';
        statuses[status] = (statuses[status] || 0) + 1;
      });
      
      console.log('   Trạng thái:');
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count} yêu cầu`);
      });
    }
    console.log('');

    // 5. Kiểm tra Users
    console.log('👥 USERS COLLECTION:');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Tổng số users: ${usersSnapshot.size}`);
    
    if (usersSnapshot.size > 0) {
      const roles: Record<string, number> = {};
      usersSnapshot.docs.forEach(doc => {
        const role = doc.data().role || 'unknown';
        roles[role] = (roles[role] || 0) + 1;
      });
      
      console.log('   Vai trò:');
      Object.entries(roles).forEach(([role, count]) => {
        console.log(`      - ${role}: ${count} users`);
      });
    }
    console.log('');

    // 6. Kiểm tra Notifications
    console.log('🔔 NOTIFICATIONS COLLECTION:');
    const notificationsSnapshot = await db.collection('notification').get();
    console.log(`   Tổng số thông báo: ${notificationsSnapshot.size}`);
    console.log('');

    // 7. Kiểm tra Inventory
    console.log('📦 INVENTORY COLLECTION:');
    const inventorySnapshot = await db.collection('inventory').get();
    console.log(`   Tổng số items: ${inventorySnapshot.size}`);
    console.log('');

    // Tổng kết
    console.log('=' .repeat(50));
    console.log('📊 TỔNG KẾT:');
    console.log(`   ✅ Foods: ${foodsSnapshot.size} món`);
    console.log(`   ✅ Tables: ${tablesSnapshot.size} bàn`);
    console.log(`   ✅ Orders: ${ordersSnapshot.size} đơn`);
    console.log(`   ✅ Support Requests: ${supportSnapshot.size} yêu cầu`);
    console.log(`   ✅ Users: ${usersSnapshot.size} users`);
    console.log(`   ✅ Notifications: ${notificationsSnapshot.size} thông báo`);
    console.log(`   ✅ Inventory: ${inventorySnapshot.size} items`);
    console.log('=' .repeat(50));

    // Đề xuất
    console.log('\n💡 ĐỀ XUẤT:');
    if (foodsSnapshot.size < 50) {
      console.log('   ⚠️  Cần seed foods: npm run seed:50foods');
    }
    if (tablesSnapshot.size === 0) {
      console.log('   ⚠️  Cần seed tables: npm run seed:tables');
    }
    if (usersSnapshot.size === 0) {
      console.log('   ⚠️  Cần tạo admin user');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkAllData();
