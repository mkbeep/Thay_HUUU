import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { CartProvider } from './src/presentation/context/CartContext';
import { OrderProvider } from './src/presentation/context/OrderContext';
import { TableProvider, useTable } from './src/presentation/context/TableContext';
import WelcomeScreen from './src/presentation/screens/WelcomeScreen';

// Wrapper components to use hooks
function WelcomeScreenWrapper({ onExploreMenu, onViewDrinks, onQRScan }: any) {
  const { tableNumber } = useTable();
  return (
    <WelcomeScreen
      tableNumber={tableNumber || undefined}
      onExploreMenu={onExploreMenu}
      onViewDrinks={onViewDrinks}
      onQRScan={onQRScan}
    />
  );
}

function HomeMenuScreenWrapper({ onCartPress, onNavigate, onMenuItemPress }: any) {
  const { tableNumber } = useTable();
  return (
    <HomeMenuScreen
      tableNumber={tableNumber || undefined}
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
      tableNumber={tableNumber || undefined}
      onBack={onBack}
      onSubmitOrder={onSubmitOrder}
    />
  );
}

function OrderHistoryScreenWrapper({ onBack, onPayment, onSupport }: any) {
  const { tableNumber } = useTable();
  return (
    <OrderHistoryScreen
      tableNumber={tableNumber || undefined}
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
      tableNumber={tableNumber || undefined}
      onBack={onBack}
      onPayment={onPayment}
    />
  );
}

function PaymentScreenWrapper({ onBack, onPaymentComplete }: any) {
  const { tableNumber } = useTable();
  return (
    <PaymentScreen
      tableNumber={tableNumber || undefined}
      onBack={onBack}
      onPaymentComplete={onPaymentComplete}
    />
  );
}

function SupportScreenWrapper({ onBack }: any) {
  const { tableNumber } = useTable();
  return (
    <SupportScreen
      tableNumber={tableNumber || undefined}
      onBack={onBack}
    />
  );
}

function SupportRequestScreenWrapper({ onBack, onNavigate, onRequestSent }: any) {
  const { tableNumber } = useTable();
  return (
    <SupportRequestScreen
      tableNumber={tableNumber || undefined}
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
      tableNumber={tableNumber || undefined}
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
      tableNumber={tableNumber || undefined}
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
  description?: string;
  category: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedItem, setSelectedItem] = useState<SelectedMenuItem | null>(null);
  const [requestType, setRequestType] = useState<string>('Yêu cầu hỗ trợ');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreenWrapper
            onExploreMenu={() => setCurrentScreen('home')}
            onViewDrinks={() => setCurrentScreen('home')}
            onQRScan={() => setCurrentScreen('qrScanner')}
          />
        );
      
      case 'home':
        return (
          <HomeMenuScreenWrapper
            onCartPress={() => setCurrentScreen('cart')}
            onNavigate={(screen) => {
              if (screen === 'orders') {
                setCurrentScreen('orders');
              } else if (screen === 'support') {
                setCurrentScreen('supportRequest');
              } else if (screen === 'table') {
                setCurrentScreen('table');
              }
            }}
            onMenuItemPress={(item) => {
              const priceNumber = parseFloat(item.price.replace('k', ''));
              setSelectedItem({
                id: item.id,
                name: item.name,
                price: priceNumber,
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
            onBack={() => setCurrentScreen('home')}
            onSubmitOrder={() => {
              console.log('Order submitted!');
              setCurrentScreen('orders');
            }}
          />
        );
      
      case 'orders':
        return (
          <OrderHistoryScreenWrapper
            onBack={() => setCurrentScreen('home')}
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
            onPaymentComplete={() => {
              setCurrentScreen('home');
            }}
          />
        );
      
      case 'detail':
        return selectedItem ? (
          <MenuItemDetailScreen
            item={selectedItem}
            onBack={() => setCurrentScreen('home')}
            onAddToCart={() => setCurrentScreen('cart')}
          />
        ) : null;
      
      case 'supportRequest':
        return (
          <SupportRequestScreenWrapper
            onBack={() => setCurrentScreen('home')}
            onNavigate={(screen) => {
              if (screen === 'explore') {
                setCurrentScreen('home');
              } else if (screen === 'orders') {
                setCurrentScreen('orders');
              } else if (screen === 'table') {
                setCurrentScreen('table');
              }
            }}
            onRequestSent={(type) => {
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
            onNavigate={(screen) => {
              if (screen === 'explore') {
                setCurrentScreen('home');
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
            onBack={() => setCurrentScreen('home')}
            onNavigate={(screen) => {
              if (screen === 'explore') {
                setCurrentScreen('home');
              } else if (screen === 'orders') {
                setCurrentScreen('orders');
              } else if (screen === 'support') {
                setCurrentScreen('supportRequest');
              }
            }}
            onPayment={() => setCurrentScreen('summary')}
            onQRScan={() => setCurrentScreen('qrScanner')}
          />
        );
      
      case 'qrScanner':
        return (
          <QRScannerScreen
            onSuccess={(tableNum) => {
              console.log('✅ QR scan successful - Navigating to table view');
              setCurrentScreen('table');
            }}
            onCancel={() => setCurrentScreen('table')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <TableProvider>
        <OrderProvider>
          <CartProvider>
            <NavigationContainer>
              {renderScreen()}
              <StatusBar style="dark" />
            </NavigationContainer>
          </CartProvider>
        </OrderProvider>
      </TableProvider>
    </SafeAreaProvider>
  );
}
