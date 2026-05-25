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
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (items: OrderItem[], total: number, tableNumber: string | number) => Promise<{ success: boolean; error?: any }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  requestPaymentForServedOrders: (paymentMethod?: 'qr' | 'cash' | 'card' | 'e_wallet') => boolean;
  markPaymentConfirmed: () => void;
  hasPendingPaymentConfirmation: () => boolean;
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
  
  const orderService = new OrderService();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { sessionId } = useTable();

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

  const createOrder = async (items: OrderItem[], total: number, tableNumber: string | number): Promise<{ success: boolean; error?: any }> => {
    console.log('📝 Creating order:', { 
      itemsCount: items.length, 
      total, 
      tableNumber,
      tableNumberType: typeof tableNumber 
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
    const newOrderSubtotal = itemsToOrder.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newOrderTax = newOrderSubtotal * 0.08;
    const newOrderTotal = newOrderSubtotal + newOrderTax;

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
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Đồng bộ đơn lên backend để admin/staff thấy ngay
    const perItemNotes = itemsToOrder
      .filter((item) => item.note?.trim())
      .map((item) => `${item.name}: ${item.note!.trim()}`);

    const payload = {
      table_session_id: sessionId || String(tableNumber),
      table_number: String(tableNumber),
      order_type: 'dine_in',
      subtotal: newOrderSubtotal,
      tax_amount: newOrderTax,
      discount_amount: 0,
      total_amount: newOrderTotal,
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

  const requestPaymentForServedOrders = (
    paymentMethod: 'qr' | 'cash' | 'card' | 'e_wallet' = 'qr'
  ): boolean => {
    const eligibleOrderIds = orders
      .filter((order) => order.status === 'served' && order.paymentStatus === 'unpaid')
      .map((order) => order.id);

    let hasEligibleOrder = false;
    
    // Cập nhật state local NGAY LẬP TỨC
    setOrders((prev) =>
      prev.map((order) => {
        if (order.status === 'served' && order.paymentStatus === 'unpaid') {
          hasEligibleOrder = true;
          return {
            ...order,
            paymentStatus: 'pending_confirmation',
            updatedAt: new Date(),
          };
        }
        return order;
      })
    );

    // Gửi yêu cầu thanh toán lên backend (best effort)
    eligibleOrderIds.forEach((orderId) => {
      axios.patch(`${apiBaseUrl}/orders/${orderId}/request-payment`, {
        payment_method: paymentMethod,
      })
      .then(() => {
        console.log(`✅ Payment request sent for order ${orderId}`);
      })
      .catch((error) => {
        console.error(`❌ Error requesting payment for order ${orderId}:`, error?.response?.data || error.message);
        // Rollback nếu lỗi
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, paymentStatus: 'unpaid', updatedAt: new Date() }
              : order
          )
        );
      });
    });

    return hasEligibleOrder;
  };

  const cancelCustomerOrder = async (orderId: string): Promise<boolean> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || (order.status !== 'pending' && order.status !== 'confirmed')) {
      return false;
    }
    try {
      await axios.patch(`${apiBaseUrl}/orders/${orderId}/cancel`, {
        table_session_id: sessionId || String(order.tableNumber),
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

  // WebSocket real-time updates
  useEffect(() => {
    if (orders.length === 0) return;
    const tableSessionId = sessionId || String(orders[0].tableNumber);

    // Initial sync
    const syncOrders = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/orders/public`, {
          params: { table_session_id: tableSessionId },
        });
        const serverOrders = response?.data?.data || [];

        setOrders((prev) =>
          prev.map((local) => {
            const remote = serverOrders.find((item: any) => item.id === local.id);
            if (!remote) return local;

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
            };
          })
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
  }, [orders.length, orders[0]?.tableNumber, apiBaseUrl, sessionId]);

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
