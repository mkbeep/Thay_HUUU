// Polyfills for socket.io-client
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { CartProvider } from './src/presentation/context/CartContext';
import { OrderProvider, useOrder } from './src/presentation/context/OrderContext';
import { TableProvider, useTable } from './src/presentation/context/TableContext';
import WelcomeScreen from './src/presentation/screens/WelcomeScreen';
import { buildCustomerTableWebUrl, getCustomerWebRootUrl } from './src/utils/customerWebUrl';
import { resolveWebTableBootstrapHref, urlSignalsCustomerTable } from './src/utils/parseCustomerTableUrl';
import { socketService } from './src/services/socketService';
import { MenuRepository } from './src/data/repositories/MenuRepository';

// Wrapper components to use hooks
function WelcomeScreenWrapper({ onExploreMenu, onViewDrinks, onQRScan }: any) {
  const { tableNumber } = useTable();
  return (
    <WelcomeScreen
      tableNumber={tableNumber ?? undefined}
      onExploreMenu={onExploreMenu}
      onViewDrinks={onViewDrinks}
      onQRScan={onQRScan}
    />
  );
}

function HomeMenuScreenWrapper({ onCartPress, onNavigate, onMenuItemPress }: any) {
  // HomeMenuScreen đã tự lấy tableNumber từ useTable() context
  return (
    <HomeMenuScreen
      onCartPress={onCartPress}
      onNavigate={onNavigate}
      onMenuItemPress={onMenuItemPress}
    />
  );
}

function CartScreenWrapper({ onBack, onSubmitOrder }: any) {
  const { tableNumber, sessionId } = useTable();
  return (
    <CartScreen
      tableNumber={tableNumber ?? undefined}
      tableSessionId={sessionId}
      onBack={onBack}
      onSubmitOrder={onSubmitOrder}
    />
  );
}

/** Khi đổi bàn: xóa đơn local ngay (tránh hiển thị đơn bàn A khi đang ở bàn B). */
function TableDataIsolationBridge() {
  const { tableId, isLoading } = useTable();
  const { clearLocalOrders } = useOrder();
  const prevTableId = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (isLoading) return;
    const next = tableId != null ? String(tableId) : null;
    if (prevTableId.current !== null && next !== null && prevTableId.current !== next) {
      clearLocalOrders();
    }
    prevTableId.current = next;
  }, [isLoading, tableId, clearLocalOrders]);

  return null;
}

/** Remount giỏ hàng theo bàn — tách hoàn toàn state giỏ giữa các bàn. */
function KeyedCartProvider({ children }: { children: React.ReactNode }) {
  const { tableId } = useTable();
  return <CartProvider key={tableId != null ? String(tableId) : '__no_table__'}>{children}</CartProvider>;
}

/** Đồng bộ đơn từ server khi đã có bàn (reload trình duyệt / quét lại QR) */
function OrderHydrationBridge() {
  const { tableNumber, sessionId, isLoading } = useTable();
  const { hydrateOrdersFromServer } = useOrder();

  useEffect(() => {
    if (isLoading) return;
    const sid = sessionId?.trim();
    const num =
      tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== ''
        ? String(tableNumber).trim()
        : '';
    const key = sid || num;
    if (!key) return;
    void hydrateOrdersFromServer(key, tableNumber ?? num);
  }, [isLoading, sessionId, tableNumber, hydrateOrdersFromServer]);

  return null;
}

