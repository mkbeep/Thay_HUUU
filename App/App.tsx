// Polyfills for socket.io-client
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React, { useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { CartProvider } from './src/presentation/context/CartContext';
import { OrderProvider } from './src/presentation/context/OrderContext';
import { TableProvider, useTable } from './src/presentation/context/TableContext';
import WelcomeScreen from './src/presentation/screens/WelcomeScreen';
import { buildCustomerTableWebUrl, getCustomerWebRootUrl } from './src/utils/customerWebUrl';
import { resolveWebTableBootstrapHref, urlSignalsCustomerTable } from './src/utils/parseCustomerTableUrl';

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
  const { tableNumber } = useTable();
  return (
    <CartScreen
      tableNumber={tableNumber ?? undefined}
      onBack={onBack}
      onSubmitOrder={onSubmitOrder}
    />
  );
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
  const { tableNumber } = useTable();
  return (
    <SupportScreen
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

function StaffComingScreenWrapper({ requestId, requestType, onBack, onNavigate, onResolved }: any) {
  const { tableNumber } = useTable();
  return (
    <StaffComingScreen
      tableNumber={tableNumber ?? undefined}
      requestId={requestId}
      requestType={requestType}
      onBack={onBack}
      onNavigate={onNavigate}
      onResolved={onResolved}
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
import SessionConflictScreen from './src/presentation/screens/SessionConflictScreen';

type Screen = 'welcome' | 'home' | 'cart' | 'detail' | 'orders' | 'summary' | 'payment' | 'support' | 'supportRequest' | 'table' | 'staffComing' | 'qrScanner' | 'sessionConflict';

interface SelectedMenuItem {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  image: any;
  description?: string;
  category: string;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TableProvider>
        <OrderProvider>
          <CartProvider>
            <NavigationContainer>
              <AppScreens />
              <StatusBar style="dark" />
            </NavigationContainer>
          </CartProvider>
        </OrderProvider>
      </TableProvider>
    </SafeAreaProvider>
  );
}

function AppScreens() {
  const { tableNumber, tableId, isLoading, sessionConflict } = useTable();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [qrReturnScreen, setQrReturnScreen] = useState<Screen>('welcome');
  const [selectedItem, setSelectedItem] = useState<SelectedMenuItem | null>(null);
  const [requestType, setRequestType] = useState<string>('Yêu cầu hỗ trợ');
  const [supportRequestId, setSupportRequestId] = useState<string | undefined>();
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

  if (sessionConflict) {
    return (
      <SessionConflictScreen
        onBack={() => setCurrentScreen('welcome')}
      />
    );
  }

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
              setSelectedItem({
                id: item.id,
                name: item.name,
                price: item.priceValue,
                priceDisplay: item.price,
                image: item.image,
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
            onRequestSent={(type: string, requestId?: string) => {
              setRequestType(type);
              setSupportRequestId(requestId);
              setCurrentScreen('staffComing');
            }}
          />
        );
      
      case 'staffComing':
        return (
          <StaffComingScreenWrapper
            requestId={supportRequestId}
            requestType={requestType}
            onBack={() => setCurrentScreen('supportRequest')}
            onResolved={openCustomerWeb}
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
