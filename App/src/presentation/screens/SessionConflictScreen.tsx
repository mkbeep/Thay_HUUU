import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTable } from '../context/TableContext';

interface SessionConflictScreenProps {
  onBack?: () => void;
}

export default function SessionConflictScreen({ onBack }: SessionConflictScreenProps) {
  const { tableNumber, conflictMinutes } = useTable();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Ionicons name="people" size={72} color="#AD2C00" />
      <Text style={styles.title}>Bàn đang có khách</Text>
      <Text style={styles.message}>
        Bàn {tableNumber ?? ''} đang được sử dụng
        {conflictMinutes != null ? ` (hoạt động ${conflictMinutes} phút trước)` : ''}.
        {'\n\n'}
        Nhân viên đã được thông báo qua hệ thống. Vui lòng chờ nhân viên xử lý hoặc liên hệ quầy.
      </Text>
      {onBack ? (
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#57534E',
    marginTop: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 32,
    backgroundColor: '#AD2C00',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
