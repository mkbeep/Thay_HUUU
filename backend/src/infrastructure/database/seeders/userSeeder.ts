/**
 * User Seeder
 * Tạo dữ liệu users mẫu
 */

import { db } from '../../config/firebase.config';
import bcrypt from 'bcryptjs';

export async function seedUsers(roles: any[]) {
  const adminRole = roles.find(r => r.role_name === 'admin');
  const managerRole = roles.find(r => r.role_name === 'manager');
  const staffRole = roles.find(r => r.role_name === 'staff');
  const chefRole = roles.find(r => r.role_name === 'chef');
  const customerRole = roles.find(r => r.role_name === 'customer');

  const users = [
    {
      email: 'admin@restaurant.com',
      password: await bcrypt.hash('Admin@123456', 10),
      full_name: 'Nguyễn Văn Admin',
      phone_number: '0901234567',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role_id: adminRole.id,
    },
    {
      email: 'manager@restaurant.com',
      password: await bcrypt.hash('Manager@123', 10),
      full_name: 'Trần Thị Quản Lý',
      phone_number: '0902345678',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role_id: managerRole.id,
    },
    {
      email: 'staff1@restaurant.com',
      password: await bcrypt.hash('Staff@123', 10),
      full_name: 'Lê Văn Nhân Viên',
      phone_number: '0903456789',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role_id: staffRole.id,
    },
    {
      email: 'staff2@restaurant.com',
      password: await bcrypt.hash('Staff@123', 10),
      full_name: 'Phạm Thị Hoa',
      phone_number: '0904567890',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role_id: staffRole.id,
    },
    {
      email: 'chef@restaurant.com',
      password: await bcrypt.hash('Chef@123', 10),
      full_name: 'Hoàng Văn Đầu Bếp',
      phone_number: '0905678901',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role_id: chefRole.id,
    },
    {
      email: 'customer1@gmail.com',
      password: await bcrypt.hash('Customer@123', 10),
      full_name: 'Nguyễn Thị Khách',
      phone_number: '0906789012',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role_id: customerRole.id,
    },
    {
      email: 'customer2@gmail.com',
      password: await bcrypt.hash('Customer@123', 10),
      full_name: 'Trần Văn Minh',
      phone_number: '0907890123',
      is_active: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
      role_id: customerRole.id,
    },
  ];

  const createdUsers = [];
  for (const user of users) {
    const { role_id, ...userData } = user;
    
    // Create user
    const userRef = await db.collection('users').add(userData);
    
    // Assign role
    await db.collection('user_role').add({
      user_id: userRef.id,
      role_id: role_id,
      assigned_at: new Date(),
      assigned_by: 'system',
    });

    createdUsers.push({ id: userRef.id, ...userData });
  }

  return createdUsers;
}
