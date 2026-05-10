import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order as DomainOrder, OrderStatus as DomainOrderStatus } from '../../domain/models/Order';
import { OrderService } from '../../business/services/OrderService';
import axios from 'axios';
import { API_URL } from '@env';

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
  tableNumber: number;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (items: OrderItem[], total: number, tableNumber: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  requestPaymentForServedOrders: () => boolean;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const orderService = new OrderService();
  const apiBaseUrl = API_URL || 'http://192.168.1.3:3000/api/v1';

  const generateOrderNumber = () => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `GT-${random}`;
  };

  const createOrder = (items: OrderItem[], total: number, tableNumber: number) => {
    const newOrder: Order = {
      id: `order_${Date.now()}`,
      orderNumber: generateOrderNumber(),
      items,
      total,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date(),
      updatedAt: new Date(),
      tableNumber,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Đồng bộ đơn lên backend để admin/staff thấy ngay
    const perItemNotes = items
      .filter((item) => item.note?.trim())
      .map((item) => `${item.name}: ${item.note!.trim()}`);

    void axios.post(`${apiBaseUrl}/orders`, {
      table_session_id: String(tableNumber),
      order_type: 'dine_in',
      items: items.map((item) => ({
        food_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.note,
      })),
      notes: perItemNotes.length > 0 ? perItemNotes.join('\n') : '',
    }).then((response) => {
      const serverOrder = response?.data?.data;
      if (!serverOrder?.id) return;

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
    }).catch((error) => {
      console.error('Error syncing order to backend:', error?.response?.data || error.message);
    });
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

  const requestPaymentForServedOrders = (): boolean => {
    const eligibleOrderIds = orders
      .filter((order) => order.status === 'served' && order.paymentStatus === 'unpaid')
      .map((order) => order.id);

    let hasEligibleOrder = false;
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
      void axios.patch(`${apiBaseUrl}/orders/${orderId}/request-payment`, {
        payment_method: 'qr',
      }).catch((error) => {
        console.error(`Error requesting payment for order ${orderId}:`, error?.response?.data || error.message);
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
        table_session_id: String(order.tableNumber),
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

  useEffect(() => {
    if (orders.length === 0) return;
    const tableSessionId = String(orders[0].tableNumber);

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
    const timer = setInterval(() => void syncOrders(), 5000);
    return () => clearInterval(timer);
  }, [orders.length, orders[0]?.tableNumber]);

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
