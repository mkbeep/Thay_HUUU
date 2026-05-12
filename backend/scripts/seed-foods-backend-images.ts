/**
 * Script seed 50 món ăn với ảnh từ Backend static hoặc Cloudinary
 * - npm run seed:foods-backend
 * - npm run seed:foods-cloudinary
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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

// Backend server URL (fallback)
const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.1.7:3000';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dqnnwl8h8';
const USE_CLOUDINARY = (process.env.IMAGE_PROVIDER || '').toLowerCase() === 'cloudinary';

/**
 * Tạo image URL theo provider
 */
function getImageUrl(imagePath: string): string {
  if (USE_CLOUDINARY) {
    // URL deterministic: image/upload/menu/<category>/<file>
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${imagePath}`;
  }
  return `${BACKEND_URL}/images/${imagePath}`;
}

// 50 món ăn với đường dẫn ảnh
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
    image_path: 'menu/appetizers/goi-cuon.jpg',
  },
  {
    name: 'Nem rán giòn',
    description: 'Nem rán truyền thống với nhân thịt, miến, nấm mèo, rau củ, chiên giòn vàng',
    base_price: 50000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/nem-ran.jpg',
  },
  {
    name: 'Salad cá hồi hun khói',
    description: 'Salad rau xanh tươi mát với cá hồi hun khói, phô mai, sốt dầu giấm balsamic',
    base_price: 85000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/salad-ca-hoi.jpg',
  },
  {
    name: 'Súp hải sản đặc biệt',
    description: 'Súp hải sản đậm đà với tôm, mực, nghêu, cua, nấm và kem tươi',
    base_price: 75000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/sup-hai-san.jpg',
  },
  {
    name: 'Chạo tôm Nha Trang',
    description: 'Tôm tươi xay nhuyễn, quấn mía, nướng thơm, ăn kèm rau sống và nước chấm',
    base_price: 95000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/chao-tom.jpg',
  },
  {
    name: 'Gỏi ngó sen tôm thịt',
    description: 'Ngó sen giòn ngọt, tôm tươi, thịt heo, rau thơm, nước mắm chua ngọt',
    base_price: 65000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/goi-ngo-sen.jpg',
  },
  {
    name: 'Mực chiên giòn',
    description: 'Mực tươi tẩm bột chiên giòn, ăn kèm sốt mayonnaise và chanh muối',
    base_price: 80000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/muc-chien-gion.jpg',
  },
  {
    name: 'Bò nướng lá lốt',
    description: 'Thịt bò thăn cuộn lá lốt nướng than hoa, thơm nức mũi',
    base_price: 70000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/bo-nuong-la-lot.jpg',
  },
  {
    name: 'Bánh xèo miền Tây',
    description: 'Bánh xèo giòn rụm với nhân tôm, thịt, giá đỗ, ăn kèm rau sống',
    base_price: 55000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/banh-xeo.jpg',
  },
  {
    name: 'Chả giò Hà Nội',
    description: 'Chả giò truyền thống Hà Nội với nhân thịt, miến, nấm, chiên vàng giòn',
    base_price: 48000,
    category: 'Khai vị',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/appetizers/cha-gio.jpg',
  },

  // MÓN CHÍNH (10 món)
  {
    name: 'Lẩu Thái hải sản',
    description: 'Lẩu Thái chua cay đậm đà với tôm, mực, cá, nghêu, nấm và rau củ tươi ngon',
    base_price: 350000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: true,
    image_path: 'menu/main-courses/lau-thai.jpg',
  },
  {
    name: 'Bò lúc lắc',
    description: 'Thịt bò Úc thăn ngoại xào lúc lắc với hành tây, ớt chuông, khoai tây chiên',
    base_price: 180000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/bo-luc-lac.jpg',
  },
  {
    name: 'Gà nướng mật ong',
    description: 'Gà ta nguyên con ướp mật ong, nướng than hoa thơm phức, da giòn thịt mềm',
    base_price: 250000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/ga-nuong-mat-ong.jpg',
  },
  {
    name: 'Cá kho tộ',
    description: 'Cá lóc kho tộ đất kiểu miền Nam, nước kho đậm đà, thơm mùi tiêu',
    base_price: 120000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/ca-kho-to.jpg',
  },
  {
    name: 'Tôm hùm nướng phô mai',
    description: 'Tôm hùm baby nướng phô mai béo ngậy, thơm lừng, sang trọng',
    base_price: 450000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/tom-hum-nuong-pho-mai.jpg',
  },
  {
    name: 'Sườn nướng BBQ',
    description: 'Sườn heo non nướng BBQ kiểu Mỹ, sốt đặc biệt, ăn kèm khoai tây nghiền',
    base_price: 165000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/suon-nuong-bbq.jpg',
  },
  {
    name: 'Mực nhồi thịt',
    description: 'Mực ống tươi nhồi thịt heo, nấm, miến, hấp hoặc chiên giòn',
    base_price: 95000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/muc-nhoi-thit.jpg',
  },
  {
    name: 'Vịt quay Bắc Kinh',
    description: 'Vịt quay giòn da, thịt mềm, ăn kèm bánh tráng, dưa leo, hành tây',
    base_price: 380000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/vit-quay-bac-kinh.jpg',
  },
  {
    name: 'Cá hồi nướng teriyaki',
    description: 'Phi lê cá hồi Na Uy nướng sốt teriyaki, ăn kèm rau củ hấp',
    base_price: 220000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/ca-hoi-nuong-teriyaki.jpg',
  },
  {
    name: 'Lẩu bò Nhật Bản',
    description: 'Lẩu bò Wagyu kiểu Nhật với nước dashi, rau củ Nhật, nấm và mì udon',
    base_price: 480000,
    category: 'Món chính',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/lau-bo-nhat-ban.jpg',
  },

  // TRÁNG MIỆNG (10 món)
  {
    name: 'Chè ba màu',
    description: 'Chè truyền thống với đậu đỏ, đậu xanh, thạch, nước cốt dừa thơm béo',
    base_price: 25000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/che-ba-mau.jpg',
  },
  {
    name: 'Bánh flan caramel',
    description: 'Bánh flan mềm mịn, caramel đắng ngọt hài hòa, làm từ trứng gà và sữa tươi',
    base_price: 30000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/banh-flan.jpg',
  },
  {
    name: 'Kem tươi hoa quả',
    description: 'Kem tươi Ý với hoa quả tươi theo mùa, sốt chocolate hoặc caramel',
    base_price: 45000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/kem-tuoi.jpg',
  },
  {
    name: 'Sương sáo hạt lựu',
    description: 'Sương sáo mát lạnh với hạt lựu, nước đường phèn thanh mát',
    base_price: 22000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/suong-sa-hot-luu.jpg',
  },
  {
    name: 'Bánh chuối nướng',
    description: 'Bánh chuối nướng thơm lừng với nước cốt dừa, vừng rang, ăn nóng',
    base_price: 28000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/banh-chuoi-nuong.jpg',
  },
  {
    name: 'Yaourt dẻo dâu tây',
    description: 'Yaourt Hy Lạp dẻo mịn với dâu tây tươi, mật ong và granola giòn',
    base_price: 38000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/yaourt-da-trai.jpg',
  },
  {
    name: 'Chè Thái',
    description: 'Chè Thái đầy đủ với thạch, hạt sen, nhãn, nha đam, nước cốt dừa',
    base_price: 32000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/che-thai.jpg',
  },
  {
    name: 'Bánh su kem',
    description: 'Bánh su kem Pháp với vỏ bánh giòn, nhân kem vani béo ngậy',
    base_price: 35000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/banh-su-kem.jpg',
  },
  {
    name: 'Pudding xoài',
    description: 'Pudding xoài mềm mịn với xoài tươi, nước cốt dừa thơm béo',
    base_price: 40000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/pudding-xoai.jpg',
  },
  {
    name: 'Trái cây tươi theo mùa',
    description: 'Đĩa trái cây tươi ngon theo mùa, cắt tỉa đẹp mắt, giàu vitamin',
    base_price: 50000,
    category: 'Tráng miệng',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/desserts/trai-cay-tuoi.jpg',
  },

  // ĐỒ UỐNG (10 món)
  {
    name: 'Nước chanh dây',
    description: 'Nước chanh dây tươi mát, chua ngọt hài hòa, giải nhiệt tuyệt vời',
    base_price: 25000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/nuoc-chanh-day.jpg',
  },
  {
    name: 'Trà đào cam sả',
    description: 'Trà đào cam sả thơm mát, vị ngọt tự nhiên từ đào và cam tươi',
    base_price: 35000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/tra-dao-cam-sa.jpg',
  },
  {
    name: 'Sinh tố bơ',
    description: 'Sinh tố bơ béo ngậy, thơm lừng, bổ dưỡng với sữa đặc',
    base_price: 40000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/sinh-to-bo.jpg',
  },
  {
    name: 'Cà phê sữa đá',
    description: 'Cà phê phin truyền thống Việt Nam, đậm đà với sữa đặc ngọt ngào',
    base_price: 28000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/ca-phe-sua-da.jpg',
  },
  {
    name: 'Nước dừa tươi',
    description: 'Nước dừa xiêm tươi mát, ngọt tự nhiên, giải khát tuyệt vời',
    base_price: 30000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/nuoc-dua-tuoi.jpg',
  },
  {
    name: 'Trà sữa trân châu',
    description: 'Trà sữa Đài Loan với trân châu đen dai ngon, ngọt vừa phải',
    base_price: 38000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/tra-sua-tran-chau.jpg',
  },
  {
    name: 'Nước ép cam tươi',
    description: 'Nước ép cam tươi 100%, giàu vitamin C, tốt cho sức khỏe',
    base_price: 32000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/nuoc-ep-cam.jpg',
  },
  {
    name: 'Soda chanh muối',
    description: 'Soda chanh muối sảng khoái, vị chua mặn ngọt độc đáo',
    base_price: 26000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/soda-chanh-muoi.jpg',
  },
  {
    name: 'Trà xanh matcha',
    description: 'Trà xanh matcha Nhật Bản nguyên chất, đắng nhẹ, thơm mát',
    base_price: 42000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/tra-xanh-matcha.jpg',
  },
  {
    name: 'Nước mía tươi',
    description: 'Nước mía ép tươi, ngọt mát tự nhiên, giải nhiệt hiệu quả',
    base_price: 20000,
    category: 'Đồ uống',
    is_available: true,
    is_vegetarian: true,
    is_spicy: false,
    image_path: 'menu/beverages/nuoc-mia.jpg',
  },

  // ĐẶC BIỆT (10 món)
  {
    name: 'Set lẩu hải sản 4 người',
    description: 'Set lẩu hải sản cao cấp cho 4 người với tôm hùm, cua, ghẹ, mực, cá, nghêu',
    base_price: 1200000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/main-courses/lau-thai.jpg', // Dùng ảnh lẩu Thái làm placeholder
  },
  {
    name: 'Combo BBQ gia đình',
    description: 'Combo BBQ đầy đủ với bò, heo, gà, hải sản, rau củ nướng cho 6 người',
    base_price: 980000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/combo-bbq.jpg',
  },
  {
    name: 'Set sushi cao cấp',
    description: 'Set sushi Nhật Bản cao cấp với cá hồi, cá ngừ, tôm, trứng cá, 30 miếng',
    base_price: 650000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/set-sushi.jpg',
  },
  {
    name: 'Bò Wagyu nướng đá',
    description: 'Bò Wagyu A5 Nhật Bản nướng trên đá nóng, tan chảy trong miệng',
    base_price: 1500000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/ba-wagyu.jpg', // Sửa từ bo-wagyu.jpg
  },
  {
    name: 'Tôm Alaska hấp',
    description: 'Tôm Alaska size đại hấp, thịt ngọt tự nhiên, ăn kèm bơ tỏi',
    base_price: 850000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/tom-alaska.jpg',
  },
  {
    name: 'Set dimsum đặc biệt',
    description: 'Set dimsum Hồng Kông với há cảo, sủi cảo, xíu mại, bánh bao, 20 món',
    base_price: 380000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/set-dimsum.jpg',
  },
  {
    name: 'Lẩu dưỡng dưỡng',
    description: 'Lẩu dưỡng dưỡng bổ dưỡng với nấm đông trùng hạ thảo, gà ta, thuốc bắc',
    base_price: 580000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/lau-duong-duong.jpg',
  },
  {
    name: 'Set món Nhật 2 người',
    description: 'Set món Nhật đầy đủ với sushi, sashimi, tempura, udon, teriyaki cho 2 người',
    base_price: 720000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/set-mon-nhat.jpg',
  },
  {
    name: 'Hải sản nướng tổng hợp',
    description: 'Hải sản nướng tổng hợp với tôm, mực, cá, sò, nghêu, ốc, sốt đặc biệt',
    base_price: 680000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/hai-san-nuong.jpg',
  },
  {
    name: 'Set tiệc gia đình',
    description: 'Set tiệc gia đình đầy đủ với 10 món chính, 5 món phụ, tráng miệng cho 10 người',
    base_price: 2500000,
    category: 'Đặc biệt',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    image_path: 'menu/specials/set-tiec-gia-dinh.jpg',
  },
];

async function seedFoods() {
  try {
    console.log('🌱 Bắt đầu seed 50 món ăn...\n');
    console.log(`🖼️  Image provider: ${USE_CLOUDINARY ? 'cloudinary' : 'backend-static'}`);
    console.log(`🔗 Image base: ${USE_CLOUDINARY ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload` : `${BACKEND_URL}/images`}\n`);
    
    const foodsCollection = db.collection('food');
    const foodImagesCollection = db.collection('food_image');
    let count = 0;

    for (const food of foods) {
      const { image_path, ...foodData } = food;
      
      // Thêm món ăn
      const foodDoc = await foodsCollection.add({
        ...foodData,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Thêm hình ảnh với Backend Static URL
      const imageUrl = getImageUrl(image_path);
      await foodImagesCollection.add({
        food_id: foodDoc.id,
        image_url: imageUrl,
        is_primary: true,
        display_order: 0,
        uploaded_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      count++;
      console.log(`✅ [${count}/50] ${food.name}`);
      console.log(`   📸 ${imageUrl}`);
    }

    console.log('\n🎉 Hoàn thành! Đã seed 50 món ăn.');
    console.log('\n📊 Thống kê:');
    console.log(`   - Khai vị: 10 món`);
    console.log(`   - Món chính: 10 món`);
    console.log(`   - Tráng miệng: 10 món`);
    console.log(`   - Đồ uống: 10 món`);
    console.log(`   - Đặc biệt: 10 món`);
    console.log(`\n💡 Ảnh được serve từ: ${USE_CLOUDINARY ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/menu/` : `${BACKEND_URL}/images/menu/`}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed:', error);
    process.exit(1);
  }
}

seedFoods();