/** WebSocket menu: server đã emit `menu:updated` toàn cục — kết nối theo bàn để nhận và làm mới cache menu khách. */
function MenuRealtimeBridge() {
  const { sessionId, tableNumber, isLoading } = useTable();

  useEffect(() => {
    if (isLoading) return;
    const sid = sessionId?.trim();
    const num =
      tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== ''
        ? String(tableNumber).trim()
        : '';
    const key = sid || num;
    if (!key) return;

    const pushMenuRefresh = async () => {
      try {
        const repo = new MenuRepository();
        await repo.clearCache();
        DeviceEventEmitter.emit('menu:invalidate');
      } catch (e) {
        console.error('MenuRealtimeBridge: clear cache failed', e);
      }
    };

    socketService.connect(key);
    socketService.joinTable(key);

    const onMenuUpdated = () => {
      void pushMenuRefresh();
    };
    const onMenuRemoved = () => {
      void pushMenuRefresh();
    };
    const onMenuAdded = () => {
      void pushMenuRefresh();
    };

    socketService.on('menu:updated', onMenuUpdated);
    socketService.on('menu:item_removed', onMenuRemoved);
    socketService.on('menu:item_added', onMenuAdded);

    return () => {
      socketService.off('menu:updated', onMenuUpdated);
      socketService.off('menu:item_removed', onMenuRemoved);
      socketService.off('menu:item_added', onMenuAdded);
    };
  }, [isLoading, sessionId, tableNumber]);

  return null;
}

function OrderHistoryScreenWrapper({ onBack, onPayment, onSupport }: any) {
  const { tableNumber } = useTable();
  return (
    <OrderHistoryScreen
      tableNumber={tableNumber ?? undefined}
      onBack={onBack}
      onPayment={onPayment}
      onSupport={onSupport}
    />
  );
}

function OrderSummaryScreenWrapper({ onBack, onPayment }: any) {
  const { tableNumber } = useTable();
  return (
    <OrderSummaryScreen
      tableNumber={tableNumber ?? undefined}
      onBack={onBack}
      onPayment={onPayment}
    />
  );
}

function PaymentScreenWrapper({ onBack, onPaymentComplete }: any) {
  const { tableNumber } = useTable();
  return (
    <PaymentScreen
      tableNumber={tableNumber ?? undefined}
      onBack={onBack}
      onPaymentComplete={onPaymentComplete}
    />
  );
}

function SupportScreenWrapper({ onBack }: any) {
  const { tableNumber, tableId } = useTable();
  return (
    <SupportScreen
      tableId={tableId}
      tableNumber={tableNumber ?? undefined}
      onBack={onBack}
    />
  );
}

function SupportRequestScreenWrapper({ onBack, onNavigate, onRequestSent }: any) {
  const { tableNumber } = useTable();
  return (
    <SupportRequestScreen
      tableNumber={tableNumber ?? undefined}
      onBack={onBack}
      onNavigate={onNavigate}
      onRequestSent={onRequestSent}
    />
  );
}

function StaffComingScreenWrapper({ requestType, onBack, onNavigate }: any) {
  const { tableNumber } = useTable();
  return (
    <StaffComingScreen
      tableNumber={tableNumber ?? undefined}
      requestType={requestType}
      onBack={onBack}
      onNavigate={onNavigate}
    />
  );
}

function MyTableScreenWrapper({ onBack, onNavigate, onPayment, onQRScan }: any) {
  const { tableNumber } = useTable();
  return (
    <MyTableScreen
      tableNumber={tableNumber ?? undefined}
      onBack={onBack}
      onNavigate={onNavigate}
      onPayment={onPayment}
      onQRScan={onQRScan}
    />
  );
}
import HomeMenuScreen from './src/presentation/screens/HomeMenuScreen';
import CartScreen from './src/presentation/screens/CartScreen';
import MenuItemDetailScreen from './src/presentation/screens/MenuItemDetailScreen';
import OrderHistoryScreen from './src/presentation/screens/OrderHistoryScreen';
import OrderSummaryScreen from './src/presentation/screens/OrderSummaryScreen';
import PaymentScreen from './src/presentation/screens/PaymentScreen';
import SupportScreen from './src/presentation/screens/SupportScreen';
import SupportRequestScreen from './src/presentation/screens/SupportRequestScreen';
import MyTableScreen from './src/presentation/screens/MyTableScreen';
import StaffComingScreen from './src/presentation/screens/StaffComingScreen';
import QRScannerScreen from './src/presentation/screens/QRScannerScreen';

