/**
 * Normalize Firestore Timestamp / ISO string to Date
 */
export function toDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  const v = value as { toDate?: () => Date; _seconds?: number };
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v._seconds === 'number') return new Date(v._seconds * 1000);
  return new Date(value as string | number);
}
