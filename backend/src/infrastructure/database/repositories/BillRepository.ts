/**
 * Bill Repository — collection bills
 */

import { db } from '../../config/firebase.config';
import { Bill, BillLineItem, BillStatus } from '../../../domain/entities/Bill';
import { PaymentStatus } from '../../../domain/entities/Order';

export class BillRepository {
  private readonly collection = db.collection('bills');

  private withVatFallback(bill: Bill): Bill {
    if (typeof bill.tax_amount === 'number') return bill;
    const subtotal = Number(bill.subtotal ?? bill.total ?? 0);
    const taxAmount = Math.round(subtotal * 0.08);
    return {
      ...bill,
      subtotal,
      tax_amount: taxAmount,
      total: subtotal + taxAmount,
    };
  }

  async findById(id: string): Promise<Bill | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.withVatFallback({ id: doc.id, ...doc.data() } as Bill);
  }

  async findPendingBySession(sessionId: string): Promise<Bill | null> {
    const snapshot = await this.collection
      .where('session_id', '==', sessionId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.withVatFallback({ id: doc.id, ...doc.data() } as Bill);
  }

  async hasPendingBill(sessionId: string): Promise<boolean> {
    const bill = await this.findPendingBySession(sessionId);
    return bill != null;
  }

  async findAllPending(): Promise<Bill[]> {
    const snapshot = await this.collection.where('status', '==', 'pending').get();
    const bills = snapshot.docs.map((doc) =>
      this.withVatFallback({ id: doc.id, ...doc.data() } as Bill)
    );
    bills.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
    return bills;
  }

  async create(data: {
    session_id: string;
    table_id?: string;
    table_number?: string;
    payment_method: 'qr' | 'cash' | 'card' | 'e_wallet';
    items: BillLineItem[];
    subtotal?: number;
    tax_amount?: number;
    total: number;
  }): Promise<Bill> {
    const now = new Date();
    const payload = {
      session_id: data.session_id,
      table_id: data.table_id,
      table_number: data.table_number,
      status: 'pending' as BillStatus,
      payment_method: data.payment_method,
      items: data.items,
      subtotal: data.subtotal ?? data.total,
      tax_amount: data.tax_amount ?? 0,
      total: data.total,
      requested_at: now,
      created_at: now,
      updated_at: now,
    };
    const docRef = await this.collection.add(payload);
    return { id: docRef.id, ...payload };
  }

  async confirmPayment(id: string): Promise<Bill> {
    const now = new Date();
    await this.collection.doc(id).update({
      status: 'paid',
      paid_at: now,
      updated_at: now,
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error('Bill not found after confirm');
    return updated;
  }

  /** Đánh dấu món trong bill là đã thanh toán */
  async markBillItemsPaid(bill: Bill): Promise<void> {
    const now = new Date();
    const batch = db.batch();
    const affectedOrderIds = new Set<string>();
    for (const line of bill.items) {
      const ref = db.collection('order_item').doc(line.order_item_id);
      batch.update(ref, {
        payment_status: PaymentStatus.PAID,
        ...(bill.payment_method ? { payment_method: bill.payment_method } : {}),
        paid_at: now,
        updated_at: now,
      });
      if (line.order_id) affectedOrderIds.add(line.order_id);
    }
    if (bill.items.length > 0) await batch.commit();

    await Promise.all(
      [...affectedOrderIds].map(async (orderId) => {
        const itemsSnap = await db.collection('order_item').where('order_id', '==', orderId).get();
        const activeItems = itemsSnap.docs
          .map((doc) => doc.data())
          .filter((item) => item.status !== 'cancelled');
        if (activeItems.length === 0) return;
        const allPaid = activeItems.every((item) => item.payment_status === PaymentStatus.PAID);
        if (!allPaid) return;

        await db.collection('orders').doc(orderId).update({
          payment_status: PaymentStatus.PAID,
          ...(bill.payment_method ? { payment_method: bill.payment_method } : {}),
          paid_at: now,
          updated_at: now,
        });
      })
    );
  }
}
