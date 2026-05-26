/**
 * Phân tích URL thực đơn bàn (trùng quy ước backend `buildTableWebUrl`).
 * Dùng khi quét QR hoặc khi web load `/table/...?tid=...`.
 */

export type ParsedCustomerTableUrl = {
  tableNumber: string | null;
  tableId: string | null;
  qrToken: string | null;
};

export function parseCustomerTableUrl(raw: string): ParsedCustomerTableUrl {
  const s = raw?.trim() ?? '';
  if (!s || !/^https?:\/\//i.test(s)) {
    return { tableNumber: null, tableId: null, qrToken: null };
  }
  try {
    const url = new URL(s);
    const tid =
      url.searchParams.get('tid')?.trim() ||
      url.searchParams.get('tableId')?.trim() ||
      url.searchParams.get('table_id')?.trim() ||
      null;
    const qrToken =
      url.searchParams.get('qrt')?.trim() ||
      url.searchParams.get('qrToken')?.trim() ||
      url.searchParams.get('qr_token')?.trim() ||
      null;

    const fromQuery =
      url.searchParams.get('table') ||
      url.searchParams.get('tableNumber') ||
      url.searchParams.get('n');
    if (fromQuery) {
      const n = decodeURIComponent(fromQuery.trim()) || null;
      return { tableNumber: n, tableId: tid, qrToken };
    }

    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => ['table', 't', 'ban'].includes(p.toLowerCase()));
    const pathNum: string | null =
      idx >= 0 && parts[idx + 1] ? decodeURIComponent(parts[idx + 1]) : null;
    return { tableNumber: pathNum, tableId: tid, qrToken };
  } catch {
    return { tableNumber: null, tableId: null, qrToken: null };
  }
}

/**
 * Trên web, bàn có thể nằm trong hash (`/#/table/T01?tid=...`) — pathname chính vẫn là `/`.
 * Gộp lại thành một href có thể parse bằng `parseCustomerTableUrl`.
 */
export function resolveWebTableBootstrapHref(): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname, search, hash } = window.location;
  if (hash.length > 2) {
    const inner = hash.startsWith('#') ? hash.slice(1) : hash;
    if (inner.startsWith('/') || /^table\//i.test(inner)) {
      const pathQuery = inner.startsWith('/') ? inner : `/${inner}`;
      try {
        const resolved = new URL(pathQuery, origin).href;
        const p = new URL(resolved).pathname;
        if (/\/(?:table|t|ban)\//i.test(p)) return resolved;
        const sp = new URL(resolved).searchParams;
        if (sp.get('tid')?.trim() || sp.get('tableId')?.trim() || sp.get('table_id')?.trim()) {
          return resolved;
        }
      } catch {
        /* ignore */
      }
    }
  }
  return `${origin}${pathname}${search}`;
}

/** Có tín hiệu bàn trên URL (path, query tid, hoặc hash SPA). */
export function urlSignalsCustomerTable(href: string): boolean {
  const parsed = parseCustomerTableUrl(href);
  if (parsed.tableId) return true;
  try {
    return /\/(?:table|t|ban)\//i.test(new URL(href).pathname);
  } catch {
    return false;
  }
}
