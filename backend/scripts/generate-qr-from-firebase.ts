/**
 * Generate QR Codes from Firebase Tables
 * Tự động lấy danh sách bàn từ Firebase và tạo QR code
 * QR code chứa URL với table number và table ID để tự động cập nhật bàn
 * 
 * Run: npm run generate-qr
 */

import 'dotenv/config';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { buildTableQrPngFileName } from '../src/infrastructure/utils/qrGenerator';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolveCustomerWebBaseUrl } from './resolve-lan-web-base';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const OUTPUT_DIR = path.join(__dirname, '../qr-codes');

const WEB_BASE = resolveCustomerWebBaseUrl(process.env.CUSTOMER_WEB_BASE_URL);

interface TableData {
  id: string;
  table_number: string;
  location?: string;
  capacity?: number;
  status?: string;
}

interface TableQR {
  tableId: string;
  tableNumber: string;
  location: string;
  capacity: number;
  qrData: string;
  fileName: string;
}

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

async function getTablesFromFirebase(): Promise<TableData[]> {
  console.log('📡 Fetching tables from Firebase...');
  
  try {
    const snapshot = await db.collection('tables').get();
    console.log(`📊 Snapshot size: ${snapshot.size}`);
    console.log(`📊 Snapshot empty: ${snapshot.empty}`);
    
    const tables: TableData[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`🔍 Processing doc ${doc.id}:`, {
        table_number: data.table_number,
        tableNumber: data.tableNumber,
        location: data.location
      });
      
      // Support both table_number (string) and tableNumber (number) fields
      let tableNum = data.table_number || data.tableNumber;
      
      // Convert number to string if needed
      if (typeof tableNum === 'number') {
        tableNum = String(tableNum);
      }
      
      // Skip if no table number
      if (!tableNum) {
        console.log(`⚠️  Skipping table ${doc.id} - no table number`);
        return;
      }
      
      tables.push({
        id: doc.id,
        table_number: tableNum,
        location: data.location || 'Không xác định',
        capacity: data.capacity || 0,
        status: data.status || 'available',
      });
    });
    
    console.log(`✅ Processed ${tables.length} tables`);
    
    // Sort by table number
    tables.sort((a, b) => {
      const aNum = a.table_number;
      const bNum = b.table_number;
      
      // Extract prefix (G, T, V) and number
      const aMatch = aNum.match(/^([A-Z]+)(\d+)$/);
      const bMatch = bNum.match(/^([A-Z]+)(\d+)$/);
      
      if (aMatch && bMatch) {
        const [, aPrefix, aNumber] = aMatch;
        const [, bPrefix, bNumber] = bMatch;
        
        if (aPrefix === bPrefix) {
          return parseInt(aNumber) - parseInt(bNumber);
        }
        return aPrefix.localeCompare(bPrefix);
      }
      
      // Fallback to string comparison
      return aNum.localeCompare(bNum);
    });
    
    console.log(`✅ Found ${tables.length} tables in Firebase`);
    return tables;
  } catch (error) {
    console.error('❌ Error fetching tables from Firebase:', error);
    throw error;
  }
}

