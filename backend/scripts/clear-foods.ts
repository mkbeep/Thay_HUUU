import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, "../.env") });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

async function clearCollections() {
  console.log("🗑️  Xóa dữ liệu cũ...");
  
  const foodSnapshot = await db.collection("food").get();
  const imageSnapshot = await db.collection("food_image").get();
  
  const batch = db.batch();
  foodSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  imageSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
  console.log("✅ Đã xóa xong!");
  process.exit(0);
}

clearCollections();
