/**
 * Order Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { Order, OrderWithItems, OrderStatus, OrderType, OrderItem, PaymentStatus } from '../../../domain/entities/Order';
import { BillRepository } from './BillRepository';

export class OrderRepository implements IOrderRepository {
  private readonly collection = db.collection('orders');
  private readonly itemsCollection = db.collection('order_item');

  private normalizeVndAmount(value: unknown): number {
    const amount = Number(value) || 0;
    return amount > 0 && amount < 1000 ? amount * 1000 : amount;
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Order;
  }

  async findByIdWithItems(id: string): Promise<OrderWithItems | null> {
    const order = await this.findById(id);
    if (!order) return null;

    const itemsSnapshot = await this.itemsCollection
      .where('order_id', '==', id)
      .get();

    const items = await Promise.all(
      itemsSnapshot.docs.map(async (doc) => {
        const itemData = doc.data() as OrderItem;
        
        // Lấy thông tin food
        const foodDoc = await db.collection('food').doc(itemData.food_id).get();
        const food = foodDoc.exists ? { id: foodDoc.id, ...foodDoc.data() } : null;

        // Lấy toppings nếu có
        const toppingsSnapshot = await db.collection('order_item_topping')
          .where('order_item_id', '==', doc.id)
          .get();
        
        const toppings = toppingsSnapshot.docs.map(tDoc => ({
          id: tDoc.id,
          ...tDoc.data()
        }));

        return {
          ...itemData,
          id: doc.id,
          food,
          toppings,
        };
      })
    );

    return { ...order, items } as OrderWithItems;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const snapshot = await this.collection
      .where('order_number', '==', orderNumber)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Order;
  }

  private async getFoodSummary(foodId: string): Promise<{ id: string; name?: string; image_url?: string } | null> {
    const foodDoc = await db.collection('food').doc(foodId).get();
    if (!foodDoc.exists) return null;
    const foodData = foodDoc.data() as { name?: string; image_url?: string };
    let imageUrl = foodData.image_url || '';
    if (!imageUrl) {
      const imagesSnap = await db.collection('food_image').where('food_id', '==', foodId).get();
      const primary =
        imagesSnap.docs.find((d) => d.data().is_primary) || imagesSnap.docs[0];
      imageUrl = primary?.data()?.image_url || '';
    }
    return { id: foodDoc.id, name: foodData.name, image_url: imageUrl || undefined };
  }

  private itemStatusToOrderStatus(itemStatus: OrderItem['status']): OrderStatus {
    const map: Record<string, OrderStatus> = {
      pending: OrderStatus.PENDING,
      confirmed: OrderStatus.CONFIRMED,
      preparing: OrderStatus.PREPARING,
      ready: OrderStatus.READY,
      served: OrderStatus.SERVED,
      cancelled: OrderStatus.CANCELLED,
    };
    return map[itemStatus] || OrderStatus.PENDING;
  }

  async findAllWithItems(filters?: {
    status?: OrderStatus;
    order_type?: OrderType;
    table_session_id?: string;
    customer_id?: string;
    from_date?: Date;
    to_date?: Date;
  }): Promise<OrderWithItems[]> {
    const orders = await this.findAll(filters);
    return Promise.all(
      orders.map(async (order) => {
        const itemsSnap = await this.itemsCollection.where('order_id', '==', order.id).get();
        const items = await Promise.all(
          itemsSnap.docs.map(async (doc) => {
            const itemData = doc.data() as OrderItem;
            const food = itemData.food_id ? await this.getFoodSummary(itemData.food_id) : null;
            return { ...itemData, id: doc.id, food };
          })
        );
        return { ...order, items } as OrderWithItems;
      })
    );
  }

  async findAll(filters?: {
    status?: OrderStatus;
    order_type?: OrderType;
    table_session_id?: string;
    customer_id?: string;
    from_date?: Date;
    to_date?: Date;
  }): Promise<Order[]> {
    let query: FirebaseFirestore.Query = this.collection;

    const shouldFilterPendingInMemory = filters?.status === OrderStatus.PENDING;
    if (filters?.status && !shouldFilterPendingInMemory) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.order_type) {
      query = query.where('order_type', '==', filters.order_type);
    }

    if (filters?.table_session_id) {
      query = query.where('table_session_id', '==', filters.table_session_id);
    }

    if (filters?.customer_id) {
      query = query.where('customer_id', '==', filters.customer_id);
    }

    const snapshot = await query.get();
    let orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));

    // Backward compatibility: các đơn cũ thiếu status được xem là pending
    if (shouldFilterPendingInMemory) {
      orders = orders.filter((order) => !order.status || order.status === OrderStatus.PENDING);
    }

    // Filter dates in memory to avoid Firestore composite index requirements
    if (filters?.from_date) {
      orders = orders.filter((order) => new Date(order.created_at) >= filters.from_date!);
    }

    if (filters?.to_date) {
      orders = orders.filter((order) => new Date(order.created_at) <= filters.to_date!);
    }

    // Sort in memory instead of orderBy on query
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return orders;
  }

  async findByTableSession(tableSessionId: string): Promise<Order[]> {
    const snapshot = await this.collection
      .where('table_session_id', '==', tableSessionId)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  }

  async hasPendingPaymentInSession(tableSessionId: string): Promise<boolean> {
    return new BillRepository().hasPendingBill(tableSessionId);
  }

  async create(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const now = new Date();
    const rawItems = Array.isArray((orderData as any).items) ? (orderData as any).items : [];
    const subtotal = rawItems.reduce(
      (sum: number, item: any) => sum + this.normalizeVndAmount(item.unit_price) * Number(item.quantity || 0),
      0
    );
    const taxAmount = subtotal * 0.08;
    const discountAmount = this.normalizeVndAmount((orderData as any).discount_amount || 0);
    const totalAmount = subtotal + taxAmount - discountAmount;
    const fallbackSubtotal = this.normalizeVndAmount((orderData as any).subtotal);
    const normalizedSubtotal = rawItems.length > 0 ? subtotal : fallbackSubtotal;
    const normalizedTaxAmount =
      rawItems.length > 0
        ? taxAmount
        : this.normalizeVndAmount((orderData as any).tax_amount);
    const normalizedTotalAmount =
      rawItems.length > 0
        ? totalAmount
        : this.normalizeVndAmount((orderData as any).total_amount);
    const orderPayload = { ...(orderData as any) };
    delete orderPayload.items;
    const data = {
      ...orderPayload,
      status: (orderData as any).status || OrderStatus.PENDING,
      payment_status: (orderData as any).payment_status || PaymentStatus.UNPAID,
      subtotal: normalizedSubtotal,
      tax_amount: normalizedTaxAmount,
      discount_amount: discountAmount,
      total_amount: normalizedTotalAmount,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(data);
    if (rawItems.length > 0) {
      const batch = db.batch();
      rawItems.forEach((item: any) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = this.normalizeVndAmount(item.unit_price);
        const itemRef = this.itemsCollection.doc();
        batch.set(itemRef, {
          order_id: docRef.id,
          food_id: item.food_id,
          quantity,
          unit_price: unitPrice,
          subtotal: quantity * unitPrice,
          special_instructions: item.notes || item.special_instructions || '',
          status: 'pending',
          payment_status: PaymentStatus.UNPAID,
          created_at: now,
          updated_at: now,
        });
      });
      await batch.commit();
    }
    return { id: docRef.id, ...data } as Order;
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Order not found after update');
    return updated;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (status === OrderStatus.COMPLETED) {
      updateData.completed_at = new Date();
    }

    await this.collection.doc(id).update(updateData);

    const itemStatusMap: Partial<Record<OrderStatus, OrderItem['status']>> = {
      [OrderStatus.PENDING]: 'pending',
      [OrderStatus.CONFIRMED]: 'pending',
      [OrderStatus.PREPARING]: 'preparing',
      [OrderStatus.READY]: 'ready',
      [OrderStatus.SERVED]: 'served',
      [OrderStatus.CANCELLED]: 'cancelled',
      [OrderStatus.COMPLETED]: 'served',
    };
    const itemStatus = itemStatusMap[status];
    if (itemStatus) {
      const itemsSnap = await this.itemsCollection.where('order_id', '==', id).get();
      const batch = db.batch();
      itemsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { status: itemStatus, updated_at: new Date() });
      });
      if (!itemsSnap.empty) await batch.commit();
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error('Order not found after update');
    return updated;
  }

  /** Đơn + order_item cho app khách (theo session, không query toàn collection) */
  async findItemById(itemId: string): Promise<(OrderItem & { order?: Order }) | null> {
    const doc = await this.itemsCollection.doc(itemId).get();
    if (!doc.exists) return null;
    const item = { id: doc.id, ...doc.data() } as OrderItem;
    const order = await this.findById(item.order_id);
    return { ...item, order: order || undefined };
  }

  async updateItemStatus(
    itemId: string,
    status: OrderItem['status']
  ): Promise<OrderItem & { order_id: string; table_session_id?: string }> {
    const doc = await this.itemsCollection.doc(itemId).get();
    if (!doc.exists) throw new Error('ORDER_ITEM_NOT_FOUND');
    const data = doc.data() as OrderItem;
    await this.itemsCollection.doc(itemId).update({ status, updated_at: new Date() });
    const orderStatus = this.itemStatusToOrderStatus(status);
    await this.collection.doc(data.order_id).update({
      status: orderStatus,
      updated_at: new Date(),
    });
    const order = await this.findById(data.order_id);
    return {
      ...data,
      id: itemId,
      status,
      order_id: data.order_id,
      table_session_id: order?.table_session_id,
    };
  }

  async updateItemPayment(
    itemId: string,
    paymentMethod?: 'qr' | 'cash' | 'card' | 'e_wallet'
  ): Promise<OrderItem & { order_id: string; table_session_id?: string }> {
    const doc = await this.itemsCollection.doc(itemId).get();
    if (!doc.exists) throw new Error('ORDER_ITEM_NOT_FOUND');
    const data = doc.data() as OrderItem;
    const update: Record<string, unknown> = {
      payment_status: PaymentStatus.PAID,
      paid_at: new Date(),
      updated_at: new Date(),
    };
    if (paymentMethod) update.payment_method = paymentMethod;
    await this.itemsCollection.doc(itemId).update(update);
    const order = await this.findById(data.order_id);
    return {
      ...data,
      id: itemId,
      payment_status: PaymentStatus.PAID,
      order_id: data.order_id,
      table_session_id: order?.table_session_id,
    };
  }

  async findAllItemsBySession(
    tableSessionId: string,
    options?: { includeCancelledOrders?: boolean }
  ): Promise<OrderItem[]> {
    const orders = await this.findByTableSession(tableSessionId);
    const items: OrderItem[] = [];
    for (const order of orders) {
      if (!options?.includeCancelledOrders && order.status === OrderStatus.CANCELLED) continue;
      const snap = await this.itemsCollection.where('order_id', '==', order.id).get();
      snap.docs.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as OrderItem);
      });
    }
    return items;
  }

  async areAllSessionItemsPaid(tableSessionId: string): Promise<boolean> {
    const items = await this.findAllItemsBySession(tableSessionId);
    if (items.length === 0) return false;
    return items.every((i) => i.payment_status === PaymentStatus.PAID);
  }

  async hasSessionPendingOrPreparingItems(tableSessionId: string): Promise<boolean> {
    const items = await this.findAllItemsBySession(tableSessionId);
    const kitchenPending = new Set(['pending', 'confirmed', 'preparing']);
    return items.some(
      (i) => i.status !== 'cancelled' && kitchenPending.has(i.status)
    );
  }

  async areAllSessionItemsCancelled(tableSessionId: string): Promise<boolean> {
    const items = await this.findAllItemsBySession(tableSessionId, {
      includeCancelledOrders: true,
    });
    return items.length > 0 && items.every((i) => i.status === 'cancelled');
  }

  async findUnpaidItemsForBill(
    tableSessionId: string
  ): Promise<
    Array<
      OrderItem & {
        food_name?: string;
        table_session_id?: string;
        table_number?: string;
        table_id?: string;
      }
    >
  > {
    const orders = await this.findByTableSession(tableSessionId);
    const lines: Array<
      OrderItem & {
        food_name?: string;
        table_session_id?: string;
        table_number?: string;
        table_id?: string;
      }
    > = [];

    for (const order of orders) {
      if (order.status === OrderStatus.CANCELLED) continue;
      const snap = await this.itemsCollection.where('order_id', '==', order.id).get();
      for (const doc of snap.docs) {
        const item = { id: doc.id, ...doc.data() } as OrderItem;
        if (item.status === 'cancelled') continue;
        if (item.payment_status === PaymentStatus.PAID) continue;
        let foodName: string | undefined;
        if (item.food_id) {
          const food = await this.getFoodSummary(item.food_id);
          foodName = food?.name;
        }
        lines.push({
          ...item,
          food_name: foodName,
          table_session_id: order.table_session_id,
          table_number: order.table_number,
        });
      }
    }
    return lines;
  }

  async markItemsPaid(itemIds: string[], paymentMethod?: string): Promise<void> {
    if (itemIds.length === 0) return;
    const now = new Date();
    const batch = db.batch();
    for (const itemId of itemIds) {
      const update: Record<string, unknown> = {
        payment_status: PaymentStatus.PAID,
        paid_at: now,
        updated_at: now,
      };
      if (paymentMethod) update.payment_method = paymentMethod;
      batch.update(this.itemsCollection.doc(itemId), update);
    }
    await batch.commit();
  }

  async countSessionPendingKitchenItems(tableSessionId: string): Promise<number> {
    const items = await this.findAllItemsBySession(tableSessionId);
    const kitchenPending = new Set(['pending', 'confirmed', 'preparing']);
    return items.filter(
      (i) => i.status !== 'cancelled' && kitchenPending.has(i.status)
    ).length;
  }

  async getSessionUnpaidTotal(tableSessionId: string): Promise<number> {
    const items = await this.findAllItemsBySession(tableSessionId);
    let total = 0;
    for (const item of items) {
      if (item.payment_status === PaymentStatus.PAID) continue;
      if (item.status === 'cancelled') continue;
      total += this.normalizeVndAmount(item.subtotal || item.unit_price * item.quantity);
    }
    return total;
  }

  async findPublicOrdersWithItems(tableSessionId: string): Promise<any[]> {
    const orders = await this.findByTableSession(tableSessionId);
    const active = orders.filter((o) => o.status !== OrderStatus.CANCELLED);

    return Promise.all(
      active.map(async (order) => {
        const itemsSnap = await this.itemsCollection.where('order_id', '==', order.id).get();
        const items = await Promise.all(
          itemsSnap.docs.map(async (doc) => {
            const itemData = doc.data() as OrderItem;
            const food = itemData.food_id
              ? await this.getFoodSummary(itemData.food_id)
              : null;
            return {
              ...itemData,
              id: doc.id,
              food,
            };
          })
        );
        const visibleItems = items.filter(
          (i) => i.status !== 'cancelled' && i.payment_status !== PaymentStatus.PAID
        );
        if (visibleItems.length === 0) return null;
        return { ...order, items: visibleItems };
      })
    ).then((rows) => rows.filter(Boolean));
  }

  async requestPaymentForOrders(
    orderIds: string[],
    paymentMethod: 'qr' | 'cash' | 'card' | 'e_wallet'
  ): Promise<Order[]> {
    const results: Order[] = [];
    for (const id of orderIds) {
      const order = await this.requestPayment(id, paymentMethod);
      results.push(order);
    }
    return results;
  }

  /**
   * Khách chỉ được hủy khi bếp chưa bắt đầu (pending / confirmed).
   */
  async cancelIfAllowed(id: string, tableSessionId?: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    if (tableSessionId !== undefined && tableSessionId !== '' && order.table_session_id !== tableSessionId) {
      throw new Error('TABLE_MISMATCH');
    }
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new Error('CANCEL_NOT_ALLOWED');
    }
    await this.collection.doc(id).update({
      status: OrderStatus.CANCELLED,
      updated_at: new Date(),
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error('Order not found after cancel');
    return updated;
  }

  async requestPayment(
    id: string,
    paymentMethod: 'qr' | 'cash' | 'card' | 'e_wallet'
  ): Promise<Order> {
    await this.collection.doc(id).update({
      payment_status: PaymentStatus.PENDING_CONFIRMATION,
      payment_method: paymentMethod,
      payment_requested_at: new Date(),
      updated_at: new Date(),
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error('Order not found after payment request');
    return updated;
  }

  async confirmPayment(id: string): Promise<Order> {
    const now = new Date();
    await this.collection.doc(id).update({
      payment_status: PaymentStatus.PAID,
      paid_at: now,
      updated_at: now,
    });

    const itemsSnapshot = await this.itemsCollection.where('order_id', '==', id).get();
    if (!itemsSnapshot.empty) {
      const batch = db.batch();
      itemsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          payment_status: PaymentStatus.PAID,
          paid_at: now,
          updated_at: now,
        });
      });
      await batch.commit();
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error('Order not found after payment confirm');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
    
    // Xóa order items
    const itemsSnapshot = await this.itemsCollection
      .where('order_id', '==', id)
      .get();
    
    const batch = db.batch();
    itemsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Format: ORD-YYYYMMDD-XXXX
    const prefix = `ORD-${year}${month}${day}`;
    
    // Lấy order cuối cùng trong ngày
    const snapshot = await this.collection
      .where('order_number', '>=', prefix)
      .where('order_number', '<', `${prefix}-9999`)
      .orderBy('order_number', 'desc')
      .limit(1)
      .get();

    let sequence = 1;
    if (!snapshot.empty) {
      const lastOrderNumber = snapshot.docs[0].data().order_number;
      const lastSequence = parseInt(lastOrderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
