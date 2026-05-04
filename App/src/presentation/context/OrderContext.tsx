import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Order as DomainOrder, OrderStatus as DomainOrderStatus } from '../../domain/models/Order';
import { OrderService } from '../../business/services/OrderService';

// Presentation layer status mapping
export type OrderStatus = 'paid' | 'confirmed' | 'cooking' | 'ready' | 'served';

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
  createdAt: Date;
  updatedAt: Date;
  tableNumber: number;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (items: OrderItem[], total: number, tableNumber: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrderHistory: () => Order[];
  getCurrentOrder: () => Order | null;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Helper: Map domain OrderStatus to presentation OrderStatus
const mapDomainStatusToPresentation = (domainStatus: DomainOrderStatus): OrderStatus => {
  switch (domainStatus) {
    case DomainOrderStatus.PENDING:
      return 'paid';
    case DomainOrderStatus.PREPARING:
      return 'cooking';
    case DomainOrderStatus.READY:
      return 'ready';
    case DomainOrderStatus.COMPLETED:
      return 'served';
    case DomainOrderStatus.CANCELLED:
      return 'served'; // Treat cancelled as served for UI
    default:
      return 'paid';
  }
};

// Helper: Map presentation OrderStatus to domain OrderStatus
const mapPresentationStatusToDomain = (presentationStatus: OrderStatus): DomainOrderStatus => {
  switch (presentationStatus) {
    case 'paid':
      return DomainOrderStatus.PENDING;
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
      status: 'paid',
      createdAt: new Date(),
      updatedAt: new Date(),
      tableNumber,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Simulate order progression
    setTimeout(() => updateOrderStatus(newOrder.id, 'confirmed'), 2000);
    setTimeout(() => updateOrderStatus(newOrder.id, 'cooking'), 5000);
    setTimeout(() => updateOrderStatus(newOrder.id, 'ready'), 15000);
    setTimeout(() => updateOrderStatus(newOrder.id, 'served'), 20000);
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

  const getOrderHistory = () => {
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const getCurrentOrder = () => {
    // Lấy đơn hàng mới nhất chưa hoàn thành
    const activeOrder = orders.find(
      (order) => order.status !== 'served'
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
        getOrderHistory,
        getCurrentOrder,
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
