import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Order, OrderStatus } from '../../domain/models/Order';
import { OrderService } from '../../business/services/OrderService';

const orderService = new OrderService();

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const activeOrders = await orderService.getActiveOrders();
      setOrders(activeOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await orderService.updateOrderStatus(orderId, status);
    loadOrders();
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return OrderStatus.PREPARING;
      case OrderStatus.PREPARING:
        return OrderStatus.READY;
      case OrderStatus.READY:
        return OrderStatus.COMPLETED;
      default:
        return null;
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.PENDING:
        return '#FFA726';
      case OrderStatus.PREPARING:
        return '#42A5F5';
      case OrderStatus.READY:
        return '#66BB6A';
      case OrderStatus.COMPLETED:
        return '#9E9E9E';
      case OrderStatus.CANCELLED:
        return '#EF5350';
      default:
        return '#9E9E9E';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const nextStatus = getNextStatus(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderTable}>Bàn {item.tableNumber}</Text>
          <Text style={styles.orderId}>#{item.id}</Text>
        </View>
        
        <View style={styles.orderBody}>
          <Text style={styles.orderAmount}>
            {item.totalAmount.toLocaleString('vi-VN')}đ
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          {nextStatus && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => updateStatus(item.id, nextStatus)}
            >
              <Text style={styles.actionButtonText}>
                Chuyển sang: {nextStatus}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => updateStatus(item.id, OrderStatus.CANCELLED)}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderTable: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderId: {
    fontSize: 14,
    color: '#666',
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderActions: {
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  cancelButtonText: {
    color: '#EF5350',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
