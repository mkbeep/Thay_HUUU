import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { Alert } from 'react-native';
import { Order as DomainOrder, OrderStatus as DomainOrderStatus } from '../../domain/models/Order';
import { OrderService } from '../../business/services/OrderService';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import { fixCloudinaryMenuFoodImageUrl } from '../../utils/cloudinaryMenuImageFixes';
import { socketService } from '../../services/socketService';

// Presentation layer status mapping
export type OrderStatus = 'pending' | 'confirmed' | 'cooking' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending_confirmation' | 'paid';

// Presentation layer OrderItem (simplified for UI)
export interface OrderItem {
  id: string;
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
  id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  tableNumber: string | number;
  /** Giá trị gửi API/WebSocket (session Firestore hoặc legacy: số bàn) */
  tableSessionId?: string;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (
    items: OrderItem[],
    total: number,
    tableNumber: string | number,
    tableSessionId?: string | null
  ) => Promise<{ success: boolean; error?: any }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  requestPaymentForServedOrders: () => Promise<boolean>;
  hydrateOrdersFromServer: (
    tableSessionKey: string,
    displayTableNumber?: string | number | null
  ) => Promise<void>;
  clearLocalOrders: () => void;
  markPaymentConfirmed: () => void;
  hasPendingPaymentConfirmation: () => boolean;
  isTableFullyPaid: () => boolean;
  getOrderHistory: () => Order[];
  getCurrentOrder: () => Order | null;
  cancelCustomerOrder: (orderId: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const FALLBACK_MENU_IMAGE = require('../../../assets/images/menu/appetizers/nem-ran.jpg');

function mapPublicApiOrderToOrder(row: any, displayTableNumber: string | number): Order {
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

  const items: OrderItem[] = (row.items || []).map((it: any) => {
    const food = it.food || {};
    const imgUrlRaw =
      typeof food.image_url === 'string'
        ? food.image_url
        : typeof food.photo_url === 'string'
          ? food.photo_url
          : '';
    const imgUrl = imgUrlRaw ? fixCloudinaryMenuFoodImageUrl(imgUrlRaw.trim()) : '';
    const price = Number(it.unit_price) || 0;
    return {
      id: String(it.food_id || food.id || it.id),
      name: String(food.name || 'Món'),
      price,
      priceDisplay: `${Math.round(price / 1000)}k`,
      image: imgUrl ? { uri: imgUrl } : FALLBACK_MENU_IMAGE,
      quantity: Number(it.quantity) || 0,
      note: it.special_instructions ? String(it.special_instructions) : undefined,
    };
  });

  const sid = row.table_session_id != null ? String(row.table_session_id) : String(displayTableNumber);

  return {
    id: String(row.id),
    orderNumber: String(row.order_number || row.id),
    items,
    total: Number(row.total_amount) || 0,
    status: statusMap[row.status] || 'pending',
    paymentStatus: paymentMap[row.payment_status] || 'unpaid',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    tableNumber: displayTableNumber,
    tableSessionId: sid,
  };
}

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
  const paymentRequestInFlight = useRef(false);
  
  const orderService = new OrderService();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

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

  // ✅ Load orders từ backend khi component mount (thay vì từ localStorage)
  useEffect(() => {
    const loadOrdersFromBackend = async () => {
      // Chỉ load nếu có tableNumber
      if (!orders.length && isInitialLoad) {
        setIsInitialLoad(false);
        // Orders sẽ được load từ WebSocket sync bên dưới
      }
    };
    
    void loadOrdersFromBackend();
  }, [orders.length, isInitialLoad]);

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

  const createOrder = async (
    items: OrderItem[],
    total: number,
    tableNumber: string | number,
    tableSessionId?: string | null
  ): Promise<{ success: boolean; error?: any }> => {
    const sessionKey =
      tableSessionId != null && String(tableSessionId).trim() !== ''
        ? String(tableSessionId).trim()
        : String(tableNumber);

    console.log('📝 Creating order:', { 
      itemsCount: items.length, 
      total, 
      tableNumber,
      tableNumberType: typeof tableNumber,
      sessionKey,
    });

    // ✅ CHỈ XÉT CÁC ĐƠN CHƯA THANH TOÁN (bỏ qua đơn đã paid)
    const existingOrders = orders.filter(
      (order) => order.tableNumber === tableNumber && order.paymentStatus !== 'paid'
    );
    
    console.log('📊 Existing unpaid orders:', existingOrders.length);

    // Lấy tất cả món đã đặt trước đó (từ các đơn cũ)
    const previouslyOrderedItemIds = new Set(
      existingOrders.flatMap((order) => order.items.map((item) => item.id))
    );

    // Tách món mới (chưa từng đặt) và món đã đặt (đặt thêm)
    const newItems = items.filter((item) => !previouslyOrderedItemIds.has(item.id));
    const reorderedItems = items.filter((item) => previouslyOrderedItemIds.has(item.id));

    console.log('🔍 Order analysis:', {
      totalItems: items.length,
      newItems: newItems.length,
      reorderedItems: reorderedItems.length,
      existingOrders: existingOrders.length,
    });

    // ✅ CHỈ TẠO ĐỐN MỚI CHO MÓN MỚI (hoặc tất cả nếu là đơn đầu tiên)
    const itemsToOrder = existingOrders.length > 0 ? newItems : items;
    
    if (itemsToOrder.length === 0) {
      console.log('⚠️ No new items to order');
      return { success: true }; // Không có món mới để đặt
    }

    // Tính tổng tiền CHỈ cho món mới
    const newOrderTotal = itemsToOrder.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const newOrder: Order = {
      id: `order_${Date.now()}`,
      orderNumber: generateOrderNumber(),
      items: itemsToOrder,
      total: newOrderTotal, // ✅ CHỈ TÍNH TIỀN MÓN MỚI
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date(),
      updatedAt: new Date(),
      tableNumber,
      tableSessionId: sessionKey,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Đồng bộ đơn lên backend để admin/staff thấy ngay
    const perItemNotes = itemsToOrder
      .filter((item) => item.note?.trim())
      .map((item) => `${item.name}: ${item.note!.trim()}`);

    const payload = {
      table_session_id: sessionKey,
      order_type: 'dine_in',
      items: itemsToOrder.map((item) => ({
        food_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.note,
      })),
      notes: perItemNotes.length > 0 ? perItemNotes.join('\n') : '',
    };

    try {
      const url = `${apiBaseUrl}/orders`;
      console.log('🔄 Sending order to backend:', { url, payload });
      
      const response = await axios.post(url, payload);

      const serverOrder = response?.data?.data;
      console.log('✅ Order created successfully:', serverOrder);

      if (serverOrder?.id) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === newOrder.id
              ? {
                  ...order,
                  id: serverOrder.id,
                  orderNumber: serverOrder.order_number || order.orderNumber,
                  tableSessionId:
                    serverOrder.table_session_id != null
                      ? String(serverOrder.table_session_id)
                      : order.tableSessionId,
                }
              : order
          )
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error syncing order to backend:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: `${apiBaseUrl}/orders`,
        payload
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

  const requestPaymentForServedOrders = async (): Promise<boolean> => {
    if (paymentRequestInFlight.current) {
      return false;
    }
    paymentRequestInFlight.current = true;

    let eligibleIds: string[] = [];
    setOrders((prev) => {
      eligibleIds = prev
        .filter((o) => o.status === 'served' && o.paymentStatus === 'unpaid')
        .map((o) => o.id);
      if (eligibleIds.length === 0) return prev;
      return prev.map((order) =>
        eligibleIds.includes(order.id)
          ? { ...order, paymentStatus: 'pending_confirmation' as PaymentStatus, updatedAt: new Date() }
          : order
      );
    });

    if (eligibleIds.length === 0) {
      paymentRequestInFlight.current = false;
      return false;
    }

    try {
      await Promise.all(
        eligibleIds.map((orderId) =>
          axios.patch(`${apiBaseUrl}/orders/${orderId}/request-payment`, {
            payment_method: 'qr',
          })
        )
      );
      eligibleIds.forEach((id) => console.log(`✅ Payment request sent for order ${id}`));
      return true;
    } catch (error: any) {
      console.error('❌ Error requesting payment:', error?.response?.data || error?.message);
      setOrders((prev) =>
        prev.map((order) =>
          eligibleIds.includes(order.id)
            ? { ...order, paymentStatus: 'unpaid', updatedAt: new Date() }
            : order
        )
      );
      return false;
    } finally {
      paymentRequestInFlight.current = false;
    }
  };

  const cancelCustomerOrder = async (orderId: string): Promise<boolean> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || (order.status !== 'pending' && order.status !== 'confirmed')) {
      return false;
    }
    try {
      await axios.patch(`${apiBaseUrl}/orders/${orderId}/cancel`, {
        table_session_id: order.tableSessionId ?? String(order.tableNumber),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus, updatedAt: new Date() } : o
        )
      );
      return true;
    } catch (error: any) {
      console.error('cancelCustomerOrder', error?.response?.data || error?.message);
      return false;
    }
  };

