import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import { getSessionToken } from '../../utils/sessionToken';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export interface SessionCartLine {
  food_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  price_display?: string;
  note?: string;
  options?: string;
}

export class SessionRepository {
  async createSession(
    tableId: string,
    customerCount: number,
    sessionToken?: string,
    deviceFingerprint?: string,
    qrToken?: string | null
  ): Promise<{ session: any; conflict?: boolean; status: number; minutesSinceActive?: number }> {
    const token = sessionToken || (await getSessionToken()) || undefined;
    const response = await api.post(`/tables/${tableId}/session`, {
      customer_count: customerCount,
      session_token: token,
      device_fingerprint: deviceFingerprint,
      qr_token: qrToken || undefined,
    });
    return {
      session: response.data.data,
      conflict: response.status === 409 || response.data?.conflict,
      status: response.status,
    };
  }

  async ping(sessionId: string): Promise<void> {
    await api.post(`/tables/session/${sessionId}/ping`, {});
  }

  async getState(sessionId: string, sessionToken: string): Promise<{
    cart: SessionCartLine[];
    orders: any[];
    pending_bill?: { id: string; status: string } | null;
    active: boolean;
    session: any;
  }> {
    const response = await api.get(`/tables/session/${sessionId}/state`, {
      params: { session_token: sessionToken },
    });
    return response.data.data;
  }

  async requestPaymentBatch(
    orderIds: string[],
    paymentMethod: 'qr' | 'cash' | 'card' | 'e_wallet'
  ): Promise<void> {
    await api.post('/orders/request-payment-batch', {
      order_ids: orderIds,
      payment_method: paymentMethod,
    });
  }

  /** Gom toàn bộ món unpaid của session thành một bill */
  async requestSessionPayment(
    sessionId: string,
    paymentMethod: 'qr' | 'cash' | 'card' | 'e_wallet'
  ): Promise<{ id: string; total: number; status: string }> {
    const response = await api.post(`/orders/${sessionId}/request-payment`, {
      payment_method: paymentMethod,
    });
    return response.data.data;
  }
}
