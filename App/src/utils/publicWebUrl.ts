/** Bo qua trang canh bao ngrok free khi mo bang trinh duyet / quet QR */
export function appendNgrokBypassQuery(url: string): string {
  if (!/\.ngrok(-free)?\.(app|dev)\b/i.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  if (/ngrok-skip-browser-warning/i.test(url)) return url;
  return `${url}${sep}ngrok-skip-browser-warning=true`;
}

export function isNgrokHost(hostname: string): boolean {
  return /\.ngrok(-free)?\.(app|dev)$/i.test(hostname);
}

export const NGROK_SKIP_HEADER = 'ngrok-skip-browser-warning';
