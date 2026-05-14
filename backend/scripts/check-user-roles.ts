/**
 * Check User Roles in Firebase
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

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

async function checkUserRoles() {
  console.log('🔍 Checking user roles in Firebase...\n');

  try {
    // Check users
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 Found ${usersSnapshot.size} users\n`);

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      console.log(`\n📌 ${data.name || data.email}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Role: ${data.role || 'N/A'}`);
      console.log(`   Active: ${data.is_active ? '✅' : '❌'}`);
    }

    // Check user_role collection
    const userRolesSnapshot = await db.collection('user_role').get();
    console.log(`\n\n🎭 Found ${userRolesSnapshot.size} user_role records\n`);

    if (userRolesSnapshot.empty) {
      console.log('⚠️  NO USER_ROLE RECORDS FOUND!');
      console.log('\n💡 This might cause notification issues.');
      console.log('   Run: npm run seed:admin to create user roles');
    } else {
      // Get role names
      const roleMap: { [key: string]: string } = {};
      const rolesSnapshot = await db.collection('role').get();
      rolesSnapshot.docs.forEach(doc => {
        roleMap[doc.id] = doc.data().role_name || 'unknown';
      });

      for (const doc of userRolesSnapshot.docs) {
        const data = doc.data();
        const roleName = roleMap[data.role_id] || 'unknown';
        console.log(`\n📌 User Role Record`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   User ID: ${data.user_id || 'N/A'}`);
        console.log(`   Role ID: ${data.role_id || 'N/A'}`);
        console.log(`   Role Name: ${roleName}`);
      }
    }

    // Summary
    console.log('\n\n📊 Summary:');
    const roleCount: { [key: string]: number } = {};
    usersSnapshot.docs.forEach(doc => {
      const role = doc.data().role || 'unknown';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    Object.keys(roleCount).sort().forEach(role => {
      console.log(`   ${role}: ${roleCount[role]}`);
    });

    // Check for required roles
    const requiredRoles = ['admin', 'manager', 'staff', 'cashier', 'chef'];
    const missingRoles = requiredRoles.filter(role => !roleCount[role]);
    
    if (missingRoles.length > 0) {
      console.log(`\n⚠️  Missing roles: ${missingRoles.join(', ')}`);
      console.log('   These roles are needed for notifications to work properly');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkUserRoles()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
