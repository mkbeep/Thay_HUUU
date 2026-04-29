import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import WelcomeScreen from './src/presentation/screens/WelcomeScreen';
import MenuScreen from './src/presentation/screens/MenuScreen';
import OrdersScreen from './src/presentation/screens/OrdersScreen';
import TablesScreen from './src/presentation/screens/TablesScreen';
import StatsScreen from './src/presentation/screens/StatsScreen';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#AD2C00',
        tabBarInactiveTintColor: '#78716C',
        headerStyle: {
          backgroundColor: '#AD2C00',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Menu" 
        component={MenuScreen}
        options={{ 
          title: 'Thực đơn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ 
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Tables" 
        component={TablesScreen}
        options={{ 
          title: 'Bàn ăn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ 
          title: 'Thống kê',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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
          <MainTabs />
        )}
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
