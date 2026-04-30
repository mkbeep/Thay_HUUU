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

type Screen = 'welcome' | 'home' | 'cart' | 'detail' | 'orders';

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
