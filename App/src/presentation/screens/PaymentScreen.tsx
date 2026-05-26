import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useOrder } from '../context/OrderContext';

interface PaymentScreenProps {
  onBack: () => void;
  onPaymentComplete: () => void;
  tableNumber?: number | string;
}

type SplitMethod = 'equal' | 'byItem';
type PaymentMethod = 'transfer' | 'cash';

const PAYMENT_METHODS = [
  { id: 'transfer', name: 'Chuyển khoản', icon: 'qr-code', color: '#AD2C00' },
  { id: 'cash', name: 'Tiền mặt', icon: 'cash', color: '#006A35' },
];

export default function PaymentScreen({
  onBack,
  onPaymentComplete,
  tableNumber = 12,
}: PaymentScreenProps) {
  const { orders, requestPaymentForServedOrders, hasPendingPaymentConfirmation } = useOrder();
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [paymentRequested, setPaymentRequested] = useState(false);

  const payableLines = orders.filter(
    (line) => line.status === 'served' && line.paymentStatus === 'unpaid'
  );
  const billLines = orders.filter(
    (line) =>
      line.status === 'served' &&
      (line.paymentStatus === 'unpaid' || line.paymentStatus === 'pending_confirmation')
  );
  const waitingConfirmation =
    paymentRequested || hasPendingPaymentConfirmation();

  useEffect(() => {
    setSelectedItemIds(payableLines.map((o) => o.id));
  }, [payableLines.map((o) => o.id).join(',')]);
  
  console.log('💰 Payment calculation:', {
    totalOrders: orders.length,
    payableLines: payableLines.length,
    paidOrders: orders.filter(o => o.paymentStatus === 'paid').length,
  });
  
  const linesToPay =
    splitMethod === 'byItem'
      ? payableLines.filter((o) => selectedItemIds.includes(o.id))
      : payableLines;

  const linesForDisplay = waitingConfirmation ? billLines : linesToPay;
  const total = linesForDisplay.reduce((sum, line) => sum + line.total, 0);
  
  // Tính ngược lại subtotal và tax từ total
  // total = subtotal + tax
  // total = subtotal + (subtotal * 0.08)
  // total = subtotal * 1.08
  // subtotal = total / 1.08
  const subtotal = total / 1.08;
  const tax = total - subtotal;
  const perPerson = total / numberOfPeople;

  const allItems = linesForDisplay.flatMap((line) => line.items);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Chỉ quay về khi admin đã xác nhận thanh toán (paid), không khi đang chờ duyệt
  useEffect(() => {
    const servedLines = orders.filter((line) => line.status === 'served');
    const allServedPaid =
      servedLines.length > 0 &&
      servedLines.every((line) => line.paymentStatus === 'paid');

    if (allServedPaid) {
      console.log('✅ All orders paid by staff, navigating back...');
      const timer = setTimeout(() => onPaymentComplete(), 1500);
      return () => clearTimeout(timer);
    }
  }, [orders, onPaymentComplete]);

  const handleIncreasePeople = () => {
    if (numberOfPeople < 10) {
      setNumberOfPeople((prev) => prev + 1);
    }
  };

  const handleDecreasePeople = () => {
    if (numberOfPeople > 1) {
      setNumberOfPeople((prev) => prev - 1);
    }
  };

  const handlePayment = async () => {
    if (isSubmitting) return;

    const idsToPay =
      splitMethod === 'byItem'
        ? selectedItemIds
        : payableLines.map((l) => l.id);

    if (idsToPay.length === 0) {
      Alert.alert('Không có món cần thanh toán', 'Vui lòng chọn món đã phục vụ.');
      return;
    }

    try {
      setIsSubmitting(true);
      const methodForApi = selectedPayment === 'cash' ? 'cash' : 'qr';
      const ok = await requestPaymentForServedOrders(methodForApi, idsToPay);
      if (!ok) {
        Alert.alert('Lỗi', 'Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.');
        return;
      }
      setPaymentRequested(true);
      Alert.alert(
        'Đã gửi yêu cầu',
        selectedPayment === 'cash'
          ? 'Nhân viên sẽ đến bàn để xác nhận thanh toán tiền mặt.'
          : 'Vui lòng chờ nhân viên/thu ngân xác nhận đã nhận tiền.'
      );
    } catch (error) {
      console.error('❌ Error marking payment:', error);
      Alert.alert('Lỗi', 'Có lỗi khi thanh toán. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#AD2C00" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Thanh toán</Text>
            <Text style={styles.headerSubtitle}>BÀN {tableNumber}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#5F5E5E" />
        </TouchableOpacity>
      </View>

      {waitingConfirmation && (
        <View style={styles.toastBanner}>
          <Ionicons name="hourglass-outline" size={20} color="#AD2C00" />
          <Text style={styles.toastBannerText}>
            Đã gửi yêu cầu thanh toán — chờ nhân viên xác nhận
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Bill Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chi tiết hóa đơn</Text>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.addMoreText}>Thêm món</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.billCard}>
            {/* Items List */}
            <View style={styles.itemsList}>
              {allItems.length > 0 ? (
                allItems.map((item, index) => (
                  <View key={`${item.id}_${index}`} style={styles.billItem}>
                    <View style={styles.billItemLeft}>
                      <Image source={item.image} style={styles.billItemImage} />
                      <View style={styles.billItemInfo}>
                        <Text style={styles.billItemName}>{item.name}</Text>
                        <Text style={styles.billItemQuantity}>
                          Số lượng: {item.quantity}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.billItemPrice}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyBill}>
                  <Ionicons name="receipt-outline" size={48} color="#D4D4D4" />
                  <Text style={styles.emptyBillText}>Chưa có món nào</Text>
                </View>
              )}
            </View>

            {/* Calculations */}
            {allItems.length > 0 && (
              <View style={styles.calculations}>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Tạm tính</Text>
                  <Text style={styles.calculationValue}>
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Thuế VAT (8%)</Text>
                  <Text style={styles.calculationValue}>{formatCurrency(tax)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TỔNG CỘNG</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Split Bill */}
        {allItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chia hóa đơn</Text>

            <View style={styles.splitOptions}>
              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitMethod === 'equal' && styles.splitOptionActive,
                ]}
                onPress={() => setSplitMethod('equal')}
              >
                <Ionicons
                  name="people"
                  size={24}
                  color={splitMethod === 'equal' ? '#FFFFFF' : '#5F5E5E'}
                />
                <Text
                  style={[
                    styles.splitOptionText,
                    splitMethod === 'equal' && styles.splitOptionTextActive,
                  ]}
                >
                  Chia đều
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitMethod === 'byItem' && styles.splitOptionActive,
                ]}
                onPress={() => setSplitMethod('byItem')}
              >
                <Ionicons
                  name="list"
                  size={24}
                  color={splitMethod === 'byItem' ? '#FFFFFF' : '#5F5E5E'}
                />
                <Text
                  style={[
                    styles.splitOptionText,
                    splitMethod === 'byItem' && styles.splitOptionTextActive,
                  ]}
                >
                  Chọn món riêng
                </Text>
              </TouchableOpacity>
            </View>

            {splitMethod === 'byItem' && (
              <View style={styles.itemPickList}>
                {payableLines.map((order) => {
                  const item = order.items[0];
                  const selected = selectedItemIds.includes(order.id);
                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={[styles.itemPickRow, selected && styles.itemPickRowActive]}
                      onPress={() => toggleItemSelection(order.id)}
                    >
                      <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={selected ? '#AD2C00' : '#A8A29E'}
                      />
                      <Text style={styles.itemPickName}>{item?.name}</Text>
                      <Text style={styles.itemPickPrice}>
                        {formatCurrency(order.total)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {splitMethod === 'equal' && (
              <>
                <View style={styles.splitDetail}>
                  <Text style={styles.splitDetailLabel}>Số người chia</Text>
                  <View style={styles.peopleCounter}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={handleDecreasePeople}
                    >
                      <Ionicons name="remove" size={20} color="#AD2C00" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>
                      {numberOfPeople.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={handleIncreasePeople}
                    >
                      <Ionicons name="add" size={20} color="#AD2C00" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.perPersonText}>
                  Ước tính: {formatCurrency(perPerson)} / người
                </Text>
              </>
            )}
          </View>
        )}

        {/* Payment Methods */}
        {allItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paymentMethods}
            >
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedPayment === method.id && styles.paymentMethodActive,
                  ]}
                  onPress={() => setSelectedPayment(method.id as PaymentMethod)}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={32}
                    color={
                      selectedPayment === method.id ? method.color : '#A8A29E'
                    }
                  />
                  <Text
                    style={[
                      styles.paymentMethodLabel,
                      selectedPayment === method.id && styles.paymentMethodLabelActive,
                    ]}
                  >
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* QR Code */}
        {allItems.length > 0 && selectedPayment !== 'cash' && (
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <View style={styles.qrCode}>
                {/* QR Code Pattern */}
                <View style={styles.qrPattern}>
                  <View style={[styles.qrCorner, styles.qrCornerTL]} />
                  <View style={[styles.qrCorner, styles.qrCornerTR]} />
                  <View style={[styles.qrCorner, styles.qrCornerBL]} />
                </View>
                {/* Center Icon */}
                <View style={styles.qrCenter}>
                  <Ionicons name="qr-code" size={32} color="#AD2C00" />
                </View>
              </View>
            </View>
            <Text style={styles.qrTitle}>Quét để thanh toán</Text>
            <Text style={styles.qrOrderNumber}>
              Mã đơn hàng: #GT-{Math.floor(Math.random() * 900000) + 100000}
            </Text>
          </View>
        )}

        {allItems.length > 0 && selectedPayment === 'cash' && (
          <View style={styles.cashSection}>
            <View style={styles.cashIconWrap}>
              <Ionicons name="cash-outline" size={42} color="#AD2C00" />
            </View>
            <Text style={styles.cashTitle}>Thanh toán tiền mặt tại bàn</Text>
            <Text style={styles.cashDescription}>
              Nhân viên sẽ đến bàn {tableNumber} để xác nhận hóa đơn và nhận tiền mặt.
            </Text>
            <Text style={styles.cashAmount}>Số tiền cần thanh toán: {formatCurrency(total)}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Payment Button */}
      {(allItems.length > 0 || waitingConfirmation) && !waitingConfirmation && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              isSubmitting && styles.paymentButtonDisabled
            ]}
            onPress={handlePayment}
            activeOpacity={0.9}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ['#A8A29E', '#78716C'] : ['#AD2C00', '#D83900']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentButtonGradient}
            >
              {isSubmitting ? (
                <>
                  <Ionicons name="hourglass-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.paymentButtonText}>Đang gửi...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.paymentButtonText}>
                    {selectedPayment === 'cash' ? 'Gọi nhân viên thu tiền mặt' : 'Gửi yêu cầu thanh toán'}
                  </Text>
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {waitingConfirmation && (
        <View style={styles.bottomAction}>
          <View style={styles.pendingNotice}>
            <Ionicons name="time-outline" size={20} color="#AD2C00" />
            <Text style={styles.pendingText}>
              {selectedPayment === 'cash'
                ? 'Đã gọi nhân viên — chờ xác nhận thu tiền mặt'
                : 'Đang chờ nhân viên xác nhận thanh toán'}
            </Text>
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
    paddingTop: 60,
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
    color: '#1C1B1B',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5F5E5E',
    letterSpacing: 1.5,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E2E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1B1B',
    letterSpacing: -0.5,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AD2C00',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemsList: {
    gap: 16,
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  billItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0EDED',
  },
  billItemInfo: {
    flex: 1,
  },
  billItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  billItemQuantity: {
    fontSize: 12,
    color: '#5F5E5E',
    marginTop: 2,
  },
  billItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  emptyBill: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyBillText: {
    fontSize: 14,
    color: '#A8A29E',
    marginTop: 12,
  },
  calculations: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(145, 111, 103, 0.2)',
    borderStyle: 'dashed',
    gap: 8,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculationLabel: {
    fontSize: 14,
    color: '#5F5E5E',
  },
  calculationValue: {
    fontSize: 14,
    color: '#5F5E5E',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C1B1B',
    letterSpacing: -0.3,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#AD2C00',
    letterSpacing: -0.5,
  },
  splitOptions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  splitOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(145, 111, 103, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  splitOptionActive: {
    backgroundColor: '#AD2C00',
    borderColor: '#AD2C00',
    shadowColor: '#AD2C00',
    shadowOpacity: 0.2,
  },
  splitOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5F5E5E',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  splitOptionTextActive: {
    color: '#FFFFFF',
  },
  itemPickList: {
    marginTop: 12,
    gap: 8,
  },
  itemPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F6F3F2',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  itemPickRowActive: {
    borderColor: '#AD2C00',
    backgroundColor: '#FFF7ED',
  },
  itemPickName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1B1B',
  },
  itemPickPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AD2C00',
  },
  splitDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F6F3F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  splitDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1B1B',
  },
  peopleCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EDED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
    minWidth: 32,
    textAlign: 'center',
  },
  perPersonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#5F5E5E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paymentMethods: {
    gap: 16,
    paddingBottom: 8,
  },
  paymentMethod: {
    width: 112,
    height: 82,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(145, 111, 103, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodActive: {
    borderWidth: 2,
    borderColor: '#AD2C00',
  },
  paymentMethodLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#78716C',
    textAlign: 'center',
  },
  paymentMethodLabelActive: {
    color: '#AD2C00',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(145, 111, 103, 0.2)',
    borderStyle: 'dashed',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCode: {
    width: 160,
    height: 160,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  qrPattern: {
    flex: 1,
    padding: 8,
  },
  qrCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: '#1C1B1B',
  },
  qrCornerTL: {
    top: 8,
    left: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  qrCornerTR: {
    top: 8,
    right: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  qrCornerBL: {
    bottom: 8,
    left: 8,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  qrCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  qrOrderNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5F5E5E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  cashSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(145, 111, 103, 0.2)',
  },
  cashIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(173, 44, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cashTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  cashDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5F5E5E',
    textAlign: 'center',
  },
  cashAmount: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '800',
    color: '#AD2C00',
    textAlign: 'center',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(173, 44, 0, 0.25)',
  },
  toastBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#AD2C00',
    lineHeight: 18,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AD2C00',
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
  paymentButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
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
