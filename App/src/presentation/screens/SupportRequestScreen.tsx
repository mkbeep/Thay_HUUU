import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SupportRequestRepository } from '../../data/repositories/SupportRequestRepository';
import { useTable } from '../context/TableContext';

interface SupportRequestScreenProps {
  tableNumber?: number | string;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onRequestSent?: (requestType: string) => void;
}

interface SupportOption {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  description: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

const SUPPORT_OPTIONS: SupportOption[] = [
  {
    id: 'call-staff',
    title: 'Gọi nhân viên',
    icon: 'hand-right',
    color: '#AD2C00',
    bgColor: '#FFF3E0',
    description: 'Nhân viên sẽ đến bàn ngay',
    priority: 'high',
  },
  {
    id: 'add-water',
    title: 'Thêm nước',
    icon: 'water',
    color: '#006A35',
    bgColor: '#E8F5E9',
    description: 'Yêu cầu thêm nước uống',
    priority: 'normal',
  },
  {
    id: 'add-tissue',
    title: 'Thêm khăn giấy',
    icon: 'newspaper',
    color: '#1976D2',
    bgColor: '#E3F2FD',
    description: 'Yêu cầu thêm khăn giấy',
    priority: 'normal',
  },
  {
    id: 'add-utensils',
    title: 'Thêm đồ ăn kèm',
    icon: 'restaurant',
    color: '#7B1FA2',
    bgColor: '#F3E5F5',
    description: 'Xà lách, rau sống, bún...',
    priority: 'normal',
  },
  {
    id: 'change-gas',
    title: 'Thay bình gas',
    icon: 'flame',
    color: '#D84315',
    bgColor: '#FBE9E7',
    description: 'Bình gas hết hoặc lửa yếu',
    priority: 'high',
  },
  {
    id: 'clean-table',
    title: 'Dọn bàn',
    icon: 'trash',
    color: '#F57C00',
    bgColor: '#FFF3E0',
    description: 'Dọn dẹp đĩa, bát đã dùng',
    priority: 'normal',
  },
  {
    id: 'ask-question',
    title: 'Hỏi món ăn',
    icon: 'help-circle',
    color: '#00796B',
    bgColor: '#E0F2F1',
    description: 'Tư vấn về món ăn',
    priority: 'normal',
  },
  {
    id: 'report-issue',
    title: 'Báo vấn đề',
    icon: 'warning',
    color: '#C2185B',
    bgColor: '#FCE4EC',
    description: 'Báo sự cố, vấn đề khác',
    priority: 'high',
  },
];

const VALID_SUPPORT_TYPES = new Set(SUPPORT_OPTIONS.map((option) => option.id));

export default function SupportRequestScreen({
  tableNumber = 12,
  onBack,
  onNavigate,
  onRequestSent,
}: SupportRequestScreenProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { tableNumber: ctxTableNumber, tableId: ctxTableId } = useTable();
  const supportRequestRepository = new SupportRequestRepository();

  const displayTableLabel = String(ctxTableNumber ?? tableNumber ?? '—');

  const submitSupportRequest = async (option: SupportOption) => {
    if (loading) return;

    setSelectedOption(option.id);
    setLoading(true);

    try {
      if (!VALID_SUPPORT_TYPES.has(option.id)) {
        throw new Error(`Unsupported request type: ${option.id}`);
      }

      const resolvedTableNumber = String(ctxTableNumber ?? tableNumber ?? '');
      if (!resolvedTableNumber) {
        throw new Error('MISSING_TABLE');
      }
      const resolvedTableId = ctxTableId || `table-${resolvedTableNumber}`;

      // Gọi API tạo support request
      await supportRequestRepository.createSupportRequest({
        table_id: resolvedTableId,
        table_number: resolvedTableNumber,
        type: option.id,
        priority: option.priority || 'normal',
      });

      console.log('✅ Support request sent:', option.title);

      // Hiển thị thông báo thành công
      Alert.alert(
        '✅ Đã gửi yêu cầu',
        `Yêu cầu "${option.title}" đã được gửi đến nhân viên.\n\nNhân viên sẽ đến bàn của bạn trong vài phút.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Gọi callback để chuyển sang màn hình StaffComingScreen
              if (onRequestSent) {
                onRequestSent(option.title);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error sending support request:', error);
      const msg =
        error?.message === 'MISSING_TABLE'
          ? 'Chưa xác định được bàn. Vui lòng quét mã QR tại bàn rồi thử lại.'
          : 'Không thể gửi yêu cầu. Vui lòng thử lại hoặc gọi nhân viên trực tiếp.';
      Alert.alert('❌ Lỗi', msg, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
      setSelectedOption(null);
    }
  };

  const handleSupportRequest = async (option: SupportOption) => {
    await submitSupportRequest(option);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Ionicons name="hand-right" size={24} color="#AD2C00" />
            <Text style={styles.headerTitle}>HỖ TRỢ</Text>
          </View>
          <View style={styles.tableInfo}>
            <Text style={styles.tableLabel}>BÀN</Text>
            <Text style={styles.tableNumber}>{displayTableLabel}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Card */}
        <LinearGradient
          colors={['#AD2C00', '#D83900']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons name="headset" size={48} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Chúng tôi luôn sẵn sàng</Text>
          <Text style={styles.heroSubtitle}>
            Chọn yêu cầu bên dưới, nhân viên sẽ hỗ trợ ngay
          </Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yêu cầu nhanh</Text>
          <View style={styles.optionsGrid}>
            {SUPPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedOption === option.id && styles.optionCardSelected,
                ]}
                onPress={() => handleSupportRequest(option)}
                activeOpacity={0.7}
                disabled={loading}
              >
                {loading && selectedOption === option.id ? (
                  <ActivityIndicator size="large" color={option.color} style={{ marginBottom: 12 }} />
                ) : (
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: option.bgColor },
                    ]}
                  >
                    <Ionicons name={option.icon} size={28} color={option.color} />
                  </View>
                )}
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription} numberOfLines={2}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Call */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => {
            Alert.alert('Gọi nhân viên khẩn cấp', 'Gửi yêu cầu tới nhà hàng ngay?', [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Gửi ngay',
                style: 'destructive',
                onPress: () =>
                  void submitSupportRequest({
                    id: 'call-staff',
                    title: 'Gọi nhân viên',
                    icon: 'hand-right',
                    color: '#AD2C00',
                    bgColor: '#FFF3E0',
                    description: 'Khẩn cấp',
                    priority: 'urgent',
                  }),
              },
            ]);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#BA1A1A', '#D32F2F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emergencyGradient}
          >
            <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
            <Text style={styles.emergencyText}>GỌI KHẨN CẤP</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#5F5E5E" />
          <Text style={styles.infoText}>
            Thời gian phản hồi trung bình: 2-3 phút
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

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="hand-right" size={26} color="#AD2C00" />
          <Text style={[styles.navText, styles.navTextActive]}>Hỗ trợ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.('table')}
        >
          <Ionicons name="restaurant" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Bàn của tôi</Text>
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
  tableInfo: {
    alignItems: 'flex-end',
  },
  tableLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 1.5,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#AD2C00',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  heroCard: {
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
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '48%',
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
  optionCardSelected: {
    borderWidth: 2,
    borderColor: '#AD2C00',
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 11,
    color: '#5F5E5E',
    textAlign: 'center',
    lineHeight: 16,
  },
  emergencyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#BA1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
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