  const markPaymentConfirmed = () => {
    setOrders((prev) =>
      prev.map((order) =>
        order.paymentStatus === 'pending_confirmation'
          ? { ...order, paymentStatus: 'paid', updatedAt: new Date() }
          : order
      )
    );
  };

  const hasPendingPaymentConfirmation = () =>
    orders.some((order) => order.paymentStatus === 'pending_confirmation');

  const isTableFullyPaid = () => {
    const servedOrders = orders.filter((order) => order.status === 'served');
    if (servedOrders.length === 0) return false;
    return servedOrders.every((order) => order.paymentStatus === 'paid');
  };

  const clearLocalOrders = useCallback(() => {
    setOrders([]);
  }, []);

  const hydrateOrdersFromServer = useCallback(
    async (tableSessionKey: string, displayTableNumber?: string | number | null) => {
      const primary = String(tableSessionKey).trim();
      if (!primary && (displayTableNumber === undefined || displayTableNumber === null || displayTableNumber === '')) {
        return;
      }
      const tryKeys: string[] = [];
      if (primary) tryKeys.push(primary);
      const num =
        displayTableNumber !== undefined && displayTableNumber !== null && String(displayTableNumber).trim() !== ''
          ? String(displayTableNumber).trim()
          : '';
      if (num && !tryKeys.includes(num)) tryKeys.push(num);
      if (tryKeys.length === 0) return;

      const display =
        displayTableNumber !== undefined && displayTableNumber !== null && displayTableNumber !== ''
          ? displayTableNumber
          : primary || num;

      for (const key of tryKeys) {
        try {
          const response = await axios.get(`${apiBaseUrl}/orders/public`, {
            params: { table_session_id: key },
          });
          const rows = response?.data?.data || [];
          const mapped = rows
            .filter((row: any) => row.payment_status !== 'paid')
            .map((row: any) => mapPublicApiOrderToOrder(row, display));
          if (mapped.length > 0) {
            setOrders(mapped);
            return;
          }
        } catch (error) {
          console.error('hydrateOrdersFromServer', key, error);
        }
      }
      setOrders([]);
    },
    [apiBaseUrl]
  );

