/**
 * Order Repository Implementation - Infrastructure Layer
 */

import { db, firebaseAdmin } from '../../config/firebase.config';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { Order, OrderWithItems, OrderStatus, OrderType, OrderItem, PaymentStatus } from '../../../domain/entities/Order';

export class OrderRepository implements IOrderRepository {
  private readonly collection = db.collection('orders');
  private readonly itemsCollection = db.collection('order_item');

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  private async attachTableNumbers<T extends Order>(orders: T[]): Promise<T[]> {
    const missingTableNumber = orders.filter((order) => {
      const tableNumber = (order as any).table_number;
      return !tableNumber && order.table_session_id && String(order.table_session_id).trim() !== '';
    });

    if (missingTableNumber.length === 0) return orders;

    const sessionIds = Array.from(
      new Set(missingTableNumber.map((order) => String(order.table_session_id)))
    );
    const sessionById = new Map<string, any>();

    for (const ids of this.chunk(sessionIds, 10)) {
      const snapshot = await db
        .collection('table_session')
        .where(firebaseAdmin.firestore.FieldPath.documentId(), 'in', ids)
        .get();
      snapshot.docs.forEach((doc) => sessionById.set(doc.id, { id: doc.id, ...doc.data() }));
    }

    const tableIds = Array.from(
      new Set(
        Array.from(sessionById.values())
          .map((session) => session.table_id)
          .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
      )
    );
    const tableNumberById = new Map<string, string | number>();

    for (const ids of this.chunk(tableIds, 10)) {
      const snapshot = await db
        .collection('dining_table')
        .where(firebaseAdmin.firestore.FieldPath.documentId(), 'in', ids)
        .get();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.table_number !== undefined && data.table_number !== null) {
          tableNumberById.set(doc.id, data.table_number);
        }
      });
    }

    return orders.map((order) => {
      if ((order as any).table_number || !order.table_session_id) return order;
      const session = sessionById.get(String(order.table_session_id));
      const tableNumber = session?.table_id ? tableNumberById.get(session.table_id) : undefined;
      return tableNumber !== undefined ? ({ ...order, table_number: tableNumber } as T) : order;
    });
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
    return this.attachTableNumbers(orders);
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

  async findByTableSessionWithItems(tableSessionId: string): Promise<OrderWithItems[]> {
    const orders = await this.findByTableSession(tableSessionId);
    return Promise.all(
      orders.map(async (order) => {
        const withItems = await this.findByIdWithItems(order.id);
        if (withItems && withItems.items.length > 0) return withItems;

        const embeddedItems = Array.isArray((order as any).items) ? (order as any).items : [];
        const items = await Promise.all(
          embeddedItems.map(async (item: any, index: number) => {
            const foodId = item.food_id || item.foodId;
            const foodDoc = foodId ? await db.collection('food').doc(foodId).get() : null;
            const food = foodDoc?.exists ? { id: foodDoc.id, ...foodDoc.data() } : null;
            return {
              ...item,
              id: item.id || `${order.id}_${index}`,
              order_id: order.id,
              food_id: foodId,
              unit_price: item.unit_price ?? item.unitPrice ?? 0,
              subtotal:
                Number(item.unit_price ?? item.unitPrice ?? 0) * Number(item.quantity ?? 0),
              special_instructions: item.special_instructions ?? item.notes ?? '',
              status: item.status || 'pending',
              created_at: order.created_at,
              updated_at: order.updated_at,
              food,
              toppings: [],
            };
          })
        );

        return { ...order, items } as OrderWithItems;
      })
    );
  }

  async create(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> & { items?: any[] }): Promise<Order> {
    const now = new Date();
    const items = Array.isArray((orderData as any).items) ? (orderData as any).items : [];
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.unit_price || item.unitPrice || 0) * Number(item.quantity || 0),
      0
    );
    const taxAmount = Number((subtotal * 0.08).toFixed(2));
    const totalAmount = subtotal + taxAmount;
    const data = {
      ...orderData,
      status: (orderData as any).status || OrderStatus.PENDING,
      payment_status: (orderData as any).payment_status || PaymentStatus.UNPAID,
      subtotal: (orderData as any).subtotal ?? subtotal,
      tax_amount: (orderData as any).tax_amount ?? taxAmount,
      total_amount: (orderData as any).total_amount ?? totalAmount,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(data);

    if (items.length > 0) {
      const batch = db.batch();
      items.forEach((item: any) => {
        const unitPrice = Number(item.unit_price || item.unitPrice || 0);
        const quantity = Number(item.quantity || 0);
        const itemRef = this.itemsCollection.doc();
        batch.set(itemRef, {
          order_id: docRef.id,
          food_id: item.food_id || item.foodId,
          quantity,
          unit_price: unitPrice,
          subtotal: unitPrice * quantity,
          special_instructions: item.special_instructions || item.notes || '',
          status: 'pending',
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
    const updated = await this.findById(id);
    if (!updated) throw new Error('Order not found after update');
    return updated;
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
    await this.collection.doc(id).update({
      payment_status: PaymentStatus.PAID,
      paid_at: new Date(),
      updated_at: new Date(),
    });

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
