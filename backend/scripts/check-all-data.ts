/**
 * Script kiểm tra tất cả dữ liệu trong Firebase
 */

import { db } from '../src/infrastructure/config/firebase.config';

async function checkAllData() {
  console.log('🔍 Đang kiểm tra dữ liệu Firebase...\n');

  try {
    // 1. Kiểm tra Foods
    console.log('📦 FOODS COLLECTION:');
    const foodsSnapshot = await db.collection('food').get();
    console.log(`   Tổng số món: ${foodsSnapshot.size}`);
    
    if (foodsSnapshot.size > 0) {
      const categories: Record<string, number> = {};
      foodsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const category = data.category || 'Unknown';
        categories[category] = (categories[category] || 0) + 1;
      });
      
      console.log('   Phân loại:');
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`      - ${cat}: ${count} món`);
      });
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
      const roleSnapshot = await db.collection('role').get();
      const roleById = new Map(roleSnapshot.docs.map((doc) => [doc.id, doc.data().role_name || doc.data().name || doc.id]));
      const userRoleSnapshot = await db.collection('user_role').get();
      const roleByUserId = new Map(
        userRoleSnapshot.docs.map((doc) => [doc.data().user_id, roleById.get(doc.data().role_id) || 'unknown'])
      );
      const roles: Record<string, number> = {};
      usersSnapshot.docs.forEach(doc => {
        const role = doc.data().role || roleByUserId.get(doc.id) || 'unknown';
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

    // 7. Kiểm tra Material Inventory
    console.log('📦 MATERIAL COLLECTION:');
    const materialSnapshot = await db.collection('material').get();
    console.log(`   Tổng số nguyên liệu: ${materialSnapshot.size}`);

    if (materialSnapshot.size > 0) {
      const materialCategories: Record<string, number> = {};
      const statusCount: Record<string, number> = {};
      materialSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const category = data.category || 'unknown';
        const quantity = Number(data.quantity || 0);
        const minimum = Number(data.minimum || 0);
        const status = quantity <= 0 ? 'out-of-stock' : quantity <= minimum ? 'low-stock' : 'in-stock';
        materialCategories[category] = (materialCategories[category] || 0) + 1;
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      console.log('   Phân loại:');
      Object.entries(materialCategories).forEach(([category, count]) => {
        console.log(`      - ${category}: ${count} nguyên liệu`);
      });
      console.log('   Tồn kho:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count}`);
      });
    }

    const legacyInventorySnapshot = await db.collection('inventory').get();
    if (legacyInventorySnapshot.size > 0) {
      console.log(`   ⚠️  Legacy inventory collection còn ${legacyInventorySnapshot.size} docs (API hiện dùng material)`);
    }
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
    console.log(`   ✅ Material: ${materialSnapshot.size} nguyên liệu`);
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
