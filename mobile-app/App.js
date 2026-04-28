import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { store } from './src/store';
import TableSelectionScreen from './src/screens/TableSelectionScreen';
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';
import OrderStatusScreen from './src/screens/OrderStatusScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="TableSelection">
          <Stack.Screen 
            name="TableSelection" 
            component={TableSelectionScreen}
            options={{ title: 'Chọn bàn' }}
          />
          <Stack.Screen 
            name="Menu" 
            component={MenuScreen}
            options={{ title: 'Thực đơn' }}
          />
          <Stack.Screen 
            name="Cart" 
            component={CartScreen}
            options={{ title: 'Giỏ hàng' }}
          />
          <Stack.Screen 
            name="OrderStatus" 
            component={OrderStatusScreen}
            options={{ title: 'Đơn hàng của bạn' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
