/**
 * Generate QR Codes for Tables
 * Run: npx ts-node scripts/generate-qr-codes.ts
 *
 * Install dependencies first:
 * npm install qrcode @types/qrcode
 */

import 'dotenv/config';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { buildTableQrPngFileName } from '../src/infrastructure/utils/qrGenerator';

const OUTPUT_DIR = path.join(__dirname, '../qr-codes');

const WEB_BASE = (process.env.CUSTOMER_WEB_BASE_URL || 'http://localhost:8081').replace(
  /\/+$/,
  ''
);

interface TableQR {
  tableNumber: number;
  qrData: string;
  fileName: string;
}

const tables: TableQR[] = [];

// Generate QR data for 20 tables
for (let i = 1; i <= 20; i++) {
  const num = encodeURIComponent(String(i));
  tables.push({
    tableNumber: i,
    qrData: `${WEB_BASE}/table/${num}`,
    fileName: buildTableQrPngFileName(String(i), `offline-demo-${i}`),
  });
}

async function generateQRCodes() {
  console.log('🎨 Starting QR code generation...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }

  // Generate QR codes
  for (const table of tables) {
    const filePath = path.join(OUTPUT_DIR, table.fileName);
    
    try {
      await QRCode.toFile(filePath, table.qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      console.log(`✅ Generated QR code for Table ${table.tableNumber}`);
    } catch (error) {
      console.error(`❌ Error generating QR for Table ${table.tableNumber}:`, error);
    }
  }

  // Generate HTML page to view all QR codes
  const htmlContent = generateHTMLPage(tables);
  const htmlPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`\n📄 Generated HTML page: ${htmlPath}`);

  console.log('\n🎉 QR code generation completed!');
  console.log(`📊 Total QR codes: ${tables.length}`);
  console.log(`📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n💡 Open ${htmlPath} in your browser to view all QR codes`);
}

function generateHTMLPage(tables: TableQR[]): string {
  const qrCodeHTML = tables.map(table => `
    <div class="qr-card">
      <h3>Bàn ${table.tableNumber}</h3>
      <img src="${table.fileName}" alt="QR Code Table ${table.tableNumber}" />
      <p class="qr-data">${table.qrData}</p>
      <button onclick="printQR('${table.fileName}', ${table.tableNumber})">In QR Code</button>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes - Restaurant Tables</title>
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

    h1 {
      text-align: center;
      color: white;
      margin-bottom: 30px;
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .qr-card {
      background: white;
      border-radius: 15px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .qr-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.3);
    }

    .qr-card h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.5rem;
    }

    .qr-card img {
      width: 100%;
      max-width: 250px;
      height: auto;
      border: 3px solid #667eea;
      border-radius: 10px;
      margin-bottom: 15px;
    }

    .qr-data {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 15px;
      word-break: break-all;
      font-family: 'Courier New', monospace;
    }

    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
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
    }

    .actions button {
      margin: 0 10px;
      padding: 15px 30px;
      font-size: 1.1rem;
    }

    @media print {
      body {
        background: white;
      }
      
      .actions {
        display: none;
      }
      
      .qr-card button {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
      }
      
      h1 {
        font-size: 1.8rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍽️ QR Codes - Bàn Nhà Hàng</h1>
    
    <div class="grid">
      ${qrCodeHTML}
    </div>

    <div class="actions">
      <button onclick="window.print()">🖨️ In Tất Cả</button>
      <button onclick="downloadAll()">📥 Tải Tất Cả</button>
    </div>
  </div>

  <script>
    function printQR(fileName, tableNumber) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print QR - Table \${tableNumber}</title>
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
            h1 {
              margin-bottom: 20px;
            }
            img {
              max-width: 400px;
              border: 2px solid #000;
            }
          </style>
        </head>
        <body>
          <h1>Bàn \${tableNumber}</h1>
          <img src="\${fileName}" alt="QR Code Table \${tableNumber}" />
        </body>
        </html>
      \`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    function downloadAll() {
      alert('Tất cả QR codes đã có trong thư mục qr-codes/');
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
