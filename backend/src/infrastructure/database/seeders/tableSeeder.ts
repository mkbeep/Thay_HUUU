/**
 * Table Seeder
 * Tạo dữ liệu bàn ăn
 */

import { db } from '../../config/firebase.config';

export async function seedTables() {
  const tables = [
    // Tầng 1 - Khu vực chính
    { table_number: 'T01', capacity: 2, status: 'available', location: 'Tầng 1 - Khu A', qr_code: 'QR_T01' },
    { table_number: 'T02', capacity: 2, status: 'available', location: 'Tầng 1 - Khu A', qr_code: 'QR_T02' },
    { table_number: 'T03', capacity: 4, status: 'available', location: 'Tầng 1 - Khu A', qr_code: 'QR_T03' },
    { table_number: 'T04', capacity: 4, status: 'available', location: 'Tầng 1 - Khu A', qr_code: 'QR_T04' },
    { table_number: 'T05', capacity: 6, status: 'available', location: 'Tầng 1 - Khu A', qr_code: 'QR_T05' },
    
    // Tầng 1 - Khu vực cửa sổ
    { table_number: 'T06', capacity: 2, status: 'available', location: 'Tầng 1 - Khu B', qr_code: 'QR_T06' },
    { table_number: 'T07', capacity: 2, status: 'available', location: 'Tầng 1 - Khu B', qr_code: 'QR_T07' },
    { table_number: 'T08', capacity: 4, status: 'available', location: 'Tầng 1 - Khu B', qr_code: 'QR_T08' },
    { table_number: 'T09', capacity: 4, status: 'available', location: 'Tầng 1 - Khu B', qr_code: 'QR_T09' },
    { table_number: 'T10', capacity: 8, status: 'available', location: 'Tầng 1 - Khu B', qr_code: 'QR_T10' },
    
    // Tầng 2 - Khu VIP
    { table_number: 'V01', capacity: 4, status: 'available', location: 'Tầng 2 - VIP', qr_code: 'QR_V01' },
    { table_number: 'V02', capacity: 6, status: 'available', location: 'Tầng 2 - VIP', qr_code: 'QR_V02' },
    { table_number: 'V03', capacity: 8, status: 'available', location: 'Tầng 2 - VIP', qr_code: 'QR_V03' },
    { table_number: 'V04', capacity: 10, status: 'available', location: 'Tầng 2 - VIP', qr_code: 'QR_V04' },
    { table_number: 'V05', capacity: 12, status: 'available', location: 'Tầng 2 - VIP', qr_code: 'QR_V05' },
    
    // Sân vườn
    { table_number: 'G01', capacity: 4, status: 'available', location: 'Sân vườn', qr_code: 'QR_G01' },
    { table_number: 'G02', capacity: 4, status: 'available', location: 'Sân vườn', qr_code: 'QR_G02' },
    { table_number: 'G03', capacity: 6, status: 'available', location: 'Sân vườn', qr_code: 'QR_G03' },
    { table_number: 'G04', capacity: 6, status: 'available', location: 'Sân vườn', qr_code: 'QR_G04' },
    { table_number: 'G05', capacity: 8, status: 'available', location: 'Sân vườn', qr_code: 'QR_G05' },
  ];

  const createdTables = [];
  for (const table of tables) {
    const docRef = await db.collection('dining_table').add({
      ...table,
      created_at: new Date(),
      updated_at: new Date(),
    });
    createdTables.push({ id: docRef.id, ...table });
  }

  return createdTables;
}
