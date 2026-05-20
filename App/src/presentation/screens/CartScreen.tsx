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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';

interface CartItem {
  id: string;
  name: string;
  price: string;
  image: any;
  quantity: number;
  options?: string;
  note?: string;
}

interface CartScreenProps {
  onBack: () => void;
  onSubmitOrder: () => void;
  tableNumber?: string | number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function CartScreen({
  onBack,
  onSubmitOrder,
  tableNumber,
}: CartScreenProps) {
  const { items, removeItem, updateQuantity, getTotal, getTax, getServiceFee, getGrandTotal, clearCart } = useCart();
  const { createOrder } = useOrder();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const subtotal = getTotal();
  const tax = getTax();
  const serviceFee = getServiceFee();
  const total = getGrandTotal();

  // Debug: Log render info
  console.log('🎨 CartScreen render:', {
    itemsCount: items.length,
    tableNumber,
    subtotal,
    tax,
    serviceFee,
    total,
    showBottomButton: items.length > 0
  });

  const handleRemoveItem = (id: string, name: string) => {
    Alert.alert(
      'Xóa món',
      `Bạn có chắc muốn xóa "${name}" khỏi giỏ hàng?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => removeItem(id)
        },
      ]
    );
  };

  const handleIncreaseQuantity = (id: string, currentQuantity: number) => {
    updateQuantity(id, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (id: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(id, currentQuantity - 1);
    }
  };

  const handleSubmitOrder = async () => {
    console.log('🔍 handleSubmitOrder called');

    if (items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm món vào giỏ hàng trước khi gửi đơn.');
      return;
    }

    if (tableNumber === undefined || tableNumber === null || tableNumber === '') {
      Alert.alert(
        'Chưa chọn bàn', 
        'Vui lòng quét mã QR bàn để đặt món.'
      );
      return;
    }

    console.log('✅ Submitting order...');
    
    // OPTIMISTIC UI: Xóa giỏ hàng và chuyển màn hình NGAY LẬP TỨC
    clearCart();
    console.log('🗑️ Cart cleared');
    
    console.log('� Navigating to order history...');
    onSubmitOrder();
    
    // Gửi API ở background (không đợi)
    createOrder(items, total, tableNumber).then(result => {
      if (!result.success) {
        console.error('❌ Order submission failed:', result.error);
        // Có thể thêm toast notification ở đây nếu cần
      } else {
        console.log('✅ Order submitted successfully!');
      }
    }).catch(error => {
      console.error('❌ Unexpected error:', error);
    });
  };

  const renderCartItem = (item: any) => (
    <View key={item.id} style={styles.cartItem}>
      <Image source={item.image} style={styles.itemImage} />
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.options && (
              <View style={styles.optionsRow}>
                <Ionicons name="restaurant" size={14} color="#78716C" />
                <Text style={styles.optionsText}>{item.options}</Text>
              </View>
            )}
            {item.note && (
              <View style={styles.noteRow}>
                <Ionicons name="create-outline" size={14} color="#AD2C00" />
                <Text style={styles.noteText}>Ghi chú: '{item.note}'</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemPrice}>{item.priceDisplay}</Text>
        </View>

        <View style={styles.itemFooter}>
          {/* Quantity Controls */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleDecreaseQuantity(item.id, item.quantity)}
            >
              <Ionicons name="remove" size={16} color="#AD2C00" />
            </TouchableOpacity>
            
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>x{item.quantity}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleIncreaseQuantity(item.id, item.quantity)}
            >
              <Ionicons name="add" size={16} color="#AD2C00" />
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => handleRemoveItem(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C2410C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xem lại đơn hàng</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>Bàn {tableNumber ?? '—'}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="bag-outline" size={24} color="#C2410C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>Xác nhận đơn hàng</Text>
          <Text style={styles.title}>
            Gourmet Tech{'\n'}Experience.
          </Text>
        </View>

        {/* Cart Items */}
        <View style={styles.cartItems}>
          {items.length > 0 ? (
            items.map(renderCartItem)
          ) : (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={64} color="#A8A29E" />
              <Text style={styles.emptyCartText}>Giỏ hàng trống</Text>
              <Text style={styles.emptyCartSubtext}>
                Thêm món từ menu để bắt đầu đặt hàng
              </Text>
              <TouchableOpacity style={styles.backToMenuButton} onPress={onBack}>
                <Text style={styles.backToMenuText}>Quay lại menu</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Summary - Chỉ hiển thị khi có món */}
        {items.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="receipt" size={20} color="#AD2C00" />
                <Text style={styles.summaryTitle}>Tóm tắt thanh toán</Text>
              </View>

              <View style={styles.summaryRows}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tạm tính</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Thuế (8%)</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí dịch vụ</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(serviceFee)}</Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
              </View>
            </View>

            {/* Kitchen Info */}
            <View style={styles.infoBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#006A35" />
              <Text style={styles.infoText}>
                Món ăn sẽ được chuẩn bị ngay sau khi bạn gửi đơn đến bếp.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Action - Chỉ hiển thị khi có món */}
      {items.length > 0 && (
        <View style={styles.bottomAction}>
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={() => {
              console.log('========================================');
              console.log('🔘 SUBMIT BUTTON PRESSED!');
              console.log('Timestamp:', new Date().toISOString());
              console.log('Items count:', items.length);
              console.log('Table number:', tableNumber);
              console.log('========================================');
              handleSubmitOrder();
            }}
            activeOpacity={0.9}
            disabled={false}
          >
            <View style={styles.submitButtonGradient}>
              <Ionicons name="restaurant" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Gửi đơn đến bếp</Text>
            </View>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableBadge: {
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tableBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AD2C00',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  titleSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F5E5E',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1C1B1B',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  cartItems: {
    gap: 24,
    marginBottom: 40,
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  optionsText: {
    fontSize: 14,
    color: '#78716C',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#AD2C00',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBadge: {
    backgroundColor: '#F0EDED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1B1B',
  },
  editButton: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D83900',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B1B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backToMenuButton: {
    backgroundColor: '#AD2C00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#F6F3F2',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  summaryRows: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5F5E5E',
  },
  summaryValue: {
    fontSize: 14,
    color: '#5F5E5E',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(145, 111, 103, 0.2)',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#AD2C00',
    letterSpacing: -0.5,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(0, 106, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#005228',
    lineHeight: 20,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1000,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
    backgroundColor: '#AD2C00',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
