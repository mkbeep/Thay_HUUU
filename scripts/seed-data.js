const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
  role: String,
  isActive: Boolean,
}, { timestamps: true });

// Menu Schema
const menuSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  isAvailable: Boolean,
}, { timestamps: true });

// Table Schema
const tableSchema = new mongoose.Schema({
  tableNumber: String,
  capacity: Number,
  status: String,
  currentSession: String,
}, { timestamps: true });

async function seedData() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    
    // Kết nối các database
    const authConn = await mongoose.createConnection(`${MONGODB_URI}/restaurant-auth`).asPromise();
    const menuConn = await mongoose.createConnection(`${MONGODB_URI}/restaurant-menu`).asPromise();
    const tableConn = await mongoose.createConnection(`${MONGODB_URI}/restaurant-tables`).asPromise();
    
    console.log('✅ Đã kết nối MongoDB');

    // Models
    const User = authConn.model('User', userSchema);
    const MenuItem = menuConn.model('MenuItem', menuSchema);
    const Table = tableConn.model('Table', tableSchema);

    // Xóa dữ liệu cũ
    console.log('🗑️  Xóa dữ liệu cũ...');
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});

    // Tạo users
    console.log('👥 Tạo tài khoản nhân viên...');
    const users = [
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'Quản trị viên',
        role: 'ADMIN',
        isActive: true,
      },
      {
        username: 'manager',
        password: await bcrypt.hash('manager123', 10),
        fullName: 'Nguyễn Văn A',
        role: 'MANAGER',
        isActive: true,
      },
      {
        username: 'waiter',
        password: await bcrypt.hash('waiter123', 10),
        fullName: 'Trần Thị B',
        role: 'WAITER',
        isActive: true,
      },
      {
        username: 'chef',
        password: await bcrypt.hash('chef123', 10),
        fullName: 'Lê Văn C',
        role: 'CHEF',
        isActive: true,
      },
    ];
    await User.insertMany(users);
    console.log('✅ Đã tạo 4 tài khoản');

    // Tạo menu items
    console.log('🍽️  Tạo thực đơn...');
    const menuItems = [
      {
        name: 'Phở bò',
        description: 'Phở bò truyền thống Hà Nội',
        price: 50000,
        category: 'Món chính',
        isAvailable: true,
      },
      {
        name: 'Bún chả',
        description: 'Bún chả Hà Nội đặc biệt',
        price: 45000,
        category: 'Món chính',
        isAvailable: true,
      },
      {
        name: 'Cơm tấm',
        description: 'Cơm tấm sườn bì chả',
        price: 40000,
        category: 'Món chính',
        isAvailable: true,
      },
      {
        name: 'Gỏi cuốn',
        description: 'Gỏi cuốn tôm thịt',
        price: 30000,
        category: 'Khai vị',
        isAvailable: true,
      },
      {
        name: 'Chả giò',
        description: 'Chả giò chiên giòn',
        price: 35000,
        category: 'Khai vị',
        isAvailable: true,
      },
      {
        name: 'Trà đá',
        description: 'Trà đá miễn phí',
        price: 0,
        category: 'Đồ uống',
        isAvailable: true,
      },
      {
        name: 'Nước ngọt',
        description: 'Coca, Pepsi, 7Up',
        price: 15000,
        category: 'Đồ uống',
        isAvailable: true,
      },
      {
        name: 'Trà sữa',
        description: 'Trà sữa trân châu đường đen',
        price: 25000,
        category: 'Đồ uống',
        isAvailable: true,
      },
      {
        name: 'Bánh flan',
        description: 'Bánh flan caramen',
        price: 20000,
        category: 'Tráng miệng',
        isAvailable: true,
      },
      {
        name: 'Chè ba màu',
        description: 'Chè ba màu truyền thống',
        price: 18000,
        category: 'Tráng miệng',
        isAvailable: true,
      },
    ];
    await MenuItem.insertMany(menuItems);
    console.log('✅ Đã tạo 10 món ăn');

    // Tạo tables
    console.log('🪑 Tạo bàn...');
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push({
        tableNumber: i.toString(),
        capacity: i <= 5 ? 4 : 6,
        status: 'AVAILABLE',
        currentSession: null,
      });
    }
    await Table.insertMany(tables);
    console.log('✅ Đã tạo 10 bàn');

    console.log('\n🎉 Seed data thành công!\n');
    console.log('📋 Thông tin đăng nhập:');
    console.log('┌──────────┬──────────────┬─────────┐');
    console.log('│ Username │ Password     │ Role    │');
    console.log('├──────────┼──────────────┼─────────┤');
    console.log('│ admin    │ admin123     │ ADMIN   │');
    console.log('│ manager  │ manager123   │ MANAGER │');
    console.log('│ waiter   │ waiter123    │ WAITER  │');
    console.log('│ chef     │ chef123      │ CHEF    │');
    console.log('└──────────┴──────────────┴─────────┘\n');

    await authConn.close();
    await menuConn.close();
    await tableConn.close();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

seedData();
