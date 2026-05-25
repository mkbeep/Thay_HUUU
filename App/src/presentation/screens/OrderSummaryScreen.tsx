import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrder } from '../context/OrderContext';

interface OrderSummaryScreenProps {
  onBack: () => void;
  onPayment: () => void;
  tableNumber?: number | string;
}

export default function OrderSummaryScreen({
  onBack,
  onPayment,
  tableNumber = 12,
}: OrderSummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const { orders, hasPendingPaymentConfirmation, isTableFullyPaid } = useOrder();

  // Lấy tất cả đơn đã phục vụ
  const servedOrders = orders.filter((order) => order.status === 'served');

  // Tính tổng từ order.total (đã bao gồm thuế khi tạo order)
  const total = servedOrders.reduce((sum, order) => sum + order.total, 0);
  
  // Tính ngược lại subtotal và tax từ total
  // total = subtotal + tax
  // total = subtotal + (subtotal * 0.08)
  // total = subtotal * 1.08
  // subtotal = total / 1.08
  const subtotal = total / 1.08;
  const tax = total - subtotal;

  const formatCurrency = (amount: number): string => {
    return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
          <View>
            <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
            <Text style={styles.headerSubtitle}>BÀN {tableNumber}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="receipt-outline" size={24} color="#AD2C00" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 200 },
        ]}
      >
        {/* Session Summary */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#D83900', '#AD2C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            {/* Decorative circle */}
            <View style={styles.decorativeCircle} />

            <View style={styles.summaryContent}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryAmountBlock}>
                  <Text style={styles.summaryLabel}>Tổng cộng phiên này</Text>
                  <Text
                    style={styles.summaryTotal}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {formatCurrency(total)}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {isTableFullyPaid()
                      ? 'Đã thanh toán'
                      : hasPendingPaymentConfirmation()
                      ? 'Chờ xác nhận'
                      : 'Chưa thanh toán'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDetails}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Tạm tính:</Text>
                  <Text style={styles.summaryRowValue}>
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Thuế VAT (8%):</Text>
                  <Text style={styles.summaryRowValue}>{formatCurrency(tax)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
          <Text style={styles.sectionCount}>
            {servedOrders.length} Đơn hàng
          </Text>
        </View>

        {/* Orders List */}
        <View style={styles.ordersList}>
          {servedOrders.length > 0 ? (
            servedOrders.map((order, index) => (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  index > 0 && styles.orderCardOld,
                ]}
              >
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <View
                      style={[
                        styles.orderIcon,
                        index > 0 && styles.orderIconOld,
                      ]}
                    >
                      <Ionicons
                        name="restaurant"
                        size={20}
                        color={index === 0 ? '#AD2C00' : '#A8A29E'}
                      />
                    </View>
                    <View>
                      <Text style={styles.orderNumber}>
                        Đơn hàng #{servedOrders.length - index}
                      </Text>
                      <Text style={styles.orderTime}>
                        Đặt lúc {formatTime(order.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderStatusBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#006A35"
                    />
                    <Text style={styles.orderStatusText}>Đã phục vụ</Text>
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.orderItems}>
                  {order.items.map((item, itemIndex) => (
                    <View key={`${item.id}_${itemIndex}`} style={styles.orderItem}>
                      <Image
                        source={item.image}
                        style={[
                          styles.orderItemImage,
                          index > 0 && styles.orderItemImageOld,
                        ]}
                      />
                      <View style={styles.orderItemInfo}>
                        <View style={styles.orderItemHeader}>
                          <Text style={styles.orderItemName}>{item.name}</Text>
                          <Text style={styles.orderItemPrice}>
                            {formatCurrency(item.price * item.quantity)}
                          </Text>
                        </View>
                        <Text style={styles.orderItemQuantity}>
                          Số lượng: {item.quantity}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Order Total */}
                <View style={styles.orderFooter}>
                  <Text style={styles.orderFooterLabel}>
                    Tổng đơn #{servedOrders.length - index}
                  </Text>
                  <Text style={styles.orderFooterValue}>
                    {formatCurrency(order.total)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#D4D4D4" />
              <Text style={styles.emptyStateText}>Chưa có đơn hàng nào</Text>
              <Text style={styles.emptyStateSubtext}>
                Các đơn đã phục vụ sẽ hiển thị ở đây
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Payment Action */}
      {servedOrders.length > 0 && (
        <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
          <View style={styles.bottomContent}>
            <View style={styles.bottomSummary}>
              <Text style={styles.bottomLabel}>
                Tổng thanh toán (VAT incl.)
              </Text>
              <Text style={styles.bottomTotal}>{formatCurrency(total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={onPayment}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#AD2C00', '#D83900']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.paymentButtonGradient}
              >
                <Ionicons name="card" size={24} color="#FFFFFF" />
                <Text style={styles.paymentButtonText}>Thanh toán ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#AD2C00',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5F5E5E',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  summaryCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryGradient: {
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryContent: {
    position: 'relative',
    zIndex: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  summaryAmountBlock: {
    flex: 1,
    marginRight: 12,
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5F5E5E',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A8A29E',
  },
  ordersList: {
    gap: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardOld: {
    opacity: 0.9,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E2E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIconOld: {
    backgroundColor: '#F0EDED',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  orderTime: {
    fontSize: 12,
    color: '#5F5E5E',
    marginTop: 2,
  },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 106, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006A35',
  },
  orderItems: {
    gap: 16,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 16,
  },
  orderItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  orderItemImageOld: {
    opacity: 0.5,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
    flex: 1,
    marginRight: 8,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AD2C00',
  },
  orderItemQuantity: {
    fontSize: 12,
    color: '#5F5E5E',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EDED',
  },
  orderFooterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A8A29E',
  },
  orderFooterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  emptyState: {
    alignItems: 'center',
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
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  bottomContent: {
    gap: 16,
  },
  bottomSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bottomLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F5E5E',
  },
  bottomTotal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1B1B',
    letterSpacing: -0.5,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
