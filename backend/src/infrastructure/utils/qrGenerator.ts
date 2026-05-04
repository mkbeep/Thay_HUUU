/**
 * QR Code Generator Utility
 * Tạo QR codes cho bàn ăn
 */

import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

export interface TableQRData {
  tableId: string;
  tableNumber: string;
  restaurantId: string;
}

export class QRGenerator {
  private outputDir: string;

  constructor(outputDir: string = 'qr-codes') {
    this.outputDir = path.join(process.cwd(), outputDir);
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Tạo QR code cho một bàn
   */
  async generateTableQR(data: TableQRData): Promise<string> {
    const qrData = JSON.stringify({
      type: 'table',
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      restaurantId: data.restaurantId,
      timestamp: new Date().toISOString(),
    });

    const filename = `table-${data.tableNumber}.png`;
    const filepath = path.join(this.outputDir, filename);

    await QRCode.toFile(filepath, qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return filepath;
  }

  /**
   * Tạo QR codes cho nhiều bàn
   */
  async generateMultipleTableQRs(tables: TableQRData[]): Promise<string[]> {
    const filepaths: string[] = [];

    for (const table of tables) {
      const filepath = await this.generateTableQR(table);
      filepaths.push(filepath);
      console.log(`✓ Generated QR for Table ${table.tableNumber}`);
    }

    return filepaths;
  }

  /**
   * Tạo QR code dạng base64 string
   */
  async generateTableQRBase64(data: TableQRData): Promise<string> {
    const qrData = JSON.stringify({
      type: 'table',
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      restaurantId: data.restaurantId,
      timestamp: new Date().toISOString(),
    });

    return await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
    });
  }
}
