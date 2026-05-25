/**
 * Report Repository - fetches orders (embedded items or order_item subcollection) and food names.
 */
import { db } from '../../config/firebase.config';
import { toDate } from '../../../domain/utils/firestoreDate';
import type { ReportOrder, ReportOrderItem } from '../../../domain/utils/reportAggregations';
import type { DateRange } from '../../../domain/utils/reportDateRanges';

const CHUNK_SIZE = 10; // Firestore "in" query limit

export class ReportRepository {
  private readonly ordersCollection = db.collection('orders');
  private readonly orderItemsCollection = db.collection('order_item');
  private readonly foodCollection = db.collection('food');

  /**
   * Fetch orders in [range.start, range.end] by created_at.
   * Items: embedded `items[]` on order doc, else loaded from order_item collection.
   */
  async findOrdersInRange(range: DateRange): Promise<ReportOrder[]> {
    const snapshot = await this.ordersCollection
      .where('payment_status', '==', 'paid')
      .get();
    const rawOrders: Array<{
      id: string;
      created_at: Date;
      status?: string;
      payment_status?: string;
      embeddedItems?: ReportOrderItem[];
    }> = [];

    const needsSubcollection: string[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const paymentStatus = String(data.payment_status || '');
      const reportDate = paymentStatus === 'paid'
        ? toDate(data.paid_at || data.created_at)
        : toDate(data.created_at);
      if (reportDate < range.start || reportDate > range.end) continue;

      const embedded = this.parseEmbeddedItems(data.items);
      if (embedded.length > 0) {
        rawOrders.push({
          id: doc.id,
          created_at: reportDate,
          status: data.status,
          payment_status: data.payment_status,
          embeddedItems: embedded,
        });
      } else {
        rawOrders.push({
          id: doc.id,
          created_at: reportDate,
          status: data.status,
          payment_status: data.payment_status,
        });
        needsSubcollection.push(doc.id);
      }
    }

    const itemsByOrderId = await this.loadOrderItemsBatch(needsSubcollection);

    return rawOrders.map((o) => ({
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      payment_status: o.payment_status,
      items: o.embeddedItems ?? itemsByOrderId.get(o.id) ?? [],
    }));
  }

  async getFoodNamesByIds(ids: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const unique = [...new Set(ids.filter(Boolean))];

    await Promise.all(
      unique.map(async (id) => {
        const doc = await this.foodCollection.doc(id).get();
        if (doc.exists) {
          const name = (doc.data()?.name as string) || id;
          map.set(id, name);
        }
      })
    );

    return map;
  }

  private parseEmbeddedItems(items: unknown): ReportOrderItem[] {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        const row = item as Record<string, unknown>;
        const food_id = String(row.food_id || '');
        if (!food_id) return null;
        return {
          food_id,
          quantity: Number(row.quantity || 0),
          unit_price: Number(row.unit_price || 0),
        };
      })
      .filter((x): x is ReportOrderItem => x !== null);
  }

  private async loadOrderItemsBatch(orderIds: string[]): Promise<Map<string, ReportOrderItem[]>> {
    const result = new Map<string, ReportOrderItem[]>();
    if (orderIds.length === 0) return result;

    for (let i = 0; i < orderIds.length; i += CHUNK_SIZE) {
      const chunk = orderIds.slice(i, i + CHUNK_SIZE);
      const snapshot = await this.orderItemsCollection
        .where('order_id', 'in', chunk)
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const orderId = String(data.order_id || '');
        if (!orderId) continue;

        const item: ReportOrderItem = {
          food_id: String(data.food_id || ''),
          quantity: Number(data.quantity || 0),
          unit_price: Number(data.unit_price || 0),
        };

        if (!result.has(orderId)) result.set(orderId, []);
        result.get(orderId)!.push(item);
      }
    }

    return result;
  }
}
