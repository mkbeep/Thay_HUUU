/**
 * Cart Repository — collection "carts", document id = sessionId
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/firebase.config';
import { CartLine, SessionCart } from '../../../domain/entities/Cart';

export class CartRepository {
  private readonly collection = db.collection('carts');

  async getBySessionId(sessionId: string): Promise<SessionCart | null> {
    const doc = await this.collection.doc(sessionId).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      session_id: sessionId,
      items: (data.items as CartLine[]) || [],
      updated_at: data.updated_at as Date,
    };
  }

  async upsert(sessionId: string, items: CartLine[]): Promise<SessionCart> {
    const now = new Date();
    const normalized = items.map((line) => ({
      ...line,
      id: line.id || uuidv4(),
    }));
    await this.collection.doc(sessionId).set(
      { session_id: sessionId, items: normalized, updated_at: now },
      { merge: true }
    );
    return { session_id: sessionId, items: normalized, updated_at: now };
  }

  async removeItem(sessionId: string, itemId: string): Promise<SessionCart> {
    const existing = await this.getBySessionId(sessionId);
    const items = (existing?.items || []).filter((i) => i.id !== itemId);
    return this.upsert(sessionId, items);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.collection.doc(sessionId).delete();
  }
}
