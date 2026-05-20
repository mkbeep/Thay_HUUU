/**
 * Shared CORS origin rules for Express and Socket.IO
 */

import { config } from './env.config';

export const corsStaticOrigins = Array.isArray(config.cors.origin)
  ? config.cors.origin
  : [config.cors.origin].filter(Boolean);

export function isLanHttpOrigin(origin: string): boolean {
  return /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(
    origin
  );
}

/** ngrok free / paid public URLs */
export function isNgrokHttpOrigin(origin: string): boolean {
  return /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(ngrok-free\.app|ngrok\.io|ngrok\.app)(:\d+)?$/i.test(
    origin
  );
}

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (corsStaticOrigins.includes(origin)) return true;
  if (config.server.env !== 'production') {
    if (isLanHttpOrigin(origin)) return true;
    if (isNgrokHttpOrigin(origin)) return true;
  }
  return false;
}
