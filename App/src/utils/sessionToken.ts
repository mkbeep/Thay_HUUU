import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_TOKEN_KEY = '@restaurant_session_token';

export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }
  return AsyncStorage.getItem(SESSION_TOKEN_KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
  await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
}
