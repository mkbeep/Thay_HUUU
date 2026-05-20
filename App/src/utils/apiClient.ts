import axios from 'axios';
import { getApiBaseUrl } from './apiBaseUrl';
import { NGROK_SKIP_HEADER } from './publicWebUrl';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const base = getApiBaseUrl();
  if (/\.ngrok(-free)?\.(app|dev)\b/i.test(base)) {
    config.headers = config.headers ?? {};
    config.headers[NGROK_SKIP_HEADER] = 'true';
  }
  return config;
});
