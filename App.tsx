import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { CartProvider } from './src/presentation/context/CartContext';
import WelcomeScreen from './src/presentation/screens/WelcomeScreen';
import HomeMenuScreen from './src/presentation/screens/HomeMenuScreen';
import CartScreen from './src/presentation/screens/CartScreen';

type Screen = 'welcome' | 'home' | 'cart';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

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
            onNavigate={(screen) => console.log('Navigate to:', screen)}
          />
        );
      
      case 'cart':
        return (
          <CartScreen
            tableNumber={12}
            onBack={() => setCurrentScreen('home')}
            onSubmitOrder={() => {
              console.log('Order submitted!');
              setCurrentScreen('home');
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          {renderScreen()}
          <StatusBar style="dark" />
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
