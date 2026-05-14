/**
 * Dữ liệu mẫu tối thiểu để mọi collection “có bản ghi” — phục vụ admin / kiểm thử.
 * Chạy sau khi đã có: dining_table, food, food_topping, inventory, users (seed-admin).
 */

import { db } from '../../config/firebase.config';
import * as admin from 'firebase-admin';
import { OrderStatus, OrderType, PaymentStatus } from '../../../domain/entities/Order';

export async function seedDemoRuntimeData(): Promise<void> {
  const ts = admin.firestore.Timestamp.now();

  const adminSnap = await db.collection('users').where('email', '==', 'admin@gourmet.com').limit(1).get();
  const adminId = adminSnap.empty ? undefined : adminSnap.docs[0].id;

  const tableSnap = await db.collection('dining_table').limit(3).get();
  if (tableSnap.empty) {
    console.log('   ⚠️  demo: không có dining_table — bỏ qua');
    return;
  }
  const table1 = tableSnap.docs[0];
  const table2 = tableSnap.docs[1] ?? tableSnap.docs[0];
  const t2 = table2.data() as { table_number?: string };

  const foodSnap = await db.collection('food').limit(3).get();
  if (foodSnap.size < 1) {
    console.log('   ⚠️  demo: không có food — bỏ qua session/đơn/bếp/thanh toán');
  } else {
    const allTables = await db.collection('dining_table').get();
    for (const d of allTables.docs) {
      await d.ref.update({ status: 'available', updated_at: ts });
    }
  }

  let sessionIdForOrders: string | null = null;
  if (foodSnap.size >= 1) {
    const sessionDoc = await db.collection('table_session').add({
      table_id: table1.id,
      session_code: `S${Date.now().toString(36).toUpperCase().slice(-6)}`,
      customer_count: 2,
      started_at: ts,
      is_active: true,
      ...(adminId ? { created_by: adminId } : {}),
    });
    sessionIdForOrders = sessionDoc.id;

    await table1.ref.update({ status: 'occupied', updated_at: ts });
  }

  const toppingSnap = await db.collection('food_topping').limit(1).get();
  const toppingId = toppingSnap.empty ? null : toppingSnap.docs[0].id;

  const invSnap = await db.collection('inventory').limit(2).get();

  // --- Đơn 1: đang phục vụ (pending + kitchen) ---
  if (foodSnap.size >= 1 && sessionIdForOrders) {
    const f0 = foodSnap.docs[0];
    const f1 = foodSnap.docs[1] ?? f0;
    const d0 = f0.data() as { base_price?: number; name?: string };
    const d1 = f1.data() as { base_price?: number; name?: string };
    const p0 = Number(d0.base_price) || 50000;
    const p1 = Number(d1.base_price) || 45000;
    const q0 = 2;
    const q1 = 1;
    const subtotal = q0 * p0 + q1 * p1;
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;

    const orderRef = await db.collection('orders').add({
      order_number: `ORD-SEED-${Date.now()}`,
      table_session_id: sessionIdForOrders,
      order_type: OrderType.DINE_IN,
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.UNPAID,
      subtotal,
      tax_amount: tax,
      discount_amount: 0,
      total_amount: total,
      notes: 'Dữ liệu mẫu (seed demo)',
      created_at: ts,
      updated_at: ts,
    });

    const oi0Ref = await db.collection('order_item').add({
      order_id: orderRef.id,
      food_id: f0.id,
      quantity: q0,
      unit_price: p0,
      subtotal: q0 * p0,
      special_instructions: undefined,
      status: 'pending',
      created_at: ts,
      updated_at: ts,
    });

    const oi1Ref = await db.collection('order_item').add({
      order_id: orderRef.id,
      food_id: f1.id,
      quantity: q1,
      unit_price: p1,
      subtotal: q1 * p1,
      status: 'preparing',
      created_at: ts,
      updated_at: ts,
    });

    if (toppingId) {
      const topPrice = 10000;
      await db.collection('order_item_topping').add({
        order_item_id: oi0Ref.id,
        topping_id: toppingId,
        quantity: 1,
        unit_price: topPrice,
        subtotal: topPrice,
      });
    }

    await db.collection('kitchen_ticket').add({
      order_item_id: oi0Ref.id,
      food_id: f0.id,
      quantity: q0,
      status: 'pending',
      priority: 'normal',
      created_at: ts,
    });
    await db.collection('kitchen_ticket').add({
      order_item_id: oi1Ref.id,
      food_id: f1.id,
      quantity: q1,
      status: 'in_progress',
      priority: 'normal',
      started_at: ts,
      created_at: ts,
    });

    // --- Đơn 2: đã thanh toán + payment doc ---
    const sub2 = p0;
    const tax2 = Math.round(sub2 * 0.08);
    const total2 = sub2 + tax2;
    const order2Ref = await db.collection('orders').add({
      order_number: `ORD-SEED-PAID-${Date.now()}`,
      table_session_id: sessionIdForOrders,
      order_type: OrderType.DINE_IN,
      status: OrderStatus.COMPLETED,
      payment_status: PaymentStatus.PAID,
      payment_method: 'qr',
      paid_at: ts,
      subtotal: sub2,
      tax_amount: tax2,
      discount_amount: 0,
      total_amount: total2,
      notes: 'Đơn mẫu đã thanh toán',
      created_at: ts,
      updated_at: ts,
      completed_at: ts,
    });

    await db.collection('order_item').add({
      order_id: order2Ref.id,
      food_id: f0.id,
      quantity: 1,
      unit_price: p0,
      subtotal: p0,
      status: 'served',
      created_at: ts,
      updated_at: ts,
    });

    await db.collection('payment').add({
      order_id: order2Ref.id,
      payment_method: 'qr' as any,
      amount: total2,
      status: 'completed',
      transaction_id: `TX-SEED-${Date.now()}`,
      processed_at: ts,
      created_at: ts,
      updated_at: ts,
      ...(adminId ? { processed_by: adminId } : {}),
    });
  }

  // --- inventory_transaction (nhập kho mẫu) ---
  if (!invSnap.empty) {
    const inv = invSnap.docs[0];
    await db.collection('inventory_transaction').add({
      inventory_id: inv.id,
      transaction_type: 'in',
      quantity: 10,
      unit_cost: 1000,
      notes: 'Nhập mẫu từ seed demo',
      created_by: adminId || 'system',
      created_at: ts,
    });
    if (invSnap.docs[1]) {
      await db.collection('inventory_transaction').add({
        inventory_id: invSnap.docs[1].id,
        transaction_type: 'adjustment',
        quantity: -1,
        notes: 'Điều chỉnh mẫu seed',
        created_by: adminId || 'system',
        created_at: ts,
      });
    }
  }

  // --- notification (gửi cho admin nếu có) ---
  if (adminId) {
    await db.collection('notification').add({
      user_id: adminId,
      type: 'order_created',
      title: 'Đơn mẫu từ seed',
      message: 'Hệ thống vừa tạo dữ liệu demo (orders, kitchen_ticket, …).',
      priority: 'normal',
      is_read: false,
      data: { source: 'seed_demo' },
      created_at: ts,
    });
    await db.collection('notification').add({
      user_id: adminId,
      type: 'system_alert',
      title: 'Seed demo hoàn tất',
      message: 'Có thể xóa các bản ghi demo trước khi vận hành thật.',
      priority: 'low',
      is_read: false,
      created_at: ts,
    });
  } else {
    console.log('   ⚠️  demo: không tìm thấy admin@gourmet.com — bỏ qua notification');
  }

  // --- support_requests ---
  await db.collection('support_requests').add({
    table_id: table2.id,
    table_number: String(t2.table_number ?? table2.id),
    type: 'call-staff',
    status: 'pending',
    priority: 'normal',
    note: 'Yêu cầu mẫu từ seed',
    created_at: ts,
    updated_at: ts,
  });

  console.log('   ✅ demo: table_session, orders, order_item, kitchen_ticket, payment, notification, support_requests, inventory_transaction');
}
