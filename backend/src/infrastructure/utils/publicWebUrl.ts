export function appendNgrokBypassQuery(url: string): string {
  if (!/\.ngrok(-free)?\.(app|dev)\b/i.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  if (/ngrok-skip-browser-warning/i.test(url)) return url;
  return `${url}${sep}ngrok-skip-browser-warning=true`;
}
