import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrder, OrderStatus } from '../context/OrderContext';

interface OrderHistoryScreenProps {
  onBack: () => void;
  onPayment?: () => void;
  onSupport?: () => void;
  tableNumber?: number;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: string; color: string }
> = {
  pending: { label: 'Đã gửi bếp', icon: 'receipt', color: '#AD2C00' },
  confirmed: { label: 'Xác nhận', icon: 'person-circle', color: '#AD2C00' },
  cooking: { label: 'Đang nấu', icon: 'flame', color: '#AD2C00' },
  ready: { label: 'Sẵn sàng', icon: 'restaurant', color: '#78716C' },
  served: { label: 'Phục vụ', icon: 'checkmark-done', color: '#78716C' },
  cancelled: { label: 'Đã hủy', icon: 'close-circle', color: '#B91C1C' },
};

export default function OrderHistoryScreen({
  onBack,
  onPayment,
  onSupport,
  tableNumber = 12,
}: OrderHistoryScreenProps) {
  const { orders, currentOrder, cancelCustomerOrder } = useOrder();
  const [showNotification, setShowNotification] = useState(true);
  const insets = useSafeAreaInsets();

  const getStatusProgress = (status: OrderStatus): number => {
    if (status === 'cancelled') return -1;
    const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'cooking', 'ready', 'served'];
    return statusOrder.indexOf(status);
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderProgressStepper = (status: OrderStatus) => {
    if (status === 'cancelled') {
      return (
        <View style={styles.cancelledNotice}>
          <Ionicons name="information-circle" size={22} color="#B91C1C" />
          <Text style={styles.cancelledNoticeText}>
            Đơn đã hủy. Chỉ có thể hủy khi nhà hàng chưa bắt đầu nấu (trạng thái gửi bếp hoặc xác nhận).
          </Text>
        </View>
      );
    }
    const currentStep = getStatusProgress(status);
    const steps: { status: OrderStatus; label: string; icon: string }[] = [
      { status: 'pending', label: 'Đã gửi', icon: 'receipt' },
      { status: 'confirmed', label: 'Xác nhận', icon: 'person-circle' },
      { status: 'cooking', label: 'Đang nấu', icon: 'flame' },
      { status: 'ready', label: 'Sẵn sàng', icon: 'restaurant' },
      { status: 'served', label: 'Phục vụ', icon: 'checkmark-done' },
    ];

    return (
      <View style={styles.stepperContainer}>
        {/* Progress line background */}
        <View style={styles.progressLineBackground} />
        {/* Active progress line */}
        <View
          style={[
            styles.progressLineActive,
            {
              width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%`,
            },
          ]}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <View key={step.status} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCurrent && styles.stepCircleCurrent,
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={20}
                  color={isActive ? '#FFFFFF' : '#A8A29E'}
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isCurrent && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderCard = (order: any, isLatest: boolean = false) => {
    const isCompleted = order.status === 'served';
    const isCancelled = order.status === 'cancelled';

    return (
      <View
        key={order.id}
        style={[
          styles.orderCard,
          isCompleted && styles.orderCardCompleted,
          isCancelled && styles.orderCardCancelled,
        ]}
      >
        <View style={styles.orderCardContent}>
          <Image
            source={order.items[0]?.image}
            style={[
              styles.orderImage,
              isCompleted && styles.orderImageCompleted,
            ]}
          />

          <View style={styles.orderInfo}>
            <View style={styles.orderHeader}>
              <Text
                style={[
                  styles.orderTime,
                  isLatest && styles.orderTimeLatest,
                ]}
              >
                {isLatest ? 'MỚI NHẤT' : 'ĐÃ XONG'} • {formatTime(order.createdAt)}
              </Text>
              {isLatest ? (
                <Ionicons name="time" size={18} color="#AD2C00" />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color="#006A35" />
              )}
            </View>

            <Text
              style={[
                styles.orderName,
                isCompleted && styles.orderNameCompleted,
              ]}
              numberOfLines={1}
            >
              {order.items[0]?.name}
              {order.items.length > 1 && ` +${order.items.length - 1} món`}
            </Text>

            {order.items[0]?.options && (
              <Text style={styles.orderOptions} numberOfLines={1}>
                {order.items[0].options}
              </Text>
            )}

            <View style={styles.orderFooter}>
              {isLatest ? (
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    {STATUS_CONFIG[order.status as OrderStatus]?.label ?? '—'}...
                  </Text>
                </View>
              ) : isCancelled ? (
                <Text style={styles.cancelledListText}>Đã hủy</Text>
              ) : (
                <Text style={styles.completedText}>Đã phục vụ</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 48) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#AD2C00" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Ionicons name="restaurant" size={20} color="#AD2C00" />
            <Text style={styles.headerTitle}>Bàn {tableNumber}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#5F5E5E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Notification Banner */}
        {showNotification && currentOrder && currentOrder.status === 'cooking' && (
          <View style={styles.notificationBanner}>
            <View style={styles.notificationIcon}>
              <Ionicons name="flame" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationText}>
                Bếp đang làm món {currentOrder.items[0]?.name} của bạn!
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowNotification(false)}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}

        {/* Current Order Status */}
        {currentOrder && (
          <View style={styles.currentOrderSection}>
            <Text style={styles.currentOrderLabel}>Đơn hàng hiện tại</Text>
            <View style={styles.currentOrderTitleRow}>
              <Text style={styles.currentOrderNumber} numberOfLines={1}>
                #{currentOrder.orderNumber}
              </Text>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText} numberOfLines={1}>
                  {STATUS_CONFIG[currentOrder.status]?.label ?? '—'}
                </Text>
              </View>
            </View>

            {renderProgressStepper(currentOrder.status)}

            {(currentOrder.status === 'pending' || currentOrder.status === 'confirmed') && (
              <TouchableOpacity
                style={styles.cancelOrderButton}
                onPress={() =>
                  Alert.alert(
                    'Hủy đơn hàng?',
                    'Chỉ hủy được trước khi bếp bắt đầu nấu. Sau khi hủy, nhà hàng sẽ không chuẩn bị món này.',
                    [
                      { text: 'Không', style: 'cancel' },
                      {
                        text: 'Hủy đơn',
                        style: 'destructive',
                        onPress: async () => {
                          const ok = await cancelCustomerOrder(currentOrder.id);
                          Alert.alert(
                            ok ? 'Đã hủy đơn' : 'Không thể hủy',
                            ok
                              ? 'Đơn của bạn đã được hủy.'
                              : 'Đơn có thể đã vào bếp hoặc có lỗi kết nối. Vui lòng gọi nhân viên.'
                          );
                        },
                      },
                    ]
                  )
                }
              >
                <Ionicons name="close-circle-outline" size={20} color="#B91C1C" />
                <Text style={styles.cancelOrderButtonText}>Hủy đơn (trước khi nấu)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Order History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Lịch sử đơn hàng tại bàn</Text>

          <View style={styles.orderList}>
            {orders.length > 0 ? (
              orders.map((order, index) =>
                renderOrderCard(order, index === 0 && order.status !== 'served')
              )
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#D4D4D4" />
                <Text style={styles.emptyStateText}>Chưa có đơn hàng nào</Text>
                <Text style={styles.emptyStateSubtext}>
                  Các đơn hàng bạn gọi sẽ hiển thị ở đây
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={styles.helpContent}>
            <Ionicons name="headset" size={24} color="#5F5E5E" />
            <View style={styles.helpText}>
              <Text style={styles.helpTitle}>Cần hỗ trợ?</Text>
              <Text style={styles.helpSubtitle}>Yêu cầu nhân viên đến bàn</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.helpButton} onPress={onSupport}>
            <Text style={styles.helpButtonText}>Gọi ngay</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Button */}
        {orders.some((order) => order.status === 'served') && onPayment && (
          <TouchableOpacity
            style={styles.paymentCard}
            onPress={onPayment}
            activeOpacity={0.9}
          >
            <View style={styles.paymentCardContent}>
              <View style={styles.paymentCardLeft}>
                <Ionicons name="receipt-outline" size={32} color="#AD2C00" />
                <View>
                  <Text style={styles.paymentCardTitle}>Xem tổng hóa đơn</Text>
                  <Text style={styles.paymentCardSubtitle}>
                    Chi tiết tất cả đơn đã gọi
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#AD2C00" />
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#AD2C00',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#D83900',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#AD2C00',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  currentOrderSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentOrderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'nowrap',
  },
  currentOrderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5F5E5E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  currentOrderNumber: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1B1B',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  statusChip: {
    flexShrink: 0,
    maxWidth: '46%',
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AD2C00',
  },
  stepperContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressLineBackground: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#E5E2E1',
  },
  progressLineActive: {
    position: 'absolute',
    top: 20,
    left: 0,
    height: 2,
    backgroundColor: '#AD2C00',
  },
  stepItem: {
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E2E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepCircleActive: {
    backgroundColor: '#AD2C00',
  },
  stepCircleCurrent: {
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8A29E',
    textTransform: 'uppercase',
    textAlign: 'center',
    maxWidth: 60,
  },
  stepLabelActive: {
    color: '#1C1B1B',
  },
  stepLabelCurrent: {
    color: '#AD2C00',
  },
  historySection: {
    marginBottom: 32,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 16,
  },
  orderList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardCompleted: {
    backgroundColor: '#F6F3F2',
    opacity: 0.8,
  },
  orderCardCancelled: {
    opacity: 0.75,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  orderCardContent: {
    flexDirection: 'row',
    height: 128,
  },
  orderImage: {
    width: 128,
    height: 128,
  },
  orderImageCompleted: {
    opacity: 0.5,
  },
  orderInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5F5E5E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderTimeLatest: {
    color: '#AD2C00',
  },
  orderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
    marginTop: 4,
  },
  orderNameCompleted: {
    opacity: 0.6,
  },
  orderOptions: {
    fontSize: 12,
    color: '#5F5E5E',
    marginTop: 4,
  },
  orderFooter: {
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#AD2C00',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AD2C00',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006A35',
  },
  cancelledListText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  cancelledNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  cancelOrderButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cancelOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#78716C',
    marginTop: 8,
    textAlign: 'center',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E2DFDE',
    borderRadius: 12,
    padding: 16,
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpText: {
    gap: 2,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  helpSubtitle: {
    fontSize: 12,
    color: '#5F5E5E',
  },
  helpButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#AD2C00',
  },
  paymentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  paymentCardSubtitle: {
    fontSize: 14,
    color: '#5F5E5E',
    marginTop: 2,
  },
});
