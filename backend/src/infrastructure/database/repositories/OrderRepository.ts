/**
 * Order Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { Order, OrderWithItems, OrderStatus, OrderType, OrderItem } from '../../../domain/entities/Order';

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

    if (filters?.status) {
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

    if (filters?.from_date) {
      query = query.where('created_at', '>=', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.where('created_at', '<=', filters.to_date);
    }

    query = query.orderBy('created_at', 'desc');

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  }

  async create(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const now = new Date();
    const data = {
      ...orderData,
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
