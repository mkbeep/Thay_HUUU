/**
 * QR Code Generator Utility
 * Tạo QR codes cho bàn ăn
 */

import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { buildTableWebUrl } from './tableWebUrl';

export interface TableQRData {
  tableId: string;
  tableNumber: string;
  restaurantId: string;
}

/** Tên file PNG in QR: dễ phân biệt bàn + ID tài liệu Firebase (an toàn trên Windows). */
export function buildTableQrPngFileName(tableNumber: string | number, tableId: string): string {
  const safe = (v: string) =>
    String(v)
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'x';
  return `QR-ThucDon-Ban_${safe(String(tableNumber))}__ID_${safe(tableId)}.png`;
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
    const qrData = buildTableWebUrl({
      tableId: data.tableId,
      tableNumber: data.tableNumber,
    });

    const filename = buildTableQrPngFileName(data.tableNumber, data.tableId);
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
    const qrData = buildTableWebUrl({
      tableId: data.tableId,
      tableNumber: data.tableNumber,
    });

    return await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
    });
  }
}