async function generateQRCodes() {
  console.log('🎨 Starting QR code generation from Firebase...');
  console.log(`🌐 Web Base URL: ${WEB_BASE}\n`);
  
  // Get tables from Firebase
  const tables = await getTablesFromFirebase();
  
  if (tables.length === 0) {
    console.log('⚠️  No tables found in Firebase. Please seed tables first.');
    return;
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}\n`);
  } else {
    for (const entry of fs.readdirSync(OUTPUT_DIR)) {
      if (/^QR-ThucDon-Ban_.*\.png$/i.test(entry)) {
        fs.unlinkSync(path.join(OUTPUT_DIR, entry));
      }
    }
  }
  
  const tableQRs: TableQR[] = [];
  
  // Generate QR codes for each table
  for (const table of tables) {
    const tableNum = encodeURIComponent(table.table_number);
    const tableId = encodeURIComponent(table.id);
    
    // QR data includes both table number and ID for automatic table detection
    const qrData = `${WEB_BASE}/table/${tableNum}?tid=${tableId}`;
    const fileName = buildTableQrPngFileName(table.table_number, table.id);
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    try {
      await QRCode.toFile(filePath, qrData, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // High error correction for better scanning
      });
      
      tableQRs.push({
        tableId: table.id,
        tableNumber: table.table_number,
        location: table.location || 'Không xác định',
        capacity: table.capacity || 0,
        qrData,
        fileName,
      });
      
      console.log(`✅ Generated QR code for Table ${table.table_number} (${table.location})`);
    } catch (error) {
      console.error(`❌ Error generating QR for Table ${table.table_number}:`, error);
    }
  }
  
  // Generate HTML page to view all QR codes
  const htmlContent = generateHTMLPage(tableQRs);
  const htmlPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`\n📄 Generated HTML page: ${htmlPath}`);
  
  // Generate README
  const readmePath = path.join(OUTPUT_DIR, 'README.md');
  const readmeContent = generateReadme(tableQRs);
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`📝 Generated README: ${readmePath}`);
  
  console.log('\n🎉 QR code generation completed!');
  console.log(`📊 Total QR codes: ${tableQRs.length}`);
  console.log(`📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n💡 Open ${htmlPath} in your browser to view all QR codes`);
  console.log(`\n🔗 QR codes contain: ${WEB_BASE}/table/{number}?tid={id}`);
  console.log(`   → Tự động cập nhật thông tin bàn khi quét`);
}

function generateReadme(tables: TableQR[]): string {
  return `# QR Codes - Restaurant Tables

## Thông tin

- **Tổng số bàn**: ${tables.length}
- **Web Base URL**: ${WEB_BASE}
- **Ngày tạo**: ${new Date().toLocaleString('vi-VN')}

## Danh sách bàn

${tables.map(t => `- **${t.tableNumber}** - ${t.location} (${t.capacity} chỗ) - \`${t.fileName}\``).join('\n')}

## Cách sử dụng

1. **In QR codes**: Mở file \`index.html\` trong trình duyệt và in từng QR hoặc in tất cả
2. **Dán QR lên bàn**: Mỗi bàn có QR riêng với tên file \`QR-ThucDon-Ban_{số bàn}__ID_{id Firebase}.png\`
3. **Khách quét QR**: 
   - QR chứa URL: \`${WEB_BASE}/table/{số bàn}?tid={id bàn}\`
   - App/Web tự động nhận diện bàn và cập nhật thông tin
   - Không cần nhập thủ công

## Cấu trúc QR Code

Mỗi QR code chứa:
- **Table Number**: Số bàn hiển thị (G01, T01, V01...)
- **Table ID**: ID trong Firebase để xác thực
- **URL Format**: \`http://IP:PORT/table/{number}?tid={id}\`

## Tạo lại QR codes

Khi thay đổi IP hoặc cập nhật bàn:

\`\`\`bash
cd backend
npm run generate-qr
\`\`\`

---

**Lưu ý**: QR codes này được tạo tự động từ Firebase. Khi quét, hệ thống sẽ tự động:
1. Lấy thông tin bàn từ database
2. Cập nhật context trong app
3. Hiển thị thực đơn cho bàn đó
`;
}

