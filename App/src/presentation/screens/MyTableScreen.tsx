import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrder } from '../context/OrderContext';

interface MyTableScreenProps {
  tableNumber?: string | number; // Support both string and number
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onPayment?: () => void;
  onQRScan?: () => void;
}

export default function MyTableScreen({
  tableNumber = 12,
  onBack,
  onNavigate,
  onPayment,
  onQRScan,
}: MyTableScreenProps) {
  const {
    orders,
    hasPendingPaymentConfirmation,
    hasUnpaidServedOrders,
    isTableFullyPaid,
  } = useOrder();

  const servedOrders = orders.filter((order) => order.status === 'served');
  const unpaidServedOrders = servedOrders.filter(
    (order) => order.paymentStatus === 'unpaid'
  );
  const totalAmount = unpaidServedOrders.reduce((sum, order) => sum + order.total, 0);
  const subtotal = totalAmount / 1.08; // Tính ngược lại subtotal (vì total đã bao gồm VAT 8%)
  const vat = totalAmount - subtotal;
  const formatCurrency = (amount: number) => {
    return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
  };

  // Tính thời gian ngồi (giả sử bắt đầu từ đơn hàng đầu tiên)
  const startTime = orders.length > 0 ? new Date(orders[0].createdAt) : new Date();
  const currentTime = new Date();
  const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000); // phút

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} giờ ${mins} phút`;
  };

  const handlePayment = () => {
    if (!hasUnpaidServedOrders()) {
      Alert.alert(
        'Chưa có món nào',
        'Bạn chưa gọi món nào. Vui lòng gọi món trước khi thanh toán.',
        [{ text: 'OK' }]
      );
      return;
    }
    onPayment?.();
  };

  const handleSplitBill = () => {
    if (!hasUnpaidServedOrders()) {
      Alert.alert('Chưa có món nào', 'Bạn chưa gọi món nào để chia bill.', [
        { text: 'OK' },
      ]);
      return;
    }
    Alert.alert(
      'Chia bill',
      'Tính năng chia bill sẽ có trong màn hình thanh toán.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Ionicons name="restaurant" size={24} color="#AD2C00" />
            <Text style={styles.headerTitle}>BÀN CỦA TÔI</Text>
          </View>
          {onQRScan ? (
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => {
                onQRScan();
              }}
            >
              <Ionicons name="qr-code" size={24} color="#5F5E5E" />
            </TouchableOpacity>
          ) : (
            <View style={styles.qrButtonPlaceholder} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Table Info Card */}
        <LinearGradient
          colors={['#AD2C00', '#D83900']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tableCard}
        >
          <View style={styles.tableNumberBadge}>
            <Text style={styles.tableNumberText}>{tableNumber}</Text>
          </View>
          <Text style={styles.tableTitle}>Bàn số {tableNumber}</Text>
          <View style={styles.tableMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.metaText}>{formatDuration(duration)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="receipt" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.metaText}>{servedOrders.length} món</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng chi tiêu</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tạm tính</Text>
              <Text style={styles.billValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>VAT (8%)</Text>
              <Text style={styles.billValue}>{formatCurrency(vat)}</Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Tổng cộng</Text>
              <Text style={styles.billTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="fast-food" size={24} color="#AD2C00" />
            </View>
            <Text style={styles.statNumber}>{orders.length}</Text>
            <Text style={styles.statLabel}>Đơn đã gọi</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#006A35" />
            </View>
            <Text style={styles.statNumber}>{servedOrders.length}</Text>
            <Text style={styles.statLabel}>Đã phục vụ</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="hourglass" size={24} color="#1976D2" />
            </View>
            <Text style={styles.statNumber}>
              {orders.length - servedOrders.length}
            </Text>
            <Text style={styles.statLabel}>Đang nấu</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác</Text>
          <View style={styles.actionList}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('orders')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="list" size={20} color="#AD2C00" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Xem chi tiết đơn hàng</Text>
                  <Text style={styles.actionDescription}>
                    Xem trạng thái từng món
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A8A29E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSplitBill}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="people" size={20} color="#006A35" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Chia bill</Text>
                  <Text style={styles.actionDescription}>
                    Chia đều hoặc theo món
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A8A29E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('support')}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="hand-right" size={20} color="#1976D2" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Gọi nhân viên</Text>
                  <Text style={styles.actionDescription}>
                    Yêu cầu hỗ trợ ngay
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A8A29E" />
            </TouchableOpacity>
          </View>
        </View>

        {hasUnpaidServedOrders() ? (
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handlePayment}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#006A35', '#008645']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.paymentGradient}
            >
              <Ionicons name="card" size={24} color="#FFFFFF" />
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentLabel}>THANH TOÁN NGAY</Text>
                <Text style={styles.paymentAmount}>{formatCurrency(totalAmount)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : hasPendingPaymentConfirmation() ? (
          <View style={[styles.paymentButton, styles.paymentPendingBox]}>
            <Ionicons name="hourglass-outline" size={22} color="#AD2C00" />
            <Text style={styles.paymentPendingText}>Đang chờ nhân viên xác nhận thanh toán</Text>
          </View>
        ) : isTableFullyPaid() ? (
          <View style={[styles.paymentButton, styles.paymentDoneBox]}>
            <Ionicons name="checkmark-circle" size={22} color="#006A35" />
            <Text style={styles.paymentDoneText}>Đã thanh toán xong</Text>
          </View>
        ) : null}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#5F5E5E" />
          <Text style={styles.infoText}>
            Giá đã bao gồm VAT. Trạng thái "đã thanh toán" chỉ hiển thị sau khi admin/nhân viên xác nhận.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.('explore')}
        >
          <Ionicons name="compass" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Khám phá</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.('orders')}
        >
          <Ionicons name="receipt" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Lịch sử</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.('support')}
        >
          <Ionicons name="hand-right" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Hỗ trợ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="restaurant" size={26} color="#AD2C00" />
          <Text style={[styles.navText, styles.navTextActive]}>Bàn của tôi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9F8',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1B1B',
    letterSpacing: 0.5,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  tableCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tableNumberBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  tableNumberText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tableTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tableMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 16,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#5F5E5E',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1B1B',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F4F4F5',
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  billTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#AD2C00',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1B1B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#5F5E5E',
    textAlign: 'center',
  },
  actionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#5F5E5E',
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#006A35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentPendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(173, 44, 0, 0.25)',
    shadowColor: '#AD2C00',
  },
  paymentPendingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#AD2C00',
  },
  paymentDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 106, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 106, 53, 0.25)',
    shadowColor: '#006A35',
  },
  paymentDoneText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#006A35',
  },
  paymentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  paymentTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F3F2',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#5F5E5E',
    flex: 1,
    lineHeight: 18,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A8A29E',
  },
  navTextActive: {
    fontWeight: '700',
    color: '#AD2C00',
  },
});
