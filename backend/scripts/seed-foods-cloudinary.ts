/**
 * Script seed 50 món ăn với ảnh từ Cloudinary
 * Cloud Name: dqnnwl8h8
 * 
 * Chạy: npm run seed:foods-cloudinary
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();
const CLOUDINARY_CLOUD_NAME = 'dqnnwl8h8';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Mapping category chuẩn
const CATEGORY_MAP: { [key: string]: string } = {
  'appetizer': 'appetizers',
  'main_course': 'main-courses',
  'dessert': 'desserts',
  'beverage': 'beverages',
  'special': 'specials',
};

// Dữ liệu 50 món ăn
const FOODS = [
  // APPETIZERS (10 món)
  { name: 'Gỏi cuốn tôm thịt', category: 'appetizer', price: 45000, image: 'goi-cuon.jpg', description: 'Bánh tráng cuốn tôm, thịt, rau sống với nước chấm đặc biệt' },
  { name: 'Nem rán Hà Nội', category: 'appetizer', price: 50000, image: 'nem-ran.jpg', description: 'Nem rán giòn rụm với nhân thịt, miến, nấm' },
  { name: 'Chả giò miền Nam', category: 'appetizer', price: 48000, image: 'cha-gio.jpg', description: 'Chả giò chiên vàng giòn, nhân thịt heo, tôm, rau củ' },
  { name: 'Bánh xèo miền Tây', category: 'appetizer', price: 55000, image: 'banh-xeo.jpg', description: 'Bánh xèo giòn tan với nhân tôm, thịt, giá đỗ' },
  { name: 'Gỏi ngó sen tôm thịt', category: 'appetizer', price: 65000, image: 'goi-ngo-sen.jpg', description: 'Ngó sen giòn ngọt trộn tôm, thịt, rau thơm' },
  { name: 'Chạo tôm Nha Trang', category: 'appetizer', price: 70000, image: 'chao-tom.jpg', description: 'Tôm xay quấn mía nướng thơm lừng' },
  { name: 'Bò nướng lá lốt', category: 'appetizer', price: 68000, image: 'bo-nuong-la-lot.jpg', description: 'Thịt bò xay cuốn lá lốt nướng than' },
  { name: 'Mực chiên giòn', category: 'appetizer', price: 75000, image: 'muc-chien-gion.jpg', description: 'Mực tươi tẩm bột chiên giòn với muối tiêu chanh' },
  { name: 'Súp hải sản', category: 'appetizer', price: 60000, image: 'sup-hai-san.jpg', description: 'Súp đặc sánh với tôm, mực, cua' },
  { name: 'Salad cá hồi', category: 'appetizer', price: 85000, image: 'salad-ca-hoi.jpg', description: 'Cá hồi tươi với rau xà lách, sốt mayonnaise' },

  // MAIN COURSES (10 món)
  { name: 'Lẩu Thái hải sản', category: 'main_course', price: 250000, image: 'lau-thai.jpg', description: 'Lẩu chua cay với tôm, mực, cá, nấm' },
  { name: 'Bò lúc lắc', category: 'main_course', price: 120000, image: 'bo-luc-lac.jpg', description: 'Thịt bò Úc xào lúc lắc với khoai tây chiên' },
  { name: 'Cá kho tộ', category: 'main_course', price: 95000, image: 'ca-kho-to.jpg', description: 'Cá basa kho đậm đà với nước dừa' },
  { name: 'Gà nướng mật ong', category: 'main_course', price: 110000, image: 'ga-nuong-mat-ong.jpg', description: 'Gà tươi ướp mật ong nướng than' },
  { name: 'Sườn nướng BBQ', category: 'main_course', price: 135000, image: 'suon-nuong-bbq.jpg', description: 'Sườn heo nướng sốt BBQ đặc biệt' },
  { name: 'Tôm hùm nướng phô mai', category: 'main_course', price: 450000, image: 'tom-hum-nuong-pho-mai.jpg', description: 'Tôm hùm tươi nướng với phô mai béo ngậy' },
  { name: 'Cơm chiên Dương Châu', category: 'main_course', price: 65000, image: 'com-chien-duong-chau.jpg', description: 'Cơm chiên với tôm, xúc xích, trứng' },
  { name: 'Mì xào hải sản', category: 'main_course', price: 75000, image: 'mi-xao-hai-san.jpg', description: 'Mì xào giòn với tôm, mực, rau củ' },
  { name: 'Bún bò Huế', category: 'main_course', price: 55000, image: 'bun-bo-hue.jpg', description: 'Bún bò cay đặc trưng xứ Huế' },
  { name: 'Phở bò Hà Nội', category: 'main_course', price: 60000, image: 'pho-bo-ha-noi.jpg', description: 'Phở bò truyền thống với nước dùng thơm ngon' },

  // DESSERTS (10 món)
  { name: 'Chè ba màu', category: 'dessert', price: 25000, image: 'che-ba-mau.jpg', description: 'Chè đậu đỏ, đậu xanh, thạch với nước cốt dừa' },
  { name: 'Bánh flan', category: 'dessert', price: 20000, image: 'banh-flan.jpg', description: 'Bánh flan mềm mịn với caramel' },
  { name: 'Chè Thái', category: 'dessert', price: 30000, image: 'che-thai.jpg', description: 'Chè trái cây nhiệt đới với nước cốt dừa' },
  { name: 'Kem tươi', category: 'dessert', price: 35000, image: 'kem-tuoi.jpg', description: 'Kem tươi handmade nhiều vị' },
  { name: 'Yaourt dâu tây', category: 'dessert', price: 28000, image: 'yaourt-da-trai.jpg', description: 'Yaourt tự làm với dâu tây tươi' },
  { name: 'Bánh chuối nướng', category: 'dessert', price: 32000, image: 'banh-chuoi-nuong.jpg', description: 'Bánh chuối nướng thơm lừng với nước cốt dừa' },
  { name: 'Sương sa hạt lựu', category: 'dessert', price: 27000, image: 'suong-sa-hot-luu.jpg', description: 'Sương sa mát lạnh với hạt lựu giòn tan' },
  { name: 'Trái cây tươi', category: 'dessert', price: 40000, image: 'trai-cay-tuoi.jpg', description: 'Đĩa trái cây theo mùa' },
  { name: 'Pudding xoài', category: 'dessert', price: 33000, image: 'pudding-xoai.jpg', description: 'Pudding mềm mịn với xoài tươi' },
  { name: 'Bánh su kem', category: 'dessert', price: 38000, image: 'banh-su-kem.jpg', description: 'Bánh su nhân kem tươi béo ngậy' },

  // BEVERAGES (10 món)
  { name: 'Nước chanh dây', category: 'beverage', price: 25000, image: 'nuoc-chanh-day.jpg', description: 'Nước chanh dây tươi mát' },
  { name: 'Trà đào cam sả', category: 'beverage', price: 30000, image: 'tra-dao-cam-sa.jpg', description: 'Trà đào thơm ngon với cam và sả' },
  { name: 'Cà phê sữa đá', category: 'beverage', price: 22000, image: 'ca-phe-sua-da.jpg', description: 'Cà phê phin truyền thống với sữa đặc' },
  { name: 'Sinh tố bơ', category: 'beverage', price: 35000, image: 'sinh-to-bo.jpg', description: 'Sinh tố bơ béo ngậy' },
  { name: 'Nước dừa tươi', category: 'beverage', price: 20000, image: 'nuoc-dua-tuoi.jpg', description: 'Nước dừa xiêm tươi mát' },
  { name: 'Trà sữa trân châu', category: 'beverage', price: 28000, image: 'tra-sua-tran-chau.jpg', description: 'Trà sữa với trân châu đen dai ngon' },
  { name: 'Nước ép cam', category: 'beverage', price: 30000, image: 'nuoc-ep-cam.jpg', description: 'Nước cam tươi vắt 100%' },
  { name: 'Soda chanh muối', category: 'beverage', price: 25000, image: 'soda-chanh-muoi.jpg', description: 'Soda chanh muối sảng khoái' },
  { name: 'Trà xanh matcha', category: 'beverage', price: 32000, image: 'tra-xanh-matcha.jpg', description: 'Trà xanh matcha Nhật Bản' },
  { name: 'Nước mía', category: 'beverage', price: 18000, image: 'nuoc-mia.jpg', description: 'Nước mía tươi ngọt mát' },

  // SPECIALS (10 món)
  { name: 'Set lẩu hải sản 4 người', category: 'special', price: 800000, image: 'set-lau-hai-san.jpg', description: 'Set lẩu hải sản cao cấp cho 4 người' },
  { name: 'Combo BBQ 2 người', category: 'special', price: 450000, image: 'combo-bbq.jpg', description: 'Combo thịt nướng đa dạng cho 2 người' },
  { name: 'Set dimsum cao cấp', category: 'special', price: 350000, image: 'set-dimsum.jpg', description: '10 loại dimsum đặc sắc' },
  { name: 'Cá lăng nướng muối ớt', category: 'special', price: 550000, image: 'ca-lang-nuong.jpg', description: 'Cá lăng tươi nướng muối ớt (1kg)' },
  { name: 'Vịt quay Bắc Kinh', category: 'special', price: 480000, image: 'vit-quay-bac-kinh.jpg', description: 'Vịt quay giòn da thơm ngon' },
  { name: 'Set sushi cao cấp', category: 'special', price: 420000, image: 'set-sushi.jpg', description: '20 miếng sushi cá hồi, cá ngừ' },
  { name: 'Lẩu nấm chay', category: 'special', price: 280000, image: 'lau-nam-chay.jpg', description: 'Lẩu nấm đa dạng cho người ăn chay' },
  { name: 'Gà ta nguyên con', category: 'special', price: 320000, image: 'ga-ta-nguyen-con.jpg', description: 'Gà ta hấp/nướng nguyên con' },
  { name: 'Set món Nhật 2 người', category: 'special', price: 650000, image: 'set-mon-nhat.jpg', description: 'Set món Nhật đa dạng cho 2 người' },
  { name: 'Hải sản nướng tổng hợp', category: 'special', price: 580000, image: 'hai-san-nuong-tong-hop.jpg', description: 'Tôm, mực, sò, nghêu nướng' },
];

/**
 * Tạo Cloudinary URL
 */
