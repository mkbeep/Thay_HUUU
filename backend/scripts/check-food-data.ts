/**
 * Check Food Data in Firebase
 * Run: npx ts-node scripts/check-food-data.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

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

async function checkFoodData() {
  console.log('🔍 Checking food data in Firebase...\n');

  try {
    // Check food collection
    const foodSnapshot = await db.collection('food').get();

    if (foodSnapshot.empty) {
      console.log('❌ NO FOOD ITEMS FOUND in Firebase!');
      console.log('\n💡 You need to seed food data first:');
      console.log('   cd backend');
      console.log('   npm run seed');
      return;
    }

    console.log(`✅ Found ${foodSnapshot.size} food items\n`);

    // Check food_image collection
    const imagesSnapshot = await db.collection('food_image').get();
    console.log(`📸 Found ${imagesSnapshot.size} food images\n`);

    // Display sample foods
    console.log('📋 Sample Food Items:\n');
    
    const foods: any[] = foodSnapshot.docs.slice(0, 5).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    for (const food of foods) {
      console.log(`\n📌 ${food.name || 'Unknown'}`);
      console.log(`   ID: ${food.id}`);
      console.log(`   Category: ${food.category || 'N/A'}`);
      console.log(`   Price: ${food.base_price || 0}k`);
      console.log(`   Available: ${food.is_available ? '✅' : '❌'}`);
      
      // Check images for this food
      const foodImages = await db.collection('food_image')
        .where('food_id', '==', food.id)
        .get();
      
      console.log(`   Images: ${foodImages.size}`);
    }

    // Group by category
    console.log('\n\n📊 Food by Category:\n');
    const categories: { [key: string]: number } = {};
    
    foodSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.category || 'Unknown';
      categories[category] = (categories[category] || 0) + 1;
    });

    Object.keys(categories).sort().forEach(category => {
      console.log(`   ${category}: ${categories[category]} items`);
    });

    // Check availability
    const available = foodSnapshot.docs.filter(doc => doc.data().is_available === true).length;
    const unavailable = foodSnapshot.size - available;
    
    console.log('\n\n📈 Availability:');
    console.log(`   ✅ Available: ${available}`);
    console.log(`   ❌ Unavailable: ${unavailable}`);

    console.log('\n\n✅ Food data check completed!');

  } catch (error: any) {
    console.error('❌ Error checking food data:', error);
    
    if (error.code === 9) {
      console.log('\n⚠️  FIRESTORE INDEX ERROR');
      console.log('This error occurs when Firestore needs a composite index.');
      console.log('\nTo fix:');
      console.log('1. Check the error message for the index URL');
      console.log('2. Click the URL to create the index in Firebase Console');
      console.log('3. Wait a few minutes for the index to build');
      console.log('4. Try again');
    }
    
    throw error;
  }
}

// Run the check
checkFoodData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
