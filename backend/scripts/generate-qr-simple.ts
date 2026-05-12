/**
 * Generate QR Codes from Firebase Tables - Simple Version
 * Copy logic from check-firebase-tables.ts that works
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import { buildTableQrPngFileName } from '../src/infrastructure/utils/qrGenerator';

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
const OUTPUT_DIR = path.join(__dirname, '../qr-codes');
const WEB_BASE = (process.env.CUSTOMER_WEB_BASE_URL || 'http://localhost:8081').replace(/\/+$/, '');

async function generateQRCodes() {
  console.log('🎨 Starting QR code generation...');
  console.log(`🌐 Web Base URL: ${WEB_BASE}\n`);

  try {
    // Get all tables from 'dining_table' collection (not 'tables')
    const snapshot = await db.collection('dining_table').get();
    console.log(`📊 Found ${snapshot.size} documents in Firebase\n`);

    if (snapshot.empty) {
      console.log('⚠️  No tables found. Please seed tables first.');
      return;
    }

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const tables: any[] = [];

    // Process each table
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get table number (support both formats)
      const tableNum = data.table_number || String(data.tableNumber || '');
      
      if (!tableNum) {
        console.log(`⚠️  Skipping ${doc.id} - no table number`);
        continue;
      }

      const tableId = doc.id;
      const location = data.location || 'Không xác định';
      const capacity = data.capacity || 0;

      // Generate QR URL
      const qrUrl = `${WEB_BASE}/table/${encodeURIComponent(tableNum)}?tid=${encodeURIComponent(tableId)}`;
      const fileName = buildTableQrPngFileName(tableNum, tableId);
      const filePath = path.join(OUTPUT_DIR, fileName);

      try {
        // Generate QR code
        await QRCode.toFile(filePath, qrUrl, {
          width: 500,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });

        tables.push({
          tableNumber: tableNum,
          tableId,
          location,
          capacity,
          qrUrl,
          fileName,
        });

        console.log(`✅ Generated QR for Table ${tableNum} (${location})`);
      } catch (error) {
        console.error(`❌ Error generating QR for Table ${tableNum}:`, error);
      }
    }

    // Sort tables
    tables.sort((a, b) => {
      const aMatch = a.tableNumber.match(/^([A-Z]+)(\d+)$/);
      const bMatch = b.tableNumber.match(/^([A-Z]+)(\d+)$/);
      
      if (aMatch && bMatch) {
        const [, aPrefix, aNum] = aMatch;
        const [, bPrefix, bNum] = bMatch;
        if (aPrefix === bPrefix) {
          return parseInt(aNum) - parseInt(bNum);
        }
        return aPrefix.localeCompare(bPrefix);
      }
      return a.tableNumber.localeCompare(b.tableNumber);
    });

    // Generate HTML
    const htmlPath = path.join(OUTPUT_DIR, 'index.html');
    const htmlContent = generateHTML(tables);
    fs.writeFileSync(htmlPath, htmlContent);

    // Generate README
    const readmePath = path.join(OUTPUT_DIR, 'README.md');
    const readmeContent = generateReadme(tables);
    fs.writeFileSync(readmePath, readmeContent);

    console.log(`\n🎉 QR code generation completed!`);
    console.log(`📊 Total QR codes: ${tables.length}`);
    console.log(`📂 Output directory: ${OUTPUT_DIR}`);
    console.log(`📄 HTML page: ${htmlPath}`);
    console.log(`\n💡 Open index.html in browser to view all QR codes`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

function generateHTML(tables: any[]): string {
  const cards = tables.map(t => `
    <div class="qr-card">
      <div class="badge">${t.tableNumber}</div>
      <img src="${t.fileName}" alt="QR ${t.tableNumber}" />
      <h3>${t.tableNumber}</h3>
      <p class="location">📍 ${t.location}</p>
      <p class="capacity">👥 ${t.capacity} chỗ</p>
      <p class="url">${t.qrUrl}</p>
      <button onclick="printQR('${t.fileName}', '${t.tableNumber}', '${t.location}')">🖨️ In QR</button>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes - Bàn Nhà Hàng</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 {
      text-align: center;
      color: white;
      margin-bottom: 30px;
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat {
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      padding: 15px 30px;
      border-radius: 15px;
      color: white;
      text-align: center;
    }
    .stat .number { font-size: 2rem; font-weight: bold; }
    .stat .label { font-size: 0.9rem; opacity: 0.9; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }
    .qr-card {
      background: white;
      border-radius: 20px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      transition: transform 0.3s ease;
      position: relative;
    }
    .qr-card:hover { transform: translateY(-8px); }
    .badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
    }
    .qr-card img {
      width: 100%;
      max-width: 280px;
      border: 4px solid #f0f0f0;
      border-radius: 15px;
      margin: 20px 0;
    }
    .qr-card h3 { color: #333; font-size: 1.8rem; margin: 10px 0; }
    .location { color: #666; margin: 5px 0; }
    .capacity { color: #888; margin: 5px 0; }
    .url {
      font-size: 0.75rem;
      color: #999;
      margin: 15px 0;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      background: #f8f8f8;
      padding: 10px;
      border-radius: 8px;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      width: 100%;
      transition: transform 0.3s ease;
    }
    button:hover { transform: scale(1.05); }
    .actions {
      text-align: center;
      margin-top: 30px;
    }
    .actions button {
      width: auto;
      padding: 15px 40px;
      margin: 0 10px;
    }
    @media print {
      body { background: white; }
      .actions, .stat { display: none; }
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍽️ QR Codes - Bàn Nhà Hàng</h1>
    <div class="stats">
      <div class="stat">
        <div class="number">${tables.length}</div>
        <div class="label">Tổng số bàn</div>
      </div>
      <div class="stat">
        <div class="number">${new Date().toLocaleDateString('vi-VN')}</div>
        <div class="label">Ngày tạo</div>
      </div>
    </div>
    <div class="grid">${cards}</div>
    <div class="actions">
      <button onclick="window.print()">🖨️ In Tất Cả</button>
    </div>
  </div>
  <script>
    function printQR(fileName, tableNumber, location) {
      const w = window.open('', '_blank');
      w.document.write(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print QR - Bàn \${tableNumber}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            h1 { color: #667eea; font-size: 3rem; margin-bottom: 10px; }
            .location { color: #666; font-size: 1.5rem; margin-bottom: 30px; }
            img { max-width: 400px; border: 4px solid #f0f0f0; border-radius: 15px; }
          </style>
        </head>
        <body>
          <h1>Bàn \${tableNumber}</h1>
          <div class="location">📍 \${location}</div>
          <img src="\${fileName}" alt="QR Bàn \${tableNumber}" />
        </body>
        </html>
      \`);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  </script>
</body>
</html>`;
}

function generateReadme(tables: any[]): string {
  return `# QR Codes - Restaurant Tables

## Thông tin
- **Tổng số bàn**: ${tables.length}
- **Web Base URL**: ${WEB_BASE}
- **Ngày tạo**: ${new Date().toLocaleString('vi-VN')}

## Danh sách bàn
${tables.map(t => `- **${t.tableNumber}** - ${t.location} (${t.capacity} chỗ)`).join('\n')}

## Cách sử dụng
1. Mở \`index.html\` để xem tất cả QR codes
2. In từng QR hoặc in tất cả
3. Dán QR lên bàn tương ứng
4. Khách quét QR → Tự động nhận diện bàn → Hiển thị thực đơn

## Tạo lại QR
\`\`\`bash
cd backend
npm run generate-qr
\`\`\`
`;
}

// Run
generateQRCodes()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
