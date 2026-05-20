/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_CUSTOMER_WEB_URL?: string;
  /** URL gốc web khách (Expo Web trong App / `web-app`); dev thường http://localhost:8081 */
  readonly VITE_CUSTOMER_WEB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
