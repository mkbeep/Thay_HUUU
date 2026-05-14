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

    const batchDeletes = async (coll: string) => {
      const snap = await db.collection(coll).get();
      for (let i = 0; i < snap.docs.length; i += 450) {
        const b = db.batch();
        snap.docs.slice(i, i + 450).forEach((doc) => b.delete(doc.ref));
        await b.commit();
      }
      console.log(`✅ ${coll}: đã xóa ${snap.size}`);
    };

    await batchDeletes('orders');

    // Xóa order_item_topping trước (FK → order_item)
    const toppingSnap = await db.collection('order_item_topping').get();
    for (let i = 0; i < toppingSnap.docs.length; i += 450) {
      const b = db.batch();
      toppingSnap.docs.slice(i, i + 450).forEach((doc) => b.delete(doc.ref));
      await b.commit();
    }
    console.log(`✅ order_item_topping: đã xóa ${toppingSnap.size}`);

    // Xóa order_item (tên collection đúng là order_item, không phải order_items)
    const orderItemsSnapshot = await db.collection('order_item').get();
    console.log(`📦 Found ${orderItemsSnapshot.size} order_item to delete`);

    for (let i = 0; i < orderItemsSnapshot.docs.length; i += 450) {
      const itemsBatch = db.batch();
      orderItemsSnapshot.docs.slice(i, i + 450).forEach((doc) => {
        itemsBatch.delete(doc.ref);
      });
      await itemsBatch.commit();
    }
    console.log('✅ All order_item deleted successfully!');

    const kitchenSnap = await db.collection('kitchen_ticket').get();
    for (let i = 0; i < kitchenSnap.docs.length; i += 450) {
      const kb = db.batch();
      kitchenSnap.docs.slice(i, i + 450).forEach((doc) => kb.delete(doc.ref));
      await kb.commit();
    }
    console.log(`✅ kitchen_ticket: đã xóa ${kitchenSnap.size}`);

    console.log('🎉 Database cleared! Ready for fresh testing.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing orders:', error);
    process.exit(1);
  }
}

clearOrders();
