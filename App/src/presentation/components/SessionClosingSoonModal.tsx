import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SessionClosingSoonModalProps {
  visible: boolean;
  secondsLeft?: number;
  loading?: boolean;
  onContinue: () => void;
  onEnd: () => void;
}

export default function SessionClosingSoonModal({
  visible,
  secondsLeft,
  loading = false,
  onContinue,
  onEnd,
}: SessionClosingSoonModalProps) {
  const minutes = secondsLeft != null ? Math.max(1, Math.ceil(secondsLeft / 60)) : 2;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name="time-outline" size={48} color="#AD2C00" />
          <Text style={styles.title}>Sắp kết thúc phiên bàn</Text>
          <Text style={styles.message}>
            Bạn đã thanh toán xong. Bàn sẽ tự đóng sau khoảng {minutes} phút nếu không có thêm
            hoạt động. Bạn có muốn tiếp tục gọi món hoặc ở lại thêm không?
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={onContinue}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryText}>Tiếp tục</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onEnd}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryText}>Kết thúc</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFBF5',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#57534E',
    marginTop: 12,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#006A35',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 12,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6D3D1',
  },
  secondaryText: {
    color: '#57534E',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
