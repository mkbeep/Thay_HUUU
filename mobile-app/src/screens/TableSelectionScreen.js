import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTableSession } from '../store/slices/tableSlice';
import api from '../services/api';

export default function TableSelectionScreen({ navigation }) {
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSelectTable = async () => {
    if (!tableNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số bàn');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/tables/select', { tableNumber });
      const { tableId, sessionId } = response.data;

      // Lưu session vào AsyncStorage
      await AsyncStorage.setItem('tableId', tableId);
      await AsyncStorage.setItem('sessionId', sessionId);

      dispatch(setTableSession({
        tableId,
        sessionId,
        startTime: new Date().toISOString(),
      }));

      navigation.replace('Menu');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn bàn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến nhà hàng</Text>
      <Text style={styles.subtitle}>Vui lòng nhập số bàn của bạn</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Số bàn"
        value={tableNumber}
        onChangeText={setTableNumber}
        keyboardType="numeric"
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSelectTable}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Đang xử lý...' : 'Xác nhận'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