function getCloudinaryUrl(category: string, filename: string): string {
  const folder = CATEGORY_MAP[category];
  return `${CLOUDINARY_BASE_URL}/menu/${folder}/${filename}`;
}

/**
 * Xóa tất cả dữ liệu cũ
 */
async function clearOldData() {
  console.log('🗑️  Xóa dữ liệu cũ...');
  
  // Xóa food_image
  const imagesSnapshot = await db.collection('food_image').get();
  const imageBatch = db.batch();
  imagesSnapshot.docs.forEach(doc => imageBatch.delete(doc.ref));
  await imageBatch.commit();
  console.log(`   ✅ Đã xóa ${imagesSnapshot.size} ảnh`);
  
  // Xóa food
  const foodsSnapshot = await db.collection('food').get();
  const foodBatch = db.batch();
  foodsSnapshot.docs.forEach(doc => foodBatch.delete(doc.ref));
  await foodBatch.commit();
  console.log(`   ✅ Đã xóa ${foodsSnapshot.size} món ăn`);
}

/**
 * Seed dữ liệu
 */
async function seedData() {
  console.log('\n📝 Bắt đầu seed dữ liệu...\n');
  
  let foodCount = 0;
  let imageCount = 0;
  
  for (const food of FOODS) {
    // Tạo food
    const foodRef = db.collection('food').doc();
    await foodRef.set({
      name: food.name,
      description: food.description,
      base_price: food.price,
      category: food.category,
      is_available: true,
      preparation_time: 15,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    foodCount++;
    
    // Tạo food_image
    const imageUrl = getCloudinaryUrl(food.category, food.image);
    const imageRef = db.collection('food_image').doc();
    await imageRef.set({
      food_id: foodRef.id,
      image_url: imageUrl,
      is_primary: true,
      display_order: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    imageCount++;
    
    console.log(`✅ ${food.name} (${food.category})`);
    console.log(`   📸 ${imageUrl}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ HOÀN THÀNH SEED!');
  console.log('='.repeat(70));
  console.log(`📊 Thống kê:`);
  console.log(`   - Món ăn: ${foodCount}`);
  console.log(`   - Ảnh: ${imageCount}`);
  console.log(`\n💡 Bước tiếp theo:`);
  console.log(`   1. Kiểm tra: npm run check:food`);
  console.log(`   2. Test API: curl http://192.168.1.7:3000/api/v1/foods`);
  console.log(`   3. Mở Admin Web: http://192.168.1.7:5173`);
  console.log(`   4. Mở Mobile App và kiểm tra menu`);
}

/**
 * Main
 */
async function main() {
  try {
    console.log('🚀 SEED FOODS VỚI CLOUDINARY IMAGES');
    console.log('='.repeat(70));
    console.log(`☁️  Cloud Name: ${CLOUDINARY_CLOUD_NAME}`);
    console.log(`🔗 Base URL: ${CLOUDINARY_BASE_URL}`);
    console.log('='.repeat(70));
    
    await clearOldData();
    await seedData();
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ LỖI:', error.message);
    process.exit(1);
  }
}

main();
