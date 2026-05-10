/**
 * Script kiểm tra xem tất cả ảnh có tồn tại không
 * Chạy: npm run verify:images
 */

import * as fs from 'fs';
import * as path from 'path';

const IMAGES_DIR = path.join(__dirname, '../../App/assets/images/menu');

const expectedImages = {
  appetizers: [
    'goi-cuon.jpg',
    'nem-ran.jpg',
    'salad-ca-hoi.jpg',
    'sup-hai-san.jpg',
    'chao-tom.jpg',
    'goi-ngo-sen.jpg',
    'muc-chien-gion.jpg',
    'bo-nuong-la-lot.jpg',
    'banh-xeo.jpg',
    'cha-gio.jpg',
  ],
  'main-courses': [
    'lau-thai.jpg',
    'bo-luc-lac.jpg',
    'ga-nuong-mat-ong.jpg',
    'ca-kho-to.jpg',
    'tom-hum-nuong-pho-mai.jpg',
    'suon-nuong-bbq.jpg',
    'muc-nhoi-thit.jpg',
    'vit-quay-bac-kinh.jpg',
    'ca-hoi-nuong-teriyaki.jpg',
    'lau-bo-nhat-ban.jpg',
  ],
  desserts: [
    'che-ba-mau.jpg',
    'banh-flan.jpg',
    'kem-tuoi.jpg',
    'suong-sa-hot-luu.jpg',
    'banh-chuoi-nuong.jpg',
    'yaourt-da-trai.jpg',
    'che-thai.jpg',
    'banh-su-kem.jpg',
    'pudding-xoai.jpg',
    'trai-cay-tuoi.jpg',
  ],
  beverages: [
    'nuoc-chanh-day.jpg',
    'tra-dao-cam-sa.jpg',
    'sinh-to-bo.jpg',
    'ca-phe-sua-da.jpg',
    'nuoc-dua-tuoi.jpg',
    'tra-sua-tran-chau.jpg',
    'nuoc-ep-cam.jpg',
    'soda-chanh-muoi.jpg',
    'tra-xanh-matcha.jpg',
    'nuoc-mia.jpg',
  ],
  specials: [
    'set-lau-hai-san.jpg',
    'combo-bbq.jpg',
    'set-sushi.jpg',
    'bo-wagyu.jpg',
    'tom-alaska.jpg',
    'set-dimsum.jpg',
    'lau-duong-duong.jpg',
    'set-mon-nhat.jpg',
    'hai-san-nuong.jpg',
    'set-tiec-gia-dinh.jpg',
  ],
};

function checkImages() {
  console.log('🔍 Kiểm tra ảnh menu...\n');
  console.log(`📁 Thư mục: ${IMAGES_DIR}\n`);

  let totalExpected = 0;
  let totalFound = 0;
  let totalMissing = 0;
  const missingImages: string[] = [];

  for (const [category, images] of Object.entries(expectedImages)) {
    console.log(`\n📂 ${category}:`);
    const categoryPath = path.join(IMAGES_DIR, category);

    if (!fs.existsSync(categoryPath)) {
      console.log(`   ❌ Thư mục không tồn tại!`);
      totalMissing += images.length;
      images.forEach(img => missingImages.push(`${category}/${img}`));
      continue;
    }

    let found = 0;
    let missing = 0;

    for (const image of images) {
      const imagePath = path.join(categoryPath, image);
      totalExpected++;

      if (fs.existsSync(imagePath)) {
        found++;
        totalFound++;
        console.log(`   ✅ ${image}`);
      } else {
        missing++;
        totalMissing++;
        missingImages.push(`${category}/${image}`);
        console.log(`   ❌ ${image} - KHÔNG TỒN TẠI`);
      }
    }

    console.log(`   📊 ${found}/${images.length} ảnh`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TỔNG KẾT');
  console.log('='.repeat(60));
  console.log(`✅ Tìm thấy: ${totalFound}/${totalExpected} ảnh`);
  console.log(`❌ Thiếu: ${totalMissing}/${totalExpected} ảnh`);

  if (totalMissing > 0) {
    console.log('\n⚠️  CÁC ẢNH THIẾU:');
    missingImages.forEach(img => console.log(`   - ${img}`));
    console.log('\n💡 Giải pháp:');
    console.log('   1. Thêm ảnh thiếu vào thư mục App/assets/images/menu/');
    console.log('   2. Hoặc dùng ảnh placeholder');
    console.log('   3. Hoặc cập nhật seed script để bỏ qua ảnh thiếu');
  } else {
    console.log('\n🎉 TẤT CẢ ẢNH ĐỀU TỒN TẠI!');
    console.log('\n✅ Bạn có thể chạy:');
    console.log('   npm run seed:foods-backend');
  }

  console.log('\n');
}

checkImages();
