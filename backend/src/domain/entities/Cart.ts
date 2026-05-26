/**
 * Server-side cart — Firestore collection "carts", document id = sessionId
 */

export interface CartLine {
  id: string;
  food_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  price_display?: string;
  note?: string;
  options?: string;
}

export interface SessionCart {
  session_id: string;
  items: CartLine[];
  updated_at: Date;
}
