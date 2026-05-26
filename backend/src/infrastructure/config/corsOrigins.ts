import { config } from './env.config';

const corsStaticOrigins = Array.isArray(config.cors.origin)
  ? config.cors.origin
  : ([config.cors.origin].filter(Boolean) as string[]);

export function isLanHttpOrigin(origin: string): boolean {
  return /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(
    origin
  );
}

export function isLoopbackHttpOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
}

/** Cùng quy tắc với Express CORS — dùng cho Socket.IO */
export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (config.server.env !== 'production' && origin === 'null') return true;
  if (corsStaticOrigins.includes(origin)) return true;
  if (config.server.env !== 'production' && isLoopbackHttpOrigin(origin)) return true;
  if (config.server.env !== 'production' && isLanHttpOrigin(origin)) return true;
  return false;
}

export function getCorsOriginCallback(): (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => void {
  return (origin, callback) => {
    callback(null, isCorsOriginAllowed(origin));
  };
}
