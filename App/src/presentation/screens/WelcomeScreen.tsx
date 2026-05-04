import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { IMAGES } from '../../domain/constants/images';

interface WelcomeScreenProps {
  tableNumber?: number;
  onExploreMenu: () => void;
  onViewDrinks: () => void;
  onQRScan?: () => void;
}

export default function WelcomeScreen({ 
  tableNumber, 
  onExploreMenu,
  onViewDrinks,
  onQRScan
}: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={24} color="#C2410C" />
          <Text style={styles.headerTitle}>Gourmet Tech</Text>
        </View>
        <TouchableOpacity style={styles.languageButton}>
          <Ionicons name="language" size={24} color="#78716C" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Background Image */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={IMAGES.hero.welcomeBanner || {
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxxoc1rGNFxwCoY3tmMsoqGdmoOlkcnd5n8A5pVMekOdHHMhbRUI3b7a6V4Q5grF1vq0la5TZiVivoG1eDJFN9104Qp9yFdISWbF6386-njZy2e8Gr8Ir8xrqIlK_LiHXhZfeHjBTK2uMjQ5MHcwCWO6kfGALmY6ys_NkhrnUzorOmAkyQhseO6YqyOrkOQhyUYdEfpAeoCnQ52VJSDLQBaWrXejpm7klJxNP9RUdnwRp9nWULAO0yQJn48xEo3YdT7SSbrZHR5w',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(252, 249, 248, 0.6)', '#FCF9F8']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                {/* Location Badge */}
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={14} color="#AD2C00" />
                  <Text style={styles.locationText}>DÙNG BỮA TẠI NHÀ HÀNG</Text>
                </View>

                {/* Table Number or QR Scan */}
                {tableNumber ? (
                  <Text style={styles.tableNumber}>Bàn {tableNumber}</Text>
                ) : (
                  <TouchableOpacity 
                    style={styles.qrScanButton}
                    onPress={onQRScan}
                  >
                    <Ionicons name="qr-code" size={32} color="#AD2C00" />
                    <Text style={styles.qrScanText}>Quét mã QR bàn</Text>
                  </TouchableOpacity>
                )}
                
                {/* Welcome Text */}
                <Text style={styles.welcomeText}>Chào mừng đến Gourmet Tech</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.contentContainer}>
            {/* Description */}
            <Text style={styles.description}>
              Trải nghiệm thực đơn theo mùa được chế biến tỉ mỉ. Hệ thống đặt món thông minh của chúng tôi sẵn sàng hướng dẫn bạn qua các món đặc biệt hôm nay.
            </Text>

            {/* Feature Cards */}
            <View style={styles.featureGrid}>
              <View style={styles.featureCard}>
                <Ionicons name="sparkles" size={24} color="#AD2C00" />
                <Text style={styles.featureText}>Món đặc biệt hàng ngày</Text>
              </View>
              <View style={styles.featureCard}>
                <Ionicons name="leaf" size={24} color="#006A35" />
                <Text style={styles.featureText}>Nguyên liệu tươi sống</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={onExploreMenu}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#AD2C00', '#D83900']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>Khám phá thực đơn</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={onViewDrinks}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Xem danh sách đồ uống</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerBadge}>
            <Ionicons name="qr-code" size={14} color="#A8A29E" />
            <Text style={styles.footerText}>KHÔNG CẦN ĐĂNG NHẬP - CHỈ CẦN QUÉT VÀ THƯỞNG THỨC</Text>
          </View>
          <View style={styles.footerIndicator} />
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1B1B',
    letterSpacing: -0.5,
  },
  languageButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    height: 500,
    width: '100%',
  },
  heroImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5F5E5E',
    letterSpacing: 1.5,
  },
  tableNumber: {
    fontFamily: 'System',
    fontSize: 56,
    fontWeight: '900',
    color: '#1C1B1B',
    marginBottom: 8,
    letterSpacing: -2,
  },
  qrScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#AD2C00',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  qrScanText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#AD2C00',
  },
  welcomeText: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    color: '#AD2C00',
    lineHeight: 28,
  },
  contentSection: {
    backgroundColor: '#FCF9F8',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 120,
  },
  contentContainer: {
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#5F5E5E',
    marginBottom: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#F6F3F2',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  actionButtons: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    backgroundColor: '#EAE7E7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1B1B',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerContent: {
    alignItems: 'center',
    gap: 16,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 1.5,
  },
  footerIndicator: {
    width: 48,
    height: 4,
    backgroundColor: '#E5E2E1',
    borderRadius: 2,
  },
});
