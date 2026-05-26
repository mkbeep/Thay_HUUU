import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const FINGERPRINT_KEY = '@restaurant_device_fingerprint';

function generateFingerprint(): string {
  return `fp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}_${Platform.OS}`;
}

export async function getDeviceFingerprint(): Promise<string> {
  try {
    let fp = await AsyncStorage.getItem(FINGERPRINT_KEY);
    if (!fp && typeof window !== 'undefined' && window.localStorage) {
      fp = window.localStorage.getItem(FINGERPRINT_KEY);
    }
    if (!fp) {
      fp = generateFingerprint();
      await AsyncStorage.setItem(FINGERPRINT_KEY, fp);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(FINGERPRINT_KEY, fp);
      }
    }
    return fp;
  } catch {
    return generateFingerprint();
  }
}
