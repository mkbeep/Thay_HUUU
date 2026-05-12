import admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase Admin
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

async function clearOrders() {
  try {
    console.log('🗑️  Starting to clear all orders...');

    // Xóa tất cả orders
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`📦 Found ${ordersSnapshot.size} orders to delete`);

    const batch = db.batch();
    ordersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('✅ All orders deleted successfully!');

    // Xóa tất cả order_items
    const orderItemsSnapshot = await db.collection('order_items').get();
    console.log(`📦 Found ${orderItemsSnapshot.size} order items to delete`);

    const itemsBatch = db.batch();
    orderItemsSnapshot.docs.forEach((doc) => {
      itemsBatch.delete(doc.ref);
    });

    await itemsBatch.commit();
    console.log('✅ All order items deleted successfully!');

    console.log('🎉 Database cleared! Ready for fresh testing.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing orders:', error);
    process.exit(1);
  }
}

clearOrders();