  // WebSocket real-time updates
  useEffect(() => {
    if (orders.length === 0) return;
    const tableSessionId =
      orders[0].tableSessionId?.trim() || String(orders[0].tableNumber);

    // Initial sync
    const syncOrders = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/orders/public`, {
          params: { table_session_id: tableSessionId },
        });
        const serverOrders = response?.data?.data || [];

        setOrders((prev) =>
          prev
            .map((local) => {
              const remote = serverOrders.find((item: any) => item.id === local.id);
              if (!remote) {
                if (String(local.id).startsWith('order_')) return local;
                return null;
              }

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

              return {
                ...local,
                status: statusMap[remote.status] || local.status,
                paymentStatus: paymentMap[remote.payment_status] || local.paymentStatus,
                updatedAt: remote.updated_at ? new Date(remote.updated_at) : local.updatedAt,
                tableSessionId:
                  remote.table_session_id != null
                    ? String(remote.table_session_id)
                    : local.tableSessionId,
              };
            })
            .filter((o): o is Order => o !== null)
        );
      } catch (error) {
        console.error('Error syncing order statuses:', error);
      }
    };

    void syncOrders();

    // Connect WebSocket
    socketService.connect(tableSessionId);
    socketService.joinTable(tableSessionId);

    // Listen for order updates
    const handleOrderUpdated = (updatedOrder: any) => {
      console.log('🔄 Order updated via WebSocket:', updatedOrder);

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

      setOrders((prev) => {
        const existingOrder = prev.find((o) => o.id === updatedOrder.id);
        if (!existingOrder) return prev;

        const newStatus = statusMap[updatedOrder.status] || existingOrder.status;
        const newPaymentStatus = paymentMap[updatedOrder.payment_status] || existingOrder.paymentStatus;

        // Kiểm tra nếu thanh toán được xác nhận
        if (
          existingOrder.paymentStatus === 'pending_confirmation' &&
          newPaymentStatus === 'paid'
        ) {
          console.log('💳 Payment confirmed! Order:', existingOrder.id);
          
          // Hiện thông báo thanh toán thành công
          Alert.alert(
            '✅ Thanh toán thành công',
            'Cảm ơn bạn đã sử dụng dịch vụ!\n\nChúc bạn ngon miệng! 🍽️',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('🧹 User acknowledged payment success');
                },
              },
            ],
            { cancelable: false }
          );
          
          // ✅ Dispatch event để App.tsx tự động quay về màn hình chính
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('payment:completed'));
            console.log('📢 Dispatched payment:completed event');
          }
        }

        // Cập nhật order với status mới
        const updatedOrders = prev.map((order) =>
          order.id === updatedOrder.id
            ? {
                ...order,
                status: newStatus,
                paymentStatus: newPaymentStatus,
                updatedAt: new Date(),
              }
            : order
        );

        // ✅ TỰ ĐỘNG XÓA CÁC ĐƠN ĐÃ THANH TOÁN ĐỂ TRÁNH TÍNH SAI
        const filteredOrders = updatedOrders.filter(
          (order) => order.paymentStatus !== 'paid'
        );

        if (filteredOrders.length < updatedOrders.length) {
          console.log(
            `🧹 Auto-removed ${updatedOrders.length - filteredOrders.length} paid order(s) from state`
          );
        }

        return filteredOrders;
      });
    };

    const handleOrderStatusChanged = ({ order }: { orderId: string; status: string; order: any }) => {
      console.log('✅ Order status changed via WebSocket:', order);
      handleOrderUpdated(order);
    };

    socketService.on('order:updated', handleOrderUpdated);
    socketService.on('order:status_changed', handleOrderStatusChanged);

    // Fallback polling every 30 seconds (reduced from 5 seconds)
    const timer = setInterval(() => void syncOrders(), 30000);

    return () => {
      clearInterval(timer);
      socketService.off('order:updated', handleOrderUpdated);
      socketService.off('order:status_changed', handleOrderStatusChanged);
      socketService.leaveTable();
    };
  }, [orders.length, orders[0]?.tableNumber, orders[0]?.tableSessionId, apiBaseUrl]);

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
        requestPaymentForServedOrders,
        hydrateOrdersFromServer,
        clearLocalOrders,
        markPaymentConfirmed,
        hasPendingPaymentConfirmation,
        isTableFullyPaid,
        getOrderHistory,
        getCurrentOrder,
        cancelCustomerOrder,
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
