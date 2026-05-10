/**
 * Script tự động kiểm tra và seed data nếu cần
 * Chạy: npm run auto-seed
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

// Import seed data
const foods = [
  // KHAI VỊ (10 món)
  {
    name: 'Gỏi cuốn tôm thịt',
    description: 'Gỏi cuốn tươi ngon với tôm, thịt heo, bún, rau sống cuốn bánh tráng, chấm nước mắm chua ngọt',
    base_price: 45000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/goi-cuon.jpg', is_primary: true }],
  },
  {
    name: 'Nem rán giòn',
    description: 'Nem rán truyền thống với nhân thịt, miến, nấm mèo, rau củ, chiên giòn vàng',
    base_price: 50000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/nem-ran.jpg', is_primary: true }],
  },
  {
    name: 'Salad cá hồi hun khói',
    description: 'Salad rau xanh tươi mát với cá hồi hun khói, phô mai, sốt dầu giấm balsamic',
    base_price: 85000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/salad-ca-hoi.jpg', is_primary: true }],
  },
  {
    name: 'Súp hải sản đặc biệt',
    description: 'Súp hải sản đậm đà với tôm, mực, nghêu, cua, nấm và kem tươi',
    base_price: 75000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/sup-hai-san.jpg', is_primary: true }],
  },
  {
    name: 'Chạo tôm Nha Trang',
    description: 'Tôm tươi xay nhuyễn, quấn mía, nướng thơm, ăn kèm rau sống và nước chấm',
    base_price: 95000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/chao-tom.jpg', is_primary: true }],
  },
  {
    name: 'Gỏi ngó sen tôm thịt',
    description: 'Ngó sen giòn ngọt, tôm tươi, thịt heo, rau thơm, nước mắm chua ngọt',
    base_price: 65000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/goi-ngo-sen.jpg', is_primary: true }],
  },
  {
    name: 'Mực chiên giòn',
    description: 'Mực tươi tẩm bột chiên giòn, ăn kèm sốt mayonnaise và chanh muối',
    base_price: 80000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/muc-chien-gion.jpg', is_primary: true }],
  },
  {
    name: 'Bò nướng lá lốt',
    description: 'Thịt bò thăn cuộn lá lốt nướng than hoa, thơm nức mũi',
    base_price: 70000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/bo-nuong-la-lot.jpg', is_primary: true }],
  },
  {
    name: 'Bánh xèo miền Tây',
    description: 'Bánh xèo giòn rụm với nhân tôm, thịt, giá đỗ, ăn kèm rau sống',
    base_price: 55000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/banh-xeo.jpg', is_primary: true }],
  },
  {
    name: 'Chả giò Hà Nội',
    description: 'Chả giò truyền thống Hà Nội với nhân thịt, miến, nấm, chiên vàng giòn',
    base_price: 48000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    images: [{ image_url: 'menu/appetizers/cha-gio.jpg', is_primary: true }],
  },
];

async function checkAndSeedFoods() {
  console.log('🔍 Kiểm tra dữ liệu Foods trong Firebase...\n');

  try {
    const foodsCollection = db.collection('food');
    const snapshot = await foodsCollection.get();

    console.log(`📊 Hiện có: ${snapshot.size} món trong Firebase`);

    if (snapshot.size > 0) {
      // Phân tích theo category
      const categories: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const category = doc.data().category || 'Unknown';
        categories[category] = (categories[category] || 0) + 1;
      });

      console.log('\n📋 Phân loại hiện tại:');
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count} món`);
      });

      console.log('\n✅ Dữ liệu đã có sẵn. Không cần seed.');
      process.exit(0);
    }

    console.log('\n⚠️  Chưa có dữ liệu Foods. Bắt đầu seed...\n');
    
    const foodImagesCollection = db.collection('food_image');

    // Seed 10 món khai vị trước
    let count = 0;
    for (const food of foods) {
      const { images, ...baseFoodData } = food;
      const foodData = {
        ...baseFoodData,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      const foodDoc = await foodsCollection.add(foodData);

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await foodImagesCollection.add({
            food_id: foodDoc.id,
            image_url: images[i].image_url,
            is_primary: images[i].is_primary,
            display_order: i,
            uploaded_at: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      count++;
      console.log(`✅ [${count}/10] Đã thêm: ${food.name}`);
    }

    console.log('\n🎉 Hoàn thành seed 10 món Khai vị!');
    console.log('\n💡 Để seed đầy đủ 50 món, chạy: npm run seed:50foods');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

checkAndSeedFoods();
