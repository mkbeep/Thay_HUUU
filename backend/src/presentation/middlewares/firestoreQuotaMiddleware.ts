import { Request, Response, NextFunction } from 'express';

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

let quotaBlockedUntil = 0;

export function isFirestoreQuotaError(err: any): boolean {
  return Boolean(err?.message?.includes('RESOURCE_EXHAUSTED') || err?.code === 8);
}

export function markFirestoreQuotaExceeded(cooldownMs = DEFAULT_COOLDOWN_MS): void {
  quotaBlockedUntil = Math.max(quotaBlockedUntil, Date.now() + cooldownMs);
}

export function isFirestoreQuotaCoolingDown(): boolean {
  return Date.now() < quotaBlockedUntil;
}

export function getFirestoreQuotaRetryAfterSeconds(): number {
  if (!isFirestoreQuotaCoolingDown()) return 0;
  return Math.max(1, Math.ceil((quotaBlockedUntil - Date.now()) / 1000));
}

export function firestoreQuotaMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.endsWith('/health') || req.path.endsWith('/auth/login') || Date.now() >= quotaBlockedUntil) {
    next();
    return;
  }

  const retryAfterSeconds = getFirestoreQuotaRetryAfterSeconds();
  res.setHeader('Retry-After', String(retryAfterSeconds));
  res.status(429).json({
    success: false,
    message:
      'Firestore quota da vuot gioi han. Server dang tam dung goi Firestore de tranh spam request. Vui long doi quota reset hoac doi Firebase project/plan.',
    retry_after_seconds: retryAfterSeconds,
  });
}
