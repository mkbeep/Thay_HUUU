/**
 * Role Seeder
 * Tạo dữ liệu roles và permissions
 */

import { db } from '../../config/firebase.config';

export async function seedRoles() {
  const roles = [
    {
      role_name: 'admin',
      description: 'Quản trị viên hệ thống - Có toàn quyền truy cập',
      permissions: [
        'user.create',
        'user.read',
        'user.update',
        'user.delete',
        'food.create',
        'food.read',
        'food.update',
        'food.delete',
        'order.create',
        'order.read',
        'order.update',
        'order.delete',
        'table.create',
        'table.read',
        'table.update',
        'table.delete',
        'inventory.create',
        'inventory.read',
        'inventory.update',
        'inventory.delete',
        'promotion.create',
        'promotion.read',
        'promotion.update',
        'promotion.delete',
        'report.read',
        'settings.update',
      ],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      role_name: 'manager',
      description: 'Quản lý nhà hàng - Quản lý hoạt động hàng ngày',
      permissions: [
        'food.create',
        'food.read',
        'food.update',
        'order.read',
        'order.update',
        'table.create',
        'table.read',
        'table.update',
        'inventory.read',
        'inventory.update',
        'promotion.read',
        'report.read',
      ],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      role_name: 'staff',
      description: 'Nhân viên phục vụ - Xử lý đơn hàng và phục vụ khách',
      permissions: [
        'food.read',
        'order.create',
        'order.read',
        'order.update',
        'table.read',
        'table.update',
        'inventory.read',
      ],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      role_name: 'chef',
      description: 'Đầu bếp - Quản lý bếp và chuẩn bị món ăn',
      permissions: [
        'food.read',
        'order.read',
        'order.update',
        'inventory.read',
        'inventory.update',
      ],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      role_name: 'customer',
      description: 'Khách hàng - Đặt món và thanh toán',
      permissions: [
        'food.read',
        'order.create',
        'order.read',
        'promotion.read',
      ],
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const createdRoles = [];
  for (const role of roles) {
    const docRef = await db.collection('role').add(role);
    createdRoles.push({ id: docRef.id, ...role });
  }

  return createdRoles;
}
