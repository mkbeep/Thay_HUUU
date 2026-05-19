import { formatDistanceToNow, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatRelativeTime(dateInput: string | null | undefined): string {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60_000) {
    return 'Vừa xong';
  }

  if (isYesterday(date)) {
    return 'Hôm qua';
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: vi,
  });
}

export function getDefaultAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`;
}
