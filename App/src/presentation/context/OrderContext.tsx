import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import { Alert } from 'react-native';
import { Order as DomainOrder, OrderStatus as DomainOrderStatus } from '../../domain/models/Order';
import { OrderService } from '../../business/services/OrderService';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import { socketService } from '../../services/socketService';
import { useTable } from './TableContext';
import { SessionRepository } from '../../data/repositories/SessionRepository';
import { getApiBaseUrl as getApiOrigin } from '../../utils/apiBaseUrl';

function parseFirestoreDate(value: unknown): Date {
  if (value == null) return new Date();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? new Date() : value;
  if (typeof value === 'object' && value !== null && '_seconds' in (value as object)) {
    const s = (value as { _seconds: number; _nanoseconds?: number })._seconds;
    const ns = (value as { _nanoseconds?: number })._nanoseconds ?? 0;
    const d = new Date(s * 1000 + Math.floor(ns / 1_000_000));
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const d = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function resolveFoodImageUrl(rawUrl?: string): { uri: string } | null {
  if (!rawUrl?.trim()) return null;
  const url = rawUrl.trim();
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    return { uri: url };
  }
  const apiOrigin = getApiOrigin().replace(/\/api\/v1\/?$/, '');
  if (url.startsWith('/images/')) {
    return { uri: `${apiOrigin}${url}` };
  }
  if (url.startsWith('menu/')) {
    return { uri: `${apiOrigin}/images/${url}` };
  }
  return { uri: `${apiOrigin}/images/menu/${url.replace(/^\/+/, '')}` };
}

// Presentation layer status mapping
export type OrderStatus = 'pending' | 'confirmed' | 'cooking' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending_confirmation' | 'paid';

// Presentation layer OrderItem (simplified for UI)
export interface OrderItem {
  id: string;
  /** order_item ID trên server — trạng thái gắn theo dòng này, không theo tên món */
  orderItemId?: string;
  name: string;
  price: number;
  priceDisplay: string;
  image: any;
  quantity: number;
  options?: string;
  note?: string;
}

// Presentation layer Order (for UI display)
export interface Order {
  /** order_item.id — key danh sách */
  id: string;
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  tableNumber: string | number;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (items: OrderItem[], total: number, tableNumber: string | number) => Promise<{ success: boolean; error?: any }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  payOrderItems: (
    itemIds: string[],
    paymentMethod?: 'qr' | 'cash' | 'card' | 'e_wallet'
  ) => Promise<boolean>;
  requestPaymentForServedOrders: (
    paymentMethod?: 'qr' | 'cash' | 'card' | 'e_wallet',
    lineIds?: string[]
  ) => Promise<boolean>;
  loadOrdersFromSession: () => Promise<void>;
  markPaymentConfirmed: () => void;
  hasPendingPaymentConfirmation: () => boolean;
  hasUnpaidServedOrders: () => boolean;
  isTableFullyPaid: () => boolean;
  getOrderHistory: () => Order[];
  getCurrentOrder: () => Order | null;
  cancelCustomerOrder: (orderId: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Helper: Map domain OrderStatus to presentation OrderStatus
const mapDomainStatusToPresentation = (domainStatus: DomainOrderStatus): OrderStatus => {
  switch (domainStatus) {
    case DomainOrderStatus.PENDING:
      return 'pending';
    case DomainOrderStatus.PREPARING:
      return 'cooking';
    case DomainOrderStatus.READY:
      return 'ready';
    case DomainOrderStatus.COMPLETED:
      return 'served';
    case DomainOrderStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'pending';
  }
};

// Helper: Map presentation OrderStatus to domain OrderStatus
const mapPresentationStatusToDomain = (presentationStatus: OrderStatus): DomainOrderStatus => {
  switch (presentationStatus) {
    case 'pending':
    case 'confirmed':
      return DomainOrderStatus.PENDING;
    case 'cooking':
      return DomainOrderStatus.PREPARING;
    case 'ready':
      return DomainOrderStatus.READY;
    case 'served':
      return DomainOrderStatus.COMPLETED;
    default:
      return DomainOrderStatus.PENDING;
  }
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  // ✅ KHÔNG tự động restore từ localStorage - Luôn bắt đầu với danh sách đơn trống
  const [orders, setOrders] = useState<Order[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pendingBillId, setPendingBillId] = useState<string | null>(null);
  
  const orderService = new OrderService();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { sessionId, sessionToken, tableNumber } = useTable();
  const sessionRepo = useMemo(() => new SessionRepository(), []);

  const statusMap: Record<string, OrderStatus> = {
    pending: 'pending',
    confirmed: 'confirmed',
    preparing: 'cooking',
    ready: 'ready',
    served: 'served',
    completed: 'served',
    cancelled: 'cancelled',
  };
  const paymentMap: Record<string, PaymentStatus> = {
    unpaid: 'unpaid',
    payment_pending_confirmation: 'pending_confirmation',
    paid: 'paid',
  };

  const mapRemoteOrderToLines = (remote: any): Order[] => {
    const lines = remote.items || [];
    return lines.map((line: any) => {
      const foodName = line?.food?.name || remote.notes?.split(':')[0] || 'Món';
      const unitPrice = Number(line?.unit_price || 0);
      const qty = Number(line?.quantity || 1);
      const subtotal = unitPrice * qty;
      const tax = subtotal * 0.08;
      const itemStatus = (line?.status as string) || 'pending';
      const imageFromApi = resolveFoodImageUrl(line?.food?.image_url);
      const orderPayment = paymentMap[remote.payment_status];
      const linePayment = paymentMap[line.payment_status];
      const paymentStatus: PaymentStatus =
        orderPayment === 'pending_confirmation' || orderPayment === 'paid'
          ? orderPayment
          : linePayment || 'unpaid';
      return {
        id: line.id,
        orderId: remote.id,
        orderNumber: remote.order_number || remote.id,
        items: [
          {
            id: line.food_id || line.food?.id,
            orderItemId: line.id,
            name: foodName,
            price: unitPrice,
            priceDisplay: `${unitPrice}`,
            image: imageFromApi,
            quantity: qty,
            note: line?.special_instructions,
          },
        ],
        total: subtotal + tax,
        status: statusMap[itemStatus] || 'pending',
        paymentStatus,
        createdAt: parseFirestoreDate(remote.created_at),
        updatedAt: parseFirestoreDate(remote.updated_at),
        tableNumber: remote.table_number || tableNumber || '',
      };
    });
  };

  const flattenRemoteOrders = (serverOrders: any[]): Order[] =>
    serverOrders.flatMap((o) => mapRemoteOrderToLines(o));

  const loadOrdersFromSession = async () => {
    if (!sessionId) return;
    try {
      const response = await axios.get(`${apiBaseUrl}/orders/public`, {
        params: { table_session_id: sessionId },
      });
      const serverOrders = response?.data?.data || [];
      const mapped = flattenRemoteOrders(serverOrders);
      setOrders(mapped);
    } catch (error) {
      console.error('Error loading session orders:', error);
    }
  };

  // ✅ Không cần lắng nghe storage event nữa vì không dùng localStorage
  // useEffect(() => {
  //   const handleStorageChange = (e: StorageEvent) => {
  //     if (e.key === 'orders' && e.newValue === null) {
  //       console.log('🧹 Orders cleared by table change');
  //       setOrders([]);
  //     }
  //   };
  //   
  //   window.addEventListener('storage', handleStorageChange);
  //   return () => window.removeEventListener('storage', handleStorageChange);
  // }, []);

  useEffect(() => {
    if (!sessionId) return;
    void loadOrdersFromSession();
    setIsInitialLoad(false);
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onRestored = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!Array.isArray(detail)) return;
      const mapped = flattenRemoteOrders(detail);
      setOrders(mapped);
    };
    const onPendingBill = (e: Event) => {
      const billId = (e as CustomEvent).detail as string | null;
      setPendingBillId(billId);
    };

    window.addEventListener('session:orders-restored', onRestored);
    window.addEventListener('session:pending-bill', onPendingBill);
    return () => {
      window.removeEventListener('session:orders-restored', onRestored);
      window.removeEventListener('session:pending-bill', onPendingBill);
    };
  }, [sessionId, tableNumber]);

  // ✅ KHÔNG lưu vào localStorage nữa - Chỉ lưu trong memory
  // Khi đổi bàn, TableContext sẽ clear tất cả và component sẽ unmount/remount
  // useEffect(() => {
  //   try {
  //     if (orders.length === 0) {
  //       localStorage.removeItem('orders');
  //       console.log('💾 Removed empty orders from localStorage');
  //     } else {
  //       localStorage.setItem('orders', JSON.stringify(orders));
  //       console.log('💾 Saved orders to localStorage:', orders.length, 'orders');
  //     }
  //   } catch (error) {
  //     console.error('Error saving orders to localStorage:', error);
  //   }
  // }, [orders]);

  const generateOrderNumber = () => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `GT-${random}`;
  };

  const createOrder = async (items: OrderItem[], total: number, tableNumber: string | number): Promise<{ success: boolean; error?: any }> => {
    console.log('📝 Creating order:', { 
      itemsCount: items.length, 
      total, 
      tableNumber,
      tableNumberType: typeof tableNumber 
    });

    if (items.length === 0) {
      console.log('⚠️ No items to order');
      return { success: true };
    }

    if (pendingBillId) {
      return {
        success: false,
        error: {
          message: 'Bàn đang chờ nhân viên xác nhận thanh toán. Vui lòng gọi nhân viên nếu muốn gọi thêm món.',
        },
      };
    }

    const createdAt = new Date();
    const localOrders = items.map((item, index) => {
      const subtotal = item.price * item.quantity;
      const tax = subtotal * 0.08;
      const tempItemId = `tmp_${Date.now()}_${index}`;
      return {
        id: tempItemId,
        orderId: `order_${Date.now()}_${index}`,
        orderNumber: generateOrderNumber(),
        items: [{ ...item, orderItemId: tempItemId }],
        total: subtotal + tax,
        status: 'pending' as OrderStatus,
        paymentStatus: 'unpaid' as PaymentStatus,
        createdAt,
        updatedAt: createdAt,
        tableNumber,
      };
    });

    setOrders((prev) => [...localOrders, ...prev]);

    try {
      const url = `${apiBaseUrl}/orders`;
      const orderSubtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const orderTax = orderSubtotal * 0.08;
      const payload = {
        table_session_id: sessionId || String(tableNumber),
        table_number: String(tableNumber),
        order_type: 'dine_in',
        subtotal: orderSubtotal,
        tax_amount: orderTax,
        discount_amount: 0,
        total_amount: orderSubtotal + orderTax,
        items: items.map((item) => ({
          food_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.note,
        })),
        notes: items
          .filter((i) => i.note?.trim())
          .map((i) => `${i.name}: ${i.note!.trim()}`)
          .join('; '),
      };

      await axios.post(url, payload);

      await loadOrdersFromSession();
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error syncing order to backend:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: `${apiBaseUrl}/orders`,
      });
      return { success: false, error };
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
  };

  const requestPaymentForServedOrders = async (
    paymentMethod: 'qr' | 'cash' | 'card' | 'e_wallet' = 'qr',
    _lineIds?: string[]
  ): Promise<boolean> => {
    if (!sessionId) return false;

    const hasUnpaid = orders.some(
      (line) => line.status !== 'cancelled' && line.paymentStatus === 'unpaid'
    );
    if (!hasUnpaid) return false;

    try {
      const bill = await sessionRepo.requestSessionPayment(sessionId, paymentMethod);
      setPendingBillId(bill.id);
      console.log('✅ Session payment bill created:', bill.id);
      return true;
    } catch (error: any) {
      console.error('❌ Session payment request failed:', error?.response?.data || error.message);
      return false;
    }
  };

  const payOrderItems = async (
    itemIds: string[],
    paymentMethod: 'qr' | 'cash' | 'card' | 'e_wallet' = 'qr'
  ): Promise<boolean> => {
    if (itemIds.length === 0) return false;
    const methodForApi = paymentMethod;
    try {
      await Promise.all(
        itemIds.map((itemId) =>
          axios.patch(`${apiBaseUrl}/orders/items/${itemId}/payment`, {
            payment_method: methodForApi,
          })
        )
      );
      setOrders((prev) => prev.filter((o) => !itemIds.includes(o.id)));
      return true;
    } catch (error: any) {
      console.error('payOrderItems', error?.response?.data || error?.message);
      return false;
    }
  };

  const cancelCustomerOrder = async (orderItemId: string): Promise<boolean> => {
    const line = orders.find((o) => o.id === orderItemId);
    if (!line || (line.status !== 'pending' && line.status !== 'confirmed')) {
      return false;
    }
    try {
      await axios.patch(`${apiBaseUrl}/orders/${line.orderId}/cancel`, {
        table_session_id: sessionId || String(line.tableNumber),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderItemId ? { ...o, status: 'cancelled' as OrderStatus, updatedAt: new Date() } : o
        )
      );
      return true;
    } catch (error: any) {
      console.error('cancelCustomerOrder', error?.response?.data || error?.message);
      return false;
    }
  };

  const markPaymentConfirmed = () => {
    setPendingBillId(null);
    void loadOrdersFromSession();
  };

  const hasPendingPaymentConfirmation = () => pendingBillId != null;

  const hasUnpaidServedOrders = () =>
    orders.some(
      (order) => order.status === 'served' && order.paymentStatus === 'unpaid'
    );

  const isTableFullyPaid = () => {
    const unpaid = orders.filter((o) => o.paymentStatus !== 'paid' && o.status !== 'cancelled');
    return orders.length > 0 && unpaid.length === 0;
  };

  // WebSocket — chỉ lắng nghe room của session hiện tại
  useEffect(() => {
    if (!sessionId) return;
    const tableSessionId = sessionId;

    // Initial sync
    const syncOrders = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/orders/public`, {
          params: { table_session_id: tableSessionId },
        });
        const serverOrders = response?.data?.data || [];

        const mapped = flattenRemoteOrders(serverOrders);
        setOrders(mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      } catch (error) {
        console.error('Error syncing order statuses:', error);
      }
    };

    void syncOrders();

    // Connect WebSocket
    socketService.connect(tableSessionId);
    socketService.joinTable(tableSessionId);

    // Listen for order updates
    const handleItemStatusUpdated = ({
      itemId,
      status,
    }: {
      itemId: string;
      status: string;
    }) => {
      const mapped = statusMap[status];
      if (!mapped) {
        void syncOrders();
        return;
      }
      let matched = false;
      setOrders((prev) =>
        prev.map((line) => {
          const isMatch =
            line.id === itemId || line.items[0]?.orderItemId === itemId;
          if (!isMatch) return line;
          matched = true;
          return {
            ...line,
            status: mapped,
            updatedAt: new Date(),
          };
        })
      );
      if (!matched) {
        void syncOrders();
      }
    };

    const handleItemPaymentUpdated = ({ itemId }: { itemId: string }) => {
      setOrders((prev) => {
        const next = prev.filter((line) => line.id !== itemId);
        if (next.length === 0 && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('payment:completed'));
        }
        return next;
      });
    };

    const handleOrderUpdated = () => {
      void syncOrders();
    };

    const handleBillCreated = () => {
      /* pendingBillId set khi khách vừa gửi request */
    };

    const handleBillConfirmed = () => {
      setPendingBillId(null);
      void syncOrders();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('payment:completed'));
      }
    };

    socketService.on('order:item_status_updated', handleItemStatusUpdated);
    socketService.on('order:item_payment_updated', handleItemPaymentUpdated);
    socketService.on('order:updated', handleOrderUpdated);
    socketService.on('order:created', handleOrderUpdated);
    socketService.on('order:status_changed', handleOrderUpdated);
    socketService.on('bill:created', handleBillCreated);
    socketService.on('bill:confirmed', handleBillConfirmed);

    const pollTimer = setInterval(() => {
      void syncOrders();
    }, 12_000);

    return () => {
      clearInterval(pollTimer);
      socketService.off('order:item_status_updated', handleItemStatusUpdated);
      socketService.off('order:item_payment_updated', handleItemPaymentUpdated);
      socketService.off('order:updated', handleOrderUpdated);
      socketService.off('order:created', handleOrderUpdated);
      socketService.off('order:status_changed', handleOrderUpdated);
      socketService.off('bill:created', handleBillCreated);
      socketService.off('bill:confirmed', handleBillConfirmed);
      socketService.leaveTable();
    };
  }, [sessionId, apiBaseUrl]);

  const getOrderHistory = () => {
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const getCurrentOrder = () => {
    const activeOrder = orders.find(
      (order) => order.status !== 'served' && order.status !== 'cancelled'
    );
    return activeOrder || null;
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder: getCurrentOrder(),
        createOrder,
        updateOrderStatus,
        payOrderItems,
        requestPaymentForServedOrders,
        markPaymentConfirmed,
        hasPendingPaymentConfirmation,
        hasUnpaidServedOrders,
        isTableFullyPaid,
        getOrderHistory,
        getCurrentOrder,
        cancelCustomerOrder,
        loadOrdersFromSession,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
