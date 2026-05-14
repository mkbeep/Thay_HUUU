/**
 * Script seed TẤT CẢ dữ liệu cần thiết cho Firebase mới
 * Chạy từ thư mục backend:
 *   npm run seed:firebase-full
 *   hoặc: npx ts-node scripts/seed-all-data.ts
 * 
 * Script này sẽ:
 * 1. Seed 20 bàn ăn (dining_table)
 * 2. Seed 3 users (admin, manager, staff)
 * 3. Seed 50 món ăn với ảnh Cloudinary
 * 4. Seed ancillary: food_topping, inventory, promotion, settings + dọn runtime + demo đủ bảng
 * 5. Generate QR codes từ dining_table
 */

import { execSync } from 'child_process';
import * as path from 'path';

const scriptsDir = path.join(__dirname);

async function runScript(scriptName: string, description: string): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const scriptPath = path.join(scriptsDir, scriptName);
    execSync(`npx ts-node ${scriptPath}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log(`\n✅ Hoàn thành: ${description}\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ Lỗi khi chạy: ${description}`);
    console.error(error);
    return false;
  }
}

async function seedAllData() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║        🌱 SEED TẤT CẢ DỮ LIỆU CHO FIREBASE MỚI 🌱         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const steps = [
    { script: 'seed-tables.ts', description: 'Seed 20 bàn (dining_table) + dọn table_session' },
    { script: 'seed-admin.ts', description: 'Roles (admin…cashier) + users (admin, manager, staff, chef, cashier)' },
    { script: 'seed-foods-cloudinary.ts', description: '50 món + food_image (Cloudinary)' },
    { script: 'seed-ancillary.ts', description: 'food_topping, inventory, promotion, settings + dọn + demo (orders, kitchen, payment, …)' },
    { script: 'generate-qr-simple.ts', description: 'QR từ dining_table (CUSTOMER_WEB_BASE_URL)' },
  ];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n📍 Bước ${i + 1}/${steps.length}: ${step.description}`);
    
    const success = await runScript(step.script, step.description);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log(`\n⚠️  Bước ${i + 1} thất bại. Bạn có muốn tiếp tục? (Ctrl+C để dừng)\n`);
      // Đợi 3 giây trước khi tiếp tục
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║                    🎉 KẾT QUẢ TỔNG HỢP 🎉                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log(`✅ Thành công: ${successCount}/${steps.length} bước`);
  console.log(`❌ Thất bại: ${failCount}/${steps.length} bước`);
  console.log('\n');

  if (failCount === 0) {
    console.log('🎊 HOÀN THÀNH! Tất cả dữ liệu đã được seed thành công!');
    console.log('\n📋 Dữ liệu đã seed:');
    console.log('   ✓ 20 bàn (dining_table)');
    console.log('   ✓ role + users (kể cả chef, cashier)');
    console.log('   ✓ 50 món + food_image');
    console.log('   ✓ food_topping, inventory, promotion, settings + demo (orders, order_item, kitchen_ticket, payment, notification, support_requests, inventory_transaction, table_session)');
    console.log('   ✓ Đã dọn + demo: orders, kitchen_ticket, payment, notification, table_session, …');
    console.log('   ✓ QR codes (backend/qr-codes)');
    console.log('\n🔗 Bước tiếp theo:');
    console.log('   1. Kiểm tra Firebase Console');
    console.log('   2. Trong backend/.env đặt CUSTOMER_WEB_BASE_URL = URL web khách (vd. http://IP:8081) rồi chạy lại: npm run generate-qr');
    console.log('   3. Mở backend/qr-codes/index.html để in QR');
    console.log('   4. Chạy backend: npm run dev');
    console.log('\n');
  } else {
    console.log('⚠️  Một số bước thất bại. Vui lòng kiểm tra lỗi ở trên.');
    console.log('\n💡 Bạn có thể chạy lại từng script riêng lẻ:');
    steps.forEach((step, i) => {
      console.log(`   ${i + 1}. npx ts-node backend/scripts/${step.script}`);
    });
    console.log('\n');
  }

  process.exit(failCount === 0 ? 0 : 1);
}

// Chạy script
seedAllData().catch(error => {
  console.error('\n❌ Lỗi không mong muốn:', error);
  process.exit(1);
});
