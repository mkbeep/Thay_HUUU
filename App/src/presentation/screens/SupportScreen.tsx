import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupportRequestRepository } from '../../data/repositories/SupportRequestRepository';

interface SupportRequestRow {
  id: string;
  tableNumber: string;
  typeLabel: string;
  time: string;
  status: string;
  priority: string;
}

interface SupportScreenProps {
  onBack: () => void;
  tableId?: string | null;
  tableNumber?: number | string;
}

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  'call-staff': 'Gọi nhân viên',
  'add-water': 'Thêm nước',
  'add-tissue': 'Thêm khăn giấy',
  'add-utensils': 'Thêm dụng cụ ăn',
  'change-gas': 'Đổi bình gas',
  'clean-table': 'Dọn bàn',
  'ask-question': 'Hỏi đáp',
  'report-issue': 'Báo sự cố',
};

function labelForSupportType(type: string): string {
  return SUPPORT_TYPE_LABELS[type] || type;
}

function formatRelativeVi(date: Date): string {
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 45) return 'Vừa xong';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  return date.toLocaleString('vi-VN');
}

function mapApiToRow(raw: any): SupportRequestRow {
  const createdRaw = raw.created_at;
  const created =
    createdRaw instanceof Date
      ? createdRaw
      : typeof createdRaw === 'string' || typeof createdRaw === 'number'
        ? new Date(createdRaw)
        : new Date();
  return {
    id: String(raw.id),
    tableNumber: String(raw.table_number ?? ''),
    typeLabel: labelForSupportType(String(raw.type ?? '')),
    time: formatRelativeVi(created),
    status: String(raw.status ?? 'pending'),
    priority: String(raw.priority ?? 'normal'),
  };
}

