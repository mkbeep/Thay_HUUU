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
import { LinearGradient } from 'expo-linear-gradient';

interface SupportRequest {
  id: string;
  tableNumber: number;
  type: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  priority: 'high' | 'normal';
}

interface SupportScreenProps {
  onBack: () => void;
  tableNumber?: number;
}

const MOCK_REQUESTS: SupportRequest[] = [
  {
    id: '1',
    tableNumber: 12,
    type: 'Yêu cầu hỗ trợ',
    time: '1 phút trước',
    status: 'pending',
    priority: 'high',
  },
  {
    id: '2',
    tableNumber: 8,
    type: 'Gọi thanh toán',
    time: '2 phút trước',
    status: 'pending',
    priority: 'normal',
  },
  {
    id: '3',
    tableNumber: 24,
    type: 'Yêu cầu thêm nước',
    time: '5 phút trước',
    status: 'pending',
    priority: 'normal',
  },
  {
    id: '4',
    tableNumber: 15,
    type: 'Đặt món thêm',
    time: '12 phút trước',
    status: 'confirmed',
    priority: 'normal',
  },
  {
    id: '5',
    tableNumber: 3,
    type: 'Đổi khăn trải bàn',
    time: '18 phút trước',
    status: 'pending',
    priority: 'normal',
  },
];

export default function SupportScreen({
  onBack,
  tableNumber = 12,
}: SupportScreenProps) {
  const [requests, setRequests] = useState<SupportRequest[]>(MOCK_REQUESTS);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const urgentRequest = requests.find(
    (r) => r.tableNumber === tableNumber && r.status === 'pending'
  );

  const handleConfirm = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'confirmed' as const } : r
      )
    );
    Alert.alert('Đã xác nhận', 'Yêu cầu đã được xác nhận');
  };

  const handleComplete = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'completed' as const } : r
      )
    );
    Alert.alert('Hoàn thành', 'Yêu cầu đã được xử lý xong');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#006A35';
      case 'completed':
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
              <Text style={styles.badgeText}>5</Text>
            </View>
          </View>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxQ7Yd3TDkYN2TAzLPSBO_uza7AnBmHy5el7LYmGBvtociCHqKt2elN2tE3X4SEQQcWZxSGRFiOvqMgM0GQhd0YnYk4ftbyTnl-5kOaNFm4LjKvGepPn0I8VmAmimBUeXAaMv7HXnpH9WY8nkBHkzPY6_kreFRepp9nfGP6_EBOnI6XLn1d7Q9gNVRRqvR3QYo9Lrbx7qkaDmRsUHxTCy7sr7MPIA_kQYDcqUwVZEpjzzcRNzSbExzprd2dSZYk8B2M-26XULJBg',
            }}
            style={styles.avatar}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
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

            <View style={styles.urgentActions}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleConfirm(urgentRequest.id)}
              >
                <Ionicons name="hand-left" size={20} color="#1C1B1B" />
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleComplete(urgentRequest.id)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#AD2C00', '#D83900']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.completeButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Đã xử lý</Text>
                </LinearGradient>
              </TouchableOpacity>
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
                    <Text style={styles.requestType}>{request.type}</Text>
                    <View style={styles.requestTime}>
                      <Ionicons name="time" size={14} color="#5F5E5E" />
                      <Text style={styles.requestTimeText}>{request.time}</Text>
                    </View>
                    {request.status === 'confirmed' && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
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
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbjO4O_F4LhoSFBXAn3RIen91YyLf78EWYP_LCa3u-aAdKEoZ0DukWx3-9jdo4tIvs_T9pnCYd-ORT57-xl2gNp0t5_1jw-wxJnN50Gr1AReoN1y62x0PN0qUVXubYURNNhhUUlNsoaDltaDctX1oQJbjt0oiGvZD9HiMY3nvPv6k_yXVn2J_5VP3sI7z3o3ABT0Yxk1Kd0H_q3nJ8a8SPVzFdQkDMkRDKZePL8G3IpXES2sQUwW_9kpM7lRtrKKPuGpK3EP8K2g',
            }}
            style={styles.staffImage}
          />
          <View>
            <Text style={styles.staffTitle}>Khu vực phục vụ: Tầng 1</Text>
            <Text style={styles.staffName}>Đang trực: Nguyễn Văn A</Text>
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E2E1',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
    marginBottom: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  urgentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E2DFDE',
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  completeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  staffImage: {
    width: 64,
    height: 64,
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
