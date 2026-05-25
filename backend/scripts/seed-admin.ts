/**
 * Seed Admin User
 * Tạo tài khoản admin mặc định
 */

import { db } from '../src/infrastructure/config/firebase.config';
import * as bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...');

    // 1. Tạo hoặc lấy roles
    const roles = ['admin', 'manager', 'staff'];
    const roleIds: { [key: string]: string } = {};

    for (const roleName of roles) {
      const existingRole = await db.collection('role')
        .where('role_name', '==', roleName)
        .limit(1)
        .get();

      if (existingRole.empty) {
        const roleData = {
          role_name: roleName,
          description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
          permissions: [],
          created_at: new Date(),
          updated_at: new Date(),
        };
        const roleRef = await db.collection('role').add(roleData);
        roleIds[roleName] = roleRef.id;
        console.log(`✅ Created role: ${roleName}`);
      } else {
        roleIds[roleName] = existingRole.docs[0].id;
        console.log(`ℹ️  Role ${roleName} already exists`);
      }
    }

    // 2. Tạo Admin User
    const adminEmail = 'admin@restaurant.com';
    const existingAdmin = await db.collection('users')
      .where('email', '==', adminEmail)
      .limit(1)
      .get();

    let adminUserId: string;

    if (existingAdmin.empty) {
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);
      const adminData = {
        email: adminEmail,
        password: hashedPassword,
        full_name: 'Admin User',
        phone_number: '0901234567',
        is_active: true,
        email_verified: true,
        avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCznXIT2M2jGQTSPmUDv6ehnbXsyBDkJKZXBkXu0nGV0gNOdFs04N22RveuUGsej1T1kgffMRLS-PcV31O3qNEXzK8rToKxV5t5gU0vEDt1oNiEJKnlcFvcEomQBKN9KzYDBgEEj0HcP8ai8juyIEujPg_kAVSdC1U9uazsGlD3i0HeDNVdQALfPlebOgXJWwLy0kfoRLMDHrWZu0UWSeyaf4be0dLwmEoB7BHv0_96ocKYLGfF4CWIK569lWLKgBrytOAng44FYQ',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const docRef = await db.collection('users').add(adminData);
      adminUserId = docRef.id;
      console.log('✅ Admin user created!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password: Admin@123456');
      console.log('🆔 User ID:', adminUserId);
    } else {
      adminUserId = existingAdmin.docs[0].id;
      console.log('⚠️  Admin user already exists');
    }

    // 3. Gán role admin cho user
    const existingUserRole = await db.collection('user_role')
      .where('user_id', '==', adminUserId)
      .where('role_id', '==', roleIds['admin'])
      .limit(1)
      .get();

    if (existingUserRole.empty) {
      await db.collection('user_role').add({
        user_id: adminUserId,
        role_id: roleIds['admin'],
        assigned_at: new Date(),
        assigned_by: 'system',
      });
      console.log('✅ Admin role assigned to user');
    }

    // 4. Tạo Manager User
    const managerEmail = 'manager@gourmet.com';
    const existingManager = await db.collection('users')
      .where('email', '==', managerEmail)
      .limit(1)
      .get();

    let managerUserId: string;

    if (existingManager.empty) {
      const managerPassword = await bcrypt.hash('manager123', 10);
      const managerData = {
        email: managerEmail,
        password: managerPassword,
        full_name: 'Manager User',
        phone_number: '0909876543',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const managerRef = await db.collection('users').add(managerData);
      managerUserId = managerRef.id;
      console.log('✅ Manager user created!');
      console.log('📧 Email:', managerEmail);
      console.log('🔑 Password: manager123');
      console.log('🆔 User ID:', managerUserId);
    } else {
      managerUserId = existingManager.docs[0].id;
      console.log('⚠️  Manager user already exists');
    }

    // 5. Gán role manager
    const existingManagerRole = await db.collection('user_role')
      .where('user_id', '==', managerUserId)
      .where('role_id', '==', roleIds['manager'])
      .limit(1)
      .get();

    if (existingManagerRole.empty) {
      await db.collection('user_role').add({
        user_id: managerUserId,
        role_id: roleIds['manager'],
        assigned_at: new Date(),
        assigned_by: 'system',
      });
      console.log('✅ Manager role assigned to user');
    }

    // 6. Tạo Staff User
    const staffEmail = 'staff@gourmet.com';
    const existingStaff = await db.collection('users')
      .where('email', '==', staffEmail)
      .limit(1)
      .get();

    let staffUserId: string;

    if (existingStaff.empty) {
      const staffPassword = await bcrypt.hash('staff123', 10);
      const staffData = {
        email: staffEmail,
        password: staffPassword,
        full_name: 'Staff User',
        phone_number: '0907654321',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const staffRef = await db.collection('users').add(staffData);
      staffUserId = staffRef.id;
      console.log('✅ Staff user created!');
      console.log('📧 Email:', staffEmail);
      console.log('🔑 Password: staff123');
      console.log('🆔 User ID:', staffUserId);
    } else {
      staffUserId = existingStaff.docs[0].id;
      console.log('⚠️  Staff user already exists');
    }

    // 7. Gán role staff
    const existingStaffRole = await db.collection('user_role')
      .where('user_id', '==', staffUserId)
      .where('role_id', '==', roleIds['staff'])
      .limit(1)
      .get();

    if (existingStaffRole.empty) {
      await db.collection('user_role').add({
        user_id: staffUserId,
        role_id: roleIds['staff'],
        assigned_at: new Date(),
        assigned_by: 'system',
      });
      console.log('✅ Staff role assigned to user');
    }

    console.log('\n🎉 All users seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: admin@restaurant.com / Admin@123456');
    console.log('Manager: manager@gourmet.com / manager123');
    console.log('Staff: staff@gourmet.com / staff123');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  }
}

// Run seed
seedAdmin()
  .then(() => {
    console.log('✅ Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
