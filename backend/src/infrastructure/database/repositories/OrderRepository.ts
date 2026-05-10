/**
 * Order Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { Order, OrderWithItems, OrderStatus, OrderType, OrderItem, PaymentStatus } from '../../../domain/entities/Order';

export class OrderRepository implements IOrderRepository {
  private readonly collection = db.collection('orders');
  private readonly itemsCollection = db.collection('order_item');

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
    return orders;
  }

  async create(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const now = new Date();
    const data = {
      ...orderData,
      status: (orderData as any).status || OrderStatus.PENDING,
      payment_status: (orderData as any).payment_status || PaymentStatus.UNPAID,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(data);
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
