/**
 * Generate QR Codes for Tables
 * Script để tạo QR codes cho tất cả bàn và lưu vào Firebase
 */

import { db } from '../../config/firebase.config';
import { QRGenerator } from '../../utils/qrGenerator';
import * as fs from 'fs';
import * as path from 'path';

const RESTAURANT_ID = 'restaurant-001';

async function generateAndSaveQRCodes() {
  console.log('🔄 Generating QR codes for tables...\n');

  const qrGenerator = new QRGenerator('qr-codes');

  try {
    // Lấy tất cả bàn từ Firebase
    const tablesSnapshot = await db.collection('dining_table').get();
    
    if (tablesSnapshot.empty) {
      console.log('❌ No tables found. Please run seed first.');
      return;
    }

    const tables = tablesSnapshot.docs.map(doc => ({
      id: doc.id,
      table_number: doc.data().table_number,
      ...doc.data()
    }));

    console.log(`📊 Found ${tables.length} tables\n`);

    // Tạo QR codes
    for (const table of tables) {
      // Tạo QR code file
      await qrGenerator.generateTableQR({
        tableId: table.id,
        tableNumber: table.table_number,
        restaurantId: RESTAURANT_ID,
      });

      // Tạo QR code base64 để lưu vào Firebase
      const qrCodeBase64 = await qrGenerator.generateTableQRBase64({
        tableId: table.id,
        tableNumber: table.table_number,
        restaurantId: RESTAURANT_ID,
      });

      // Cập nhật bàn với QR code
      await db.collection('dining_table').doc(table.id).update({
        qr_code: qrCodeBase64,
        qr_code_generated_at: new Date(),
      });

      console.log(`  ✓ Table ${table.table_number} - QR generated and saved`);
    }

    console.log('\n✅ All QR codes generated successfully!');
    console.log(`📁 QR code images saved to: ${path.join(process.cwd(), 'qr-codes')}`);
    console.log('💾 QR code data saved to Firebase\n');

    // Tạo README trong folder qr-codes
    const readmePath = path.join(process.cwd(), 'qr-codes', 'README.md');
    const readmeContent = `# Table QR Codes

Các file QR code này được tạo tự động cho từng bàn trong nhà hàng.

## Cách sử dụng

1. **In QR codes**: In các file PNG này và dán lên bàn tương ứng
2. **Khách quét QR**: Khách hàng dùng camera điện thoại quét QR code
3. **Tự động nhận diện bàn**: Trình duyệt mở đúng bàn trên bản web (Expo Web trong App, thư mục \`web-app\` khi build)

## Thông tin trong QR Code

Mỗi QR code chứa **một URL HTTPS/HTTP** tới **bản web khách** (mặc định \`CUSTOMER_WEB_BASE_URL\`, ví dụ \`http://localhost:8081/table/T01?tid=...\`). Khách quét bằng camera điện thoại sẽ mở trình duyệt, không cần Expo Go.

Cấu hình base URL khi tạo lại QR:

\`\`\`env
CUSTOMER_WEB_BASE_URL=https://menu.ten-nha-hang.com
\`\`\`

## Tái tạo QR Codes

Nếu cần tạo lại QR codes:

\`\`\`bash
cd backend
npm run generate-qr
\`\`\`

## Kích thước và tên file

- Tên file: \`QR-ThucDon-Ban_{số bàn}__ID_{id Firebase}.png\` (dễ phân biệt khi in / lưu trữ)
- Kích thước: 400x400 pixels
- Format: PNG
- Margin: 2
- Màu: Đen trên nền trắng

---

Generated: ${new Date().toLocaleString('vi-VN')}
`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('📄 README.md created in qr-codes folder\n');

  } catch (error) {
    console.error('❌ Error generating QR codes:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateAndSaveQRCodes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { generateAndSaveQRCodes };
