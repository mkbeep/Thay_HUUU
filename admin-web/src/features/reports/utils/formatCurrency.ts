export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatGrowth(percent: number | null): string {
  if (percent === null) return '';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent}%`;
}
