/**
 * Promotion Seeder
 * Tạo dữ liệu khuyến mãi
 */

import { db } from '../../config/firebase.config';

export async function seedPromotions() {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const promotions = [
    {
      code: 'WELCOME10',
      name: 'Giảm 10% cho khách hàng mới',
      description: 'Giảm 10% cho đơn hàng đầu tiên, áp dụng cho tất cả món ăn',
      type: 'percentage',
      discount_value: 10,
      min_order_amount: 100000,
      max_discount_amount: 50000,
      start_date: now,
      end_date: nextMonth,
      is_active: true,
      usage_limit: 1000,
      usage_count: 0,
    },
    {
      code: 'FREESHIP',
      name: 'Miễn phí giao hàng',
      description: 'Miễn phí giao hàng cho đơn từ 200k',
      type: 'fixed_amount',
      discount_value: 30000,
      min_order_amount: 200000,
      start_date: now,
      end_date: nextMonth,
      is_active: true,
      usage_limit: 500,
      usage_count: 0,
    },
    {
      code: 'HAPPYHOUR',
      name: 'Happy Hour - Giảm 20%',
      description: 'Giảm 20% cho tất cả đồ uống từ 14h-16h hàng ngày',
      type: 'percentage',
      discount_value: 20,
      min_order_amount: 50000,
      max_discount_amount: 100000,
      start_date: now,
      end_date: nextMonth,
      is_active: true,
      usage_count: 0,
    },
    {
      code: 'WEEKEND50',
      name: 'Giảm 50k cuối tuần',
      description: 'Giảm 50k cho đơn hàng từ 300k vào thứ 7, chủ nhật',
      type: 'fixed_amount',
      discount_value: 50000,
      min_order_amount: 300000,
      start_date: now,
      end_date: nextMonth,
      is_active: true,
      usage_count: 0,
    },
    {
      code: 'COMBO99',
      name: 'Combo tiết kiệm 99k',
      description: 'Giảm 99k cho combo từ 2 món chính trở lên',
      type: 'fixed_amount',
      discount_value: 99000,
      min_order_amount: 400000,
      start_date: now,
      end_date: nextWeek,
      is_active: true,
      usage_limit: 100,
      usage_count: 0,
    },
    {
      code: 'MEMBER15',
      name: 'Ưu đãi thành viên 15%',
      description: 'Giảm 15% cho khách hàng thân thiết',
      type: 'percentage',
      discount_value: 15,
      min_order_amount: 150000,
      max_discount_amount: 100000,
      start_date: now,
      end_date: nextMonth,
      is_active: true,
      usage_count: 0,
    },
  ];

  const createdPromotions = [];
  for (const promotion of promotions) {
    const docRef = await db.collection('promotion').add({
      ...promotion,
      created_at: new Date(),
      updated_at: new Date(),
    });
    createdPromotions.push({ id: docRef.id, ...promotion });
  }

  return createdPromotions;
}
