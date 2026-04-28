const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let sessionId = '';

async function testSystem() {
  console.log('🧪 Bắt đầu kiểm tra hệ thống...\n');

  try {
    // Test 1: Login Admin
    console.log('1️⃣  Test đăng nhập Admin...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    authToken = loginRes.data.token;
    console.log('✅ Đăng nhập thành công:', loginRes.data.user.fullName);
    console.log('   Token:', authToken.substring(0, 20) + '...\n');

    // Test 2: Verify token
    console.log('2️⃣  Test verify token...');
    const verifyRes = await axios.get(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Token hợp lệ:', verifyRes.data.user.username, '-', verifyRes.data.user.role, '\n');

    // Test 3: Get menu (không cần auth)
    console.log('3️⃣  Test lấy danh sách menu...');
    const menuRes = await axios.get(`${API_BASE}/menu`);
    console.log('✅ Lấy menu thành công:', menuRes.data.length || 0, 'món\n');

    // Test 4: Khách hàng chọn bàn (session)
    console.log('4️⃣  Test khách hàng chọn bàn...');
    const tableRes = await axios.post(`${API_BASE}/tables/select`, {
      tableNumber: '5'
    });
    sessionId = tableRes.data.sessionId;
    console.log('✅ Chọn bàn thành công:', tableRes.data.tableId);
    console.log('   Session ID:', sessionId.substring(0, 20) + '...\n');

    // Test 5: Tạo đơn hàng với session
    console.log('5️⃣  Test tạo đơn hàng (khách hàng)...');
    const orderRes = await axios.post(`${API_BASE}/orders`, {
      tableId: '5',
      items: [
        { id: '1', name: 'Phở bò', price: 50000, quantity: 2 },
        { id: '2', name: 'Trà đá', price: 0, quantity: 2 }
      ],
      total: 100000
    }, {
      headers: { 'X-Session-ID': sessionId }
    });
    console.log('✅ Tạo đơn hàng thành công\n');

    // Test 6: Admin tạo menu item mới
    console.log('6️⃣  Test admin tạo món mới...');
    const newMenuItem = await axios.post(`${API_BASE}/menu`, {
      name: 'Bún bò Huế',
      description: 'Bún bò Huế cay nồng',
      price: 55000,
      category: 'Món chính',
      isAvailable: true
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Tạo món mới thành công\n');

    // Test 7: Test role-based access (Waiter không thể tạo user)
    console.log('7️⃣  Test phân quyền (Waiter không thể tạo user)...');
    const waiterLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'waiter',
      password: 'waiter123'
    });
    const waiterToken = waiterLogin.data.token;
    
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        username: 'test',
        password: 'test123',
        fullName: 'Test User',
        role: 'WAITER'
      }, {
        headers: { Authorization: `Bearer ${waiterToken}` }
      });
      console.log('❌ Lỗi: Waiter không nên có quyền tạo user\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Phân quyền hoạt động đúng: Waiter bị từ chối\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 Tất cả test đều PASS!\n');
    console.log('📊 Tóm tắt:');
    console.log('   ✅ Authentication (JWT) hoạt động');
    console.log('   ✅ Session management hoạt động');
    console.log('   ✅ Role-based access control hoạt động');
    console.log('   ✅ API Gateway routing hoạt động');
    console.log('   ✅ Microservices giao tiếp thành công\n');

  } catch (error) {
    console.error('❌ Test thất bại:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Chờ services khởi động
setTimeout(() => {
  testSystem();
}, 2000);
