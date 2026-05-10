/**
 * Script upload ảnh menu lên Cloudinary
 * Chạy: npm run upload:images
 */

import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dqnnwl8h8';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Thiếu CLOUDINARY_API_KEY hoặc CLOUDINARY_API_SECRET trong backend/.env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

// Đường dẫn đến thư mục ảnh
const IMAGES_DIR = path.join(__dirname, '../../App/assets/images/menu');

// Tự động quét tất cả thư mục con
function getCategories(): string[] {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Thư mục không tồn tại: ${IMAGES_DIR}`);
    return [];
  }
  
  return fs.readdirSync(IMAGES_DIR)
    .filter(item => {
      const fullPath = path.join(IMAGES_DIR, item);
      return fs.statSync(fullPath).isDirectory();
    });
}

const CATEGORIES = getCategories();

/**
 * Upload một file lên Cloudinary
 */
async function uploadFile(localPath: string, storagePath: string): Promise<string> {
  try {
    const normalizedPath = storagePath.replace(/\.[^.]+$/, '');

    const result = await cloudinary.uploader.upload(localPath, {
      public_id: normalizedPath,
      overwrite: true,
      resource_type: 'image',
      folder: undefined,
    });

    const publicUrl = result.secure_url;
    console.log(`   ✅ ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error(`   ❌ Lỗi upload ${storagePath}:`, error.message);
    throw error;
  }
}

/**
 * Upload tất cả ảnh trong một category
 */
async function uploadCategory(category: string): Promise<{ [key: string]: string }> {
  const categoryPath = path.join(IMAGES_DIR, category);
  
  if (!fs.existsSync(categoryPath)) {
    console.log(`   ⚠️  Thư mục không tồn tại: ${categoryPath}`);
    return {};
  }
  
  const files = fs.readdirSync(categoryPath)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  
  if (files.length === 0) {
    console.log(`   ⚠️  Không có ảnh trong thư mục`);
    return {};
  }
  
  const urls: { [key: string]: string } = {};
  
  for (const file of files) {
    const localPath = path.join(categoryPath, file);
    const storagePath = `menu/${category}/${file}`;
    
    console.log(`   📤 ${file}`);
    try {
      const url = await uploadFile(localPath, storagePath);
      urls[file] = url;
    } catch (error) {
      console.log(`   ⚠️  Bỏ qua file ${file}`);
    }
  }
  
  return urls;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 BẮT ĐẦU UPLOAD ẢNH LÊN CLOUDINARY\n');
    console.log(`📁 Thư mục nguồn: ${IMAGES_DIR}`);
    console.log(`☁️  Cloud name: ${CLOUDINARY_CLOUD_NAME}\n`);
    
    if (CATEGORIES.length === 0) {
      console.error('❌ Không tìm thấy thư mục con nào!');
      process.exit(1);
    }
    
    console.log(`📂 Tìm thấy ${CATEGORIES.length} categories: ${CATEGORIES.join(', ')}\n`);
    
    const allUrls: { [category: string]: { [file: string]: string } } = {};
    const flatUrls: { [imagePath: string]: string } = {};
    let totalImages = 0;
    
    for (const category of CATEGORIES) {
      console.log(`\n📁 Category: ${category}`);
      const urls = await uploadCategory(category);
      allUrls[category] = urls;
      for (const file of Object.keys(urls)) {
        flatUrls[`menu/${category}/${file}`] = urls[file];
      }
      const count = Object.keys(urls).length;
      totalImages += count;
      console.log(`   ✅ Uploaded ${count} ảnh`);
    }
    
    // Lưu mapping vào file JSON
    const outputPath = path.join(__dirname, 'menu-image-urls.json');
    fs.writeFileSync(outputPath, JSON.stringify(allUrls, null, 2));

    const flatOutputPath = path.join(__dirname, 'menu-image-urls.flat.json');
    fs.writeFileSync(flatOutputPath, JSON.stringify(flatUrls, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ HOÀN THÀNH UPLOAD!');
    console.log('='.repeat(60));
    console.log(`📄 URLs đã được lưu vào: ${outputPath}`);
    console.log(`\n📊 Thống kê:`);
    
    for (const category in allUrls) {
      const count = Object.keys(allUrls[category]).length;
      console.log(`   - ${category}: ${count} ảnh`);
    }
    console.log(`📄 Flat mapping: ${flatOutputPath}`);
    console.log(`\n🎉 Tổng cộng: ${totalImages} ảnh đã được upload lên Cloudinary`);
    console.log(`\n💡 Bước tiếp theo:`);
    console.log(`   1. Chạy: npm run clear:foods`);
    console.log(`   2. Chạy: npm run seed:foods-cloudinary`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ LỖI:', error.message);
    console.error('\n💡 Kiểm tra:');
    console.error('   1. CLOUDINARY_CLOUD_NAME đúng');
    console.error('   2. CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET đúng');
    console.error('   3. Bạn có quyền upload trên Cloudinary');
    process.exit(1);
  }
}

main();