function generateHTMLPage(tables: TableQR[]): string {
  const qrCodeHTML = tables.map(table => `
    <div class="qr-card">
      <div class="table-badge">${table.tableNumber}</div>
      <img src="${table.fileName}" alt="QR Code ${table.tableNumber}" />
      <div class="table-info">
        <h3>${table.tableNumber}</h3>
        <p class="location">📍 ${table.location}</p>
        <p class="capacity">👥 ${table.capacity} chỗ</p>
      </div>
      <p class="qr-data">${table.qrData}</p>
      <button onclick="printQR('${table.fileName}', '${table.tableNumber}', '${table.location}')">
        🖨️ In QR Code
      </button>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes - Bàn Nhà Hàng</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      margin-bottom: 10px;
    }

    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .stat-card {
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      padding: 15px 30px;
      border-radius: 15px;
      color: white;
      text-align: center;
    }

    .stat-card .number {
      font-size: 2rem;
      font-weight: bold;
    }

    .stat-card .label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

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
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .qr-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.3);
    }

    .table-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .qr-card img {
      width: 100%;
      max-width: 280px;
      height: auto;
      border: 4px solid #f0f0f0;
      border-radius: 15px;
      margin: 20px 0;
      transition: transform 0.3s ease;
    }

    .qr-card:hover img {
      transform: scale(1.05);
    }

    .table-info {
      margin: 15px 0;
    }

    .table-info h3 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 10px;
    }

    .location {
      color: #666;
      font-size: 1rem;
      margin: 5px 0;
    }

    .capacity {
      color: #888;
      font-size: 0.95rem;
      margin: 5px 0;
    }

    .qr-data {
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
      transition: all 0.3s ease;
      width: 100%;
    }

    button:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    button:active {
      transform: scale(0.98);
    }

    .actions {
      text-align: center;
      margin-top: 30px;
      display: flex;
      justify-content: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .actions button {
      width: auto;
      padding: 15px 40px;
      font-size: 1.1rem;
    }

    .info-box {
      background: rgba(255,255,255,0.95);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }

    .info-box h2 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 1.5rem;
    }

    .info-box ul {
      list-style: none;
      padding: 0;
    }

    .info-box li {
      padding: 8px 0;
      color: #555;
      font-size: 1rem;
    }

    .info-box li:before {
      content: "✓ ";
      color: #667eea;
      font-weight: bold;
      margin-right: 8px;
    }

    @media print {
      body {
        background: white;
      }
      
      .header, .stats, .actions, .info-box {
        display: none;
      }
      
      .qr-card button {
        display: none;
      }

      .grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .header h1 {
        font-size: 2rem;
      }

      .stats {
        gap: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍽️ QR Codes - Bàn Nhà Hàng</h1>
      <p>Quét mã QR để tự động cập nhật thông tin bàn</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="number">${tables.length}</div>
        <div class="label">Tổng số bàn</div>
      </div>
      <div class="stat-card">
        <div class="number">${new Date().toLocaleDateString('vi-VN')}</div>
        <div class="label">Ngày tạo</div>
      </div>
    </div>

    <div class="info-box">
      <h2>📱 Cách sử dụng QR Code</h2>
      <ul>
        <li>Mỗi QR code chứa URL với số bàn và ID bàn</li>
        <li>Khách quét QR → Tự động nhận diện bàn → Hiển thị thực đơn</li>
        <li>Không cần nhập thủ công số bàn</li>
        <li>QR code có độ chính xác cao (Error Correction Level H)</li>
      </ul>
    </div>
    
    <div class="grid">
      ${qrCodeHTML}
    </div>

    <div class="actions">
      <button onclick="window.print()">🖨️ In Tất Cả QR Codes</button>
      <button onclick="downloadInfo()">📥 Tải Thông Tin</button>
    </div>
  </div>

  <script>
    function printQR(fileName, tableNumber, location) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print QR - Bàn \${tableNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: 'Segoe UI', Arial, sans-serif;
            }
            .print-container {
              text-align: center;
              border: 3px solid #667eea;
              padding: 30px;
              border-radius: 20px;
            }
            h1 {
              color: #667eea;
              margin-bottom: 10px;
              font-size: 3rem;
            }
            .location {
              color: #666;
              font-size: 1.5rem;
              margin-bottom: 30px;
            }
            img {
              max-width: 400px;
              border: 4px solid #f0f0f0;
              border-radius: 15px;
              margin: 20px 0;
            }
            .instructions {
              margin-top: 30px;
              color: #888;
              font-size: 1.2rem;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <h1>Bàn \${tableNumber}</h1>
            <div class="location">📍 \${location}</div>
            <img src="\${fileName}" alt="QR Code Bàn \${tableNumber}" />
            <div class="instructions">
              Quét mã QR để xem thực đơn và đặt món
            </div>
          </div>
        </body>
        </html>
      \`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    function downloadInfo() {
      alert('Tất cả QR codes và thông tin đã có trong thư mục backend/qr-codes/\\n\\nXem file README.md để biết thêm chi tiết.');
    }
  </script>
</body>
</html>
  `;
}

// Run the generation
generateQRCodes()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