export default function SupportScreen({
  onBack,
  tableId,
  tableNumber,
}: SupportScreenProps) {
  const [requests, setRequests] = useState<SupportRequestRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadHint, setLoadHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tableId) {
      setRequests([]);
      setLoadHint('Chưa xác định bàn — hãy quét mã QR bàn để xem yêu cầu.');
      return;
    }
    setLoadHint(null);
    try {
      const repo = new SupportRequestRepository();
      const list = await repo.getSupportRequestsByTable(tableId);
      setRequests(Array.isArray(list) ? list.map(mapApiToRow) : []);
    } catch {
      setLoadHint('Không tải được danh sách. Kéo xuống để thử lại.');
      setRequests([]);
    }
  }, [tableId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const urgentRequest = requests.find(
    (r) =>
      r.status === 'pending' &&
      tableNumber != null &&
      String(r.tableNumber) === String(tableNumber)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#006A35';
      case 'completed':
        return '#78716C';
      case 'in_progress':
        return '#B45309';
      case 'cancelled':
        return '#78716C';
      default:
        return '#AD2C00';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'in_progress':
        return 'Đang xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Chờ xử lý';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={24} color="#AD2C00" />
          <Text style={styles.headerTitle}>Gourmet Tech</Text>
        </View>
        <View style={styles.headerRight}>
            <View style={styles.notificationBadge}>
              <Ionicons name="notifications" size={20} color="#5F5E5E" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingRequests.length > 99 ? '99+' : String(pendingRequests.length)}
                </Text>
              </View>
            </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={22} color="#78716C" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#AD2C00" />
        }
      >
        {loadHint ? (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={22} color="#5F5E5E" />
            <Text style={styles.hintText}>{loadHint}</Text>
          </View>
        ) : null}
        {/* Urgent Request Card */}
        {urgentRequest && (
          <View style={styles.urgentCard}>
            <View style={styles.urgentBackground}>
              <Ionicons
                name="alert-circle"
                size={80}
                color="rgba(255,255,255,0.05)"
                style={styles.urgentIcon}
              />
            </View>

            <View style={styles.urgentHeader}>
              <View style={styles.urgentBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.urgentBadgeText}>YÊU CẦU KHẨN CẤP</Text>
              </View>
            </View>

            <Text style={styles.urgentTitle}>
              YÊU CẦU HỖ TRỢ TẠI BÀN {urgentRequest.tableNumber}
            </Text>

            <View style={styles.urgentHintBox}>
              <Ionicons name="people-outline" size={20} color="#1C1B1B" />
              <Text style={styles.urgentHintText}>
                Nhân viên đã nhận thông báo. Bạn có thể kéo xuống để làm mới trạng thái.
              </Text>
            </View>
          </View>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yêu cầu đang chờ</Text>
          <Text style={styles.sectionCount}>
            {pendingRequests.length} yêu cầu mới
          </Text>
        </View>

        {/* Request List */}
        <View style={styles.requestList}>
          {requests.map((request) => (
            <View
              key={request.id}
              style={[
                styles.requestCard,
                request.status === 'confirmed' && styles.requestCardConfirmed,
              ]}
            >
              <View style={styles.requestContent}>
                <View style={styles.requestLeft}>
                  <View style={styles.tableNumberBadge}>
                    <Text style={styles.tableNumberText}>
                      {request.tableNumber.toString().padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestType}>{request.typeLabel}</Text>
                    <View style={styles.requestTime}>
                      <Ionicons name="time" size={14} color="#5F5E5E" />
                      <Text style={styles.requestTimeText}>{request.time}</Text>
                    </View>
                    {request.status !== 'pending' && (
                      <View style={styles.statusBadge}>
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: getStatusColor(request.status) },
                          ]}
                        >
                          {getStatusText(request.status)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {request.status === 'pending' && (
                  <TouchableOpacity style={styles.chevronButton}>
                    <Ionicons name="chevron-forward" size={20} color="#5F5E5E" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress bar for confirmed requests */}
              {request.status === 'confirmed' && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Staff Info Card */}
        <View style={styles.staffCard}>
          <Ionicons name="headset-outline" size={40} color="#AD2C00" />
          <View style={{ flex: 1 }}>
            <Text style={styles.staffTitle}>Hỗ trợ nhà hàng</Text>
            <Text style={styles.staffName}>
              Yêu cầu của bạn được gửi tới nhân viên qua hệ thống. Kéo xuống để cập nhật trạng thái.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={onBack}
        >
          <Ionicons name="compass" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Khám phá</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={onBack}
        >
          <Ionicons name="receipt" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Lịch sử</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
        >
          <Ionicons name="pricetag" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Ưu đãi</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
        >
          <Ionicons name="person-circle" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Tài khoản</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#1C1B1B',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.1,
    shadowRadius: 64,
    elevation: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#AD2C00',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#AD2C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E2E1',
    backgroundColor: '#F5F5F4',
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
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F6F3F2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    color: '#44403C',
    lineHeight: 20,
  },
  urgentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 40,
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 50,
    elevation: 8,
    borderLeftWidth: 8,
    borderLeftColor: '#AD2C00',
    position: 'relative',
    overflow: 'hidden',
  },
  urgentBackground: {
    position: 'absolute',
    top: 0,
    right: 16,
  },
  urgentIcon: {
    opacity: 0.05,
  },
  urgentHeader: {
    marginBottom: 16,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#AD2C00',
  },
  urgentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AD2C00',
    letterSpacing: 1.5,
  },
  urgentTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1B1B',
    marginBottom: 16,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  urgentHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F6F3F2',
    padding: 14,
    borderRadius: 12,
  },
  urgentHintText: {
    flex: 1,
    fontSize: 14,
    color: '#44403C',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F5E5E',
  },
  requestList: {
    gap: 16,
    marginBottom: 32,
  },
  requestCard: {
    backgroundColor: '#F6F3F2',
    borderRadius: 12,
    padding: 20,
  },
  requestCardConfirmed: {
    backgroundColor: '#FFFFFF',
  },
  requestContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  tableNumberBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableNumberText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#AD2C00',
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 4,
  },
  requestTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestTimeText: {
    fontSize: 14,
    color: '#5F5E5E',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 106, 53, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006A35',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevronButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E2E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginTop: 16,
    paddingLeft: 72,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E2E1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    width: '66%',
    height: '100%',
    backgroundColor: '#006A35',
    borderRadius: 3,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(229, 226, 225, 0.5)',
    padding: 16,
    borderRadius: 12,
  },
  staffTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 12,
    color: '#5F5E5E',
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
});
