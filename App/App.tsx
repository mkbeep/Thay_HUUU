import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { CartProvider } from './src/presentation/context/CartContext';
import { OrderProvider } from './src/presentation/context/OrderContext';
import WelcomeScreen from './src/presentation/screens/WelcomeScreen';
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

type Screen = 'welcome' | 'home' | 'cart' | 'detail' | 'orders' | 'summary' | 'payment' | 'support' | 'supportRequest' | 'table' | 'staffComing';

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
          <WelcomeScreen
            tableNumber={12}
            onExploreMenu={() => setCurrentScreen('home')}
            onViewDrinks={() => setCurrentScreen('home')}
          />
        );
      
      case 'home':
        return (
          <HomeMenuScreen 
            tableNumber={12}
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
              // Chuyển đổi MenuItem sang SelectedMenuItem
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
          <CartScreen
            tableNumber={12}
            onBack={() => setCurrentScreen('home')}
            onSubmitOrder={() => {
              console.log('Order submitted!');
              setCurrentScreen('orders');
            }}
          />
        );
      
      case 'orders':
        return (
          <OrderHistoryScreen
            tableNumber={12}
            onBack={() => setCurrentScreen('home')}
            onPayment={() => setCurrentScreen('summary')}
            onSupport={() => setCurrentScreen('support')}
          />
        );
      
      case 'support':
        return (
          <SupportScreen
            tableNumber={12}
            onBack={() => setCurrentScreen('orders')}
          />
        );
      
      case 'summary':
        return (
          <OrderSummaryScreen
            tableNumber={12}
            onBack={() => setCurrentScreen('orders')}
            onPayment={() => setCurrentScreen('payment')}
          />
        );
      
      case 'payment':
        return (
          <PaymentScreen
            tableNumber={12}
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
          <SupportRequestScreen
            tableNumber={12}
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
          <StaffComingScreen
            tableNumber={12}
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
          <MyTableScreen
            tableNumber={12}
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
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <OrderProvider>
        <CartProvider>
          <NavigationContainer>
            {renderScreen()}
            <StatusBar style="dark" />
          </NavigationContainer>
        </CartProvider>
      </OrderProvider>
    </SafeAreaProvider>
  );
}
