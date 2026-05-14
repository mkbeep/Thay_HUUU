/**
 * Check Notifications in Firebase
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

async function checkNotifications() {
  console.log('🔍 Checking notifications in Firebase...\n');

  try {
    const snapshot = await db.collection('notifications').get();
    
    console.log(`📬 Found ${snapshot.size} notifications\n`);
    
    if (snapshot.empty) {
      console.log('❌ NO NOTIFICATIONS FOUND!');
      console.log('\n💡 Notifications are created automatically when:');
      console.log('   - New orders are placed');
      console.log('   - Orders status changes');
      console.log('   - Support requests are made');
      console.log('\n📝 To test: Create an order from Customer App');
      return;
    }

    console.log('📋 Sample notifications:\n');
    
    snapshot.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`\n📌 ${data.title || 'No title'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Type: ${data.type || 'N/A'}`);
      console.log(`   Read: ${data.is_read ? '✅' : '❌'}`);
      console.log(`   Created: ${data.created_at?.toDate?.() || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkNotifications()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
