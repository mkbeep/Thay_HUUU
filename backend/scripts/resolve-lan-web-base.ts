import os from 'os';

function getLanIp(): string | null {
  const interfaces = os.networkInterfaces();
  const preferred = ['en0', 'Wi-Fi', 'wlan0', 'eth0'];
  const names = [...preferred, ...Object.keys(interfaces)];

  for (const name of names) {
    for (const address of interfaces[name] || []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
}

function shouldUseLanIp(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

export function resolveCustomerWebBaseUrl(rawBase?: string): string {
  const fallback = 'http://localhost:8081';
  const base = (rawBase || fallback).replace(/\/+$/, '');
  const lanIp = getLanIp();
  if (!lanIp) return base;

  try {
    const url = new URL(base);
    if (shouldUseLanIp(url.hostname)) {
      url.hostname = lanIp;
      return url.toString().replace(/\/+$/, '');
    }
  } catch {
    return base;
  }

  return base;
}
