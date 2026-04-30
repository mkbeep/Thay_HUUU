import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import WelcomeScreen from './src/presentation/screens/WelcomeScreen';
import HomeMenuScreen from './src/presentation/screens/HomeMenuScreen';

export default function App() {
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {!isWelcomeComplete ? (
          <WelcomeScreen
            tableNumber={12}
            onExploreMenu={() => setIsWelcomeComplete(true)}
            onViewDrinks={() => setIsWelcomeComplete(true)}
          />
        ) : (
          <HomeMenuScreen 
            tableNumber={12}
            onCartPress={() => console.log('Cart pressed')}
            onNavigate={(screen) => console.log('Navigate to:', screen)}
          />
        )}
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
