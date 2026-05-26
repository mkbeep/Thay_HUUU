import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InlineToastProps {
  visible: boolean;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function InlineToast({
  visible,
  message,
  icon = 'checkmark-circle',
}: InlineToastProps) {
  if (!visible || !message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={20} color="#AD2C00" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(173, 44, 0, 0.25)',
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#AD2C00',
    lineHeight: 18,
  },
});
