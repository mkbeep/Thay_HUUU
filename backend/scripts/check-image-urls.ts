/**
 * Check Image URLs in Firebase
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

async function checkImageUrls() {
  console.log('🔍 Checking image URLs in Firebase...\n');

  try {
    const imagesSnapshot = await db.collection('food_image').limit(10).get();
    
    console.log(`📸 Sample of ${imagesSnapshot.size} images:\n`);
    
    for (const doc of imagesSnapshot.docs) {
      const data = doc.data();
      console.log(`\n📌 Image ID: ${doc.id}`);
      console.log(`   Food ID: ${data.food_id}`);
      console.log(`   URL: ${data.image_url}`);
      console.log(`   Type: ${data.image_url?.includes('cloudinary') ? '☁️  Cloudinary' : '💾 Local/Backend'}`);
    }

    // Count by type
    const allImages = await db.collection('food_image').get();
    let cloudinaryCount = 0;
    let localCount = 0;
    
    allImages.docs.forEach(doc => {
      const url = doc.data().image_url || '';
      if (url.includes('cloudinary')) {
        cloudinaryCount++;
      } else {
        localCount++;
      }
    });

    console.log(`\n\n📊 Image Storage Summary:`);
    console.log(`   ☁️  Cloudinary: ${cloudinaryCount}`);
    console.log(`   💾 Local/Backend: ${localCount}`);
    console.log(`   📦 Total: ${allImages.size}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkImageUrls()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
