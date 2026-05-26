import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '../src/infrastructure/config/firebase.config';
import { PaymentStatus } from '../src/domain/entities/Order';

dotenv.config({ path: path.join(__dirname, '../.env') });

function toMillis(value: any): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'object' && '_seconds' in value) return value._seconds * 1000;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

async function cleanupPaidOrders(): Promise<number> {
  const ordersSnap = await db.collection('orders').get();
  let fixed = 0;

  for (const orderDoc of ordersSnap.docs) {
    const order = orderDoc.data();
    if (order.status === 'cancelled' || order.payment_status === PaymentStatus.PAID) continue;

    const itemsSnap = await db.collection('order_item').where('order_id', '==', orderDoc.id).get();
    const activeItems = itemsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item: any) => item.status !== 'cancelled');

    if (activeItems.length === 0) continue;
    const allPaid = activeItems.every((item: any) => item.payment_status === PaymentStatus.PAID);
    if (!allPaid) continue;

    const latestPaidAt =
      activeItems
        .map((item: any) => item.paid_at)
        .sort((a: any, b: any) => toMillis(b) - toMillis(a))[0] || new Date();

    await orderDoc.ref.update({
      payment_status: PaymentStatus.PAID,
      paid_at: latestPaidAt,
      updated_at: new Date(),
    });
    fixed += 1;
    console.log(`✅ Marked order paid: ${order.order_number || orderDoc.id}`);
  }

  return fixed;
}

async function cleanupPendingBillsWithPaidItems(): Promise<number> {
  const billsSnap = await db.collection('bills').where('status', '==', 'pending').get();
  let fixed = 0;

  for (const billDoc of billsSnap.docs) {
    const bill = billDoc.data();
    const lines = Array.isArray(bill.items) ? bill.items : [];
    if (lines.length === 0) continue;

    const itemDocs = await Promise.all(
      lines.map((line: any) => db.collection('order_item').doc(String(line.order_item_id)).get())
    );
    const allPaid = itemDocs.every(
      (doc) => doc.exists && doc.data()?.payment_status === PaymentStatus.PAID
    );
    if (!allPaid) continue;

    const latestPaidAt =
      itemDocs
        .map((doc) => doc.data()?.paid_at)
        .sort((a, b) => toMillis(b) - toMillis(a))[0] || new Date();

    await billDoc.ref.update({
      status: 'paid',
      paid_at: latestPaidAt,
      updated_at: new Date(),
    });
    fixed += 1;
    console.log(`✅ Marked stale pending bill paid: ${billDoc.id}`);
  }

  return fixed;
}

async function main() {
  console.log('🧹 Cleaning paid orders/bills that still show in admin...');
  const [ordersFixed, billsFixed] = await Promise.all([
    cleanupPaidOrders(),
    cleanupPendingBillsWithPaidItems(),
  ]);
  console.log(`\nDone. Orders fixed: ${ordersFixed}. Bills fixed: ${billsFixed}.`);
}

main().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