type Screen = 'welcome' | 'home' | 'cart' | 'detail' | 'orders' | 'summary' | 'payment' | 'support' | 'supportRequest' | 'table' | 'staffComing' | 'qrScanner';

interface SelectedMenuItem {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  image: any;
  imageUrl?: string;
  description?: string;
  category: string;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TableProvider>
        <OrderProvider>
          <TableDataIsolationBridge />
          <KeyedCartProvider>
            <OrderHydrationBridge />
            <MenuRealtimeBridge />
            <NavigationContainer>
              <AppScreens />
              <StatusBar style="dark" />
            </NavigationContainer>
          </KeyedCartProvider>
        </OrderProvider>
      </TableProvider>
    </SafeAreaProvider>
  );
}

function AppScreens() {
  const { tableNumber, tableId, isLoading } = useTable();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [qrReturnScreen, setQrReturnScreen] = useState<Screen>('welcome');
  const [selectedItem, setSelectedItem] = useState<SelectedMenuItem | null>(null);
  const [requestType, setRequestType] = useState<string>('Yêu cầu hỗ trợ');
  const didWebTableDeepLink = useRef(false);

  // ✅ Lắng nghe event thanh toán hoàn tất
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    
    const handlePaymentCompleted = () => {
      console.log('🏠 Payment completed event received - navigating to home');
      openCustomerWeb();
    };
    
    window.addEventListener('payment:completed', handlePaymentCompleted);
    
    return () => {
      window.removeEventListener('payment:completed', handlePaymentCompleted);
    };
  }, [tableNumber, tableId]);

  /** Web: cùng codebase Expo Web (không mở tab ngoài). Native: mở trình duyệt tới URL bản web đã deploy. */
  const openCustomerWeb = () => {
    console.log('🔍 openCustomerWeb called', { 
      platform: Platform.OS, 
      tableNumber, 
      tableId,
      currentScreen 
    });
    
    if (Platform.OS === 'web') {
      if (tableNumber != null && tableId) {
        console.log('✅ Setting screen to home (web with table)');
        setCurrentScreen('home');
        return;
      }
      if (typeof window !== 'undefined') {
        const deep = resolveWebTableBootstrapHref();
        // Đang ở link bàn (từ QR in) nhưng context chưa có bàn — không được gán về / (sẽ mất tid). Tải lại để bootstrap API chạy lại.
        if (urlSignalsCustomerTable(deep)) {
          console.log('🔄 Reloading page for table bootstrap');
          window.location.reload();
          return;
        }
        console.log('🔄 Redirecting to customer web root');
        window.location.assign(getCustomerWebRootUrl());
      }
      return;
    }
    const url =
      tableNumber != null && tableId
        ? buildCustomerTableWebUrl(tableNumber, tableId)
        : getCustomerWebRootUrl();
    console.log('📱 Opening URL (native):', url);
    void Linking.openURL(url);
    setCurrentScreen('welcome');
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isLoading || didWebTableDeepLink.current) return;
    if (tableNumber == null || !tableId) return;
    const tableHref = resolveWebTableBootstrapHref();
    if (!urlSignalsCustomerTable(tableHref)) return;
    didWebTableDeepLink.current = true;
    setCurrentScreen('home');
  }, [isLoading, tableNumber, tableId]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreenWrapper
            onExploreMenu={openCustomerWeb}
            onViewDrinks={openCustomerWeb}
            onQRScan={
              Platform.OS === 'web'
                ? undefined
                : () => {
                    setQrReturnScreen('welcome');
                    setCurrentScreen('qrScanner');
                  }
            }
          />
        );
      
      case 'home':
        return (
          <HomeMenuScreenWrapper
            onCartPress={() => setCurrentScreen('cart')}
            onNavigate={(screen: string) => {
              if (screen === 'orders') {
                setCurrentScreen('orders');
              } else if (screen === 'support') {
                setCurrentScreen('supportRequest');
              } else if (screen === 'table') {
                setCurrentScreen('table');
              }
            }}
            onMenuItemPress={(item: any) => {
              const priceNumber = parseFloat(item.price.replace('k', ''));
              setSelectedItem({
                id: item.id,
                name: item.name,
                price: priceNumber,
                priceDisplay: item.price,
                image: item.image,
                imageUrl: item.imageUrl,
                description: item.description,
                category: item.category,
              });
              setCurrentScreen('detail');
            }}
          />
        );
      
      case 'cart':
        return (
          <CartScreenWrapper
            onBack={openCustomerWeb}
            onSubmitOrder={() => {
              console.log('✅ Order submitted successfully! Navigating to order history...');
              // Chuyển đến màn hình OrderHistory để khách xem trạng thái và có thể hủy món
              setCurrentScreen('orders');
            }}
          />
        );
      
      case 'orders':
        return (
          <OrderHistoryScreenWrapper
            onBack={openCustomerWeb}
            onPayment={() => setCurrentScreen('summary')}
            onSupport={() => setCurrentScreen('support')}
          />
        );
      
      case 'support':
        return (
          <SupportScreenWrapper
            onBack={() => setCurrentScreen('orders')}
          />
        );
      
      case 'summary':
        return (
          <OrderSummaryScreenWrapper
            onBack={() => setCurrentScreen('orders')}
            onPayment={() => setCurrentScreen('payment')}
          />
        );
      
      case 'payment':
        return (
          <PaymentScreenWrapper
            onBack={() => setCurrentScreen('summary')}
            onPaymentComplete={openCustomerWeb}
          />
        );
      
      case 'detail':
        return selectedItem ? (
          <MenuItemDetailScreen
            item={selectedItem}
            onBack={openCustomerWeb}
            onAddToCart={() => setCurrentScreen('cart')}
          />
        ) : null;
      
      case 'supportRequest':
        return (
          <SupportRequestScreenWrapper
            onBack={openCustomerWeb}
            onNavigate={(screen: string) => {
              if (screen === 'explore') {
                openCustomerWeb();
              } else if (screen === 'orders') {
                setCurrentScreen('orders');
              } else if (screen === 'table') {
                setCurrentScreen('table');
              }
            }}
            onRequestSent={(type: string) => {
              setRequestType(type);
              setCurrentScreen('staffComing');
            }}
          />
        );
      
      case 'staffComing':
        return (
          <StaffComingScreenWrapper
            requestType={requestType}
            onBack={() => setCurrentScreen('supportRequest')}
            onNavigate={(screen: string) => {
              if (screen === 'explore') {
                openCustomerWeb();
              } else if (screen === 'orders') {
                setCurrentScreen('orders');
              } else if (screen === 'table') {
                setCurrentScreen('table');
              }
            }}
          />
        );
      
      case 'table':
        return (
          <MyTableScreenWrapper
            onBack={openCustomerWeb}
            onNavigate={(screen: string) => {
              if (screen === 'explore') {
                openCustomerWeb();
              } else if (screen === 'orders') {
                setCurrentScreen('orders');
              } else if (screen === 'support') {
                setCurrentScreen('supportRequest');
              }
            }}
            onPayment={() => setCurrentScreen('summary')}
            onQRScan={
              Platform.OS === 'web'
                ? undefined
                : () => {
                    setQrReturnScreen('table');
                    setCurrentScreen('qrScanner');
                  }
            }
          />
        );
      
      case 'qrScanner':
        return (
          <QRScannerScreen
            onCancel={() => setCurrentScreen(qrReturnScreen)}
          />
        );
      
      default:
        return null;
    }
  };

  return renderScreen();
}
