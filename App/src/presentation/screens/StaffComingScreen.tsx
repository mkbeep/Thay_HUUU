import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { socketService } from '../../services/socketService';

interface StaffComingScreenProps {
  tableNumber?: number | string;
  requestId?: string;
  requestType?: string;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onResolved?: () => void;
}

export default function StaffComingScreen({
  tableNumber = 12,
  requestId,
  requestType = 'Yêu cầu hỗ trợ',
  onBack,
  onNavigate,
  onResolved,
}: StaffComingScreenProps) {
  const [countdown, setCountdown] = useState(30);
  const pulseAnim = new Animated.Value(1);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const handleSupportUpdated = (payload: { id?: string; status?: string }) => {
      if (requestId && payload.id && payload.id !== requestId) return;
      if (!payload.status || payload.status === 'pending') return;
      onResolved?.();
    };

    socketService.on('support:request_updated', handleSupportUpdated);
    return () => {
      socketService.off('support:request_updated', handleSupportUpdated);
    };
  }, [requestId, onResolved]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1C1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu hỗ trợ</Text>
        <View style={styles.headerRight}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2vqHfQz4dgUAyt2yTPQnKS8d_gBa-IF99y7h67ZR1AGGflCpI05UI-VQacw_e3C-66BZPrwZsiY66hiRfFI7JtuQmo8F6MznnO7HV2ZfIfNM6grY09KCwJStoPJMam2yIiL15vp33DQaE8MhHNnUaaPhvOtIzfUjlMSdSk7WNXy5wPx5uAiInuCnGwR5aTgTxqufJow5M5wEdCZwSxcjD4IQ9m1hLklFsnLv6PE7OvQMmBMenOrSnifrwE3nMKx5PhZVs1g28DQ',
            }}
            style={styles.userAvatar}
          />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Status Visualizer */}
        <View style={styles.statusContainer}>
          {/* Pulse Rings */}
          <View style={styles.pulseRing1} />
          <View style={styles.pulseRing2} />
          <View style={styles.pulseRing3} />

          {/* Staff Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#AD2C00', '#D83900']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarImageContainer}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo1Uz5ZpGVW8VKz1dMFHMtYR6sj5jn7da-8wFCn58YGmtOXs47sxWbh1z83CQzmAmME9iD4Mq-Vyo_zpuzibjGFEPZ_wEU8VFFUmNqY0bdjg4bk2dESNohzQABdHWbTQWASeSkHYFY49-m-KQXGFWH2KIVxhU6-bh-q7-7lTuLMt1lwt2W7o2hHqIfLbi1qY3Ifk9pv63Zh60oBDKs0O8_RwfQVYy7ICfTIDhKm2GkYpCy_T9wXkCo58zNz6wQxWqN7eE_gKihwg',
                  }}
                  style={styles.staffAvatar}
                />
              </View>
              {/* Notification Badge */}
              <View style={styles.notificationBadge}>
                <Ionicons name="notifications" size={20} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Message Section */}
        <View style={styles.messageSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Nhân viên đang đến</Text>
            <View style={styles.timerBadge}>
              <Ionicons name="timer" size={14} color="#AD2C00" />
              <Text style={styles.timerText}>Dự kiến: {countdown} giây</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Vui lòng đợi trong giây lát, nhân viên sẽ có mặt tại{' '}
            <Text style={styles.tableHighlight}>bàn {tableNumber}</Text> trong
            vòng {countdown} giây.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionCards}>
          <Text style={styles.actionTitle}>Yêu cầu khác</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onNavigate?.('explore')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="restaurant" size={28} color="#AD2C00" />
              </View>
              <Text style={styles.quickActionText}>Xem thực đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="water" size={28} color="#006A35" />
              </View>
              <Text style={styles.quickActionText}>Thêm nước</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="trash" size={28} color="#1976D2" />
              </View>
              <Text style={styles.quickActionText}>Dọn bàn</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
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
          <View style={styles.navItemActive}>
            <Ionicons name="hand-right" size={26} color="#FFFFFF" />
          </View>
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

      {/* Floating Chat Button */}
      <TouchableOpacity style={styles.floatingButton} activeOpacity={0.9}>
        <LinearGradient
          colors={['#AD2C00', '#D83900']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#1C1B1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(173, 44, 0, 0.2)',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    paddingBottom: 120,
  },
  statusContainer: {
    width: 256,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  pulseRing1: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(173, 44, 0, 0.05)',
  },
  pulseRing2: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
  },
  pulseRing3: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(173, 44, 0, 0.2)',
  },
  avatarContainer: {
    position: 'relative',
    zIndex: 10,
  },
  avatarGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 4,
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 76,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  staffAvatar: {
    width: '100%',
    height: '100%',
  },
  notificationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#006A35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#006A35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#AD2C00',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AD2C00',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5F5E5E',
    textAlign: 'center',
    maxWidth: 280,
  },
  tableHighlight: {
    fontWeight: '700',
    color: '#1C1B1B',
  },
  actionCards: {
    width: '100%',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F6F3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1B1B',
    textAlign: 'center',
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
  navItemActive: {
    backgroundColor: '#AD2C00',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  floatingButton: {
    position: 'absolute',
    bottom: 112,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
