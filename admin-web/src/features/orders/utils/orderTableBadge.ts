/** Gộp lỗi dữ liệu kiểu "Bàn Bàn 16" → "Bàn 16". */
export function collapseDuplicateTableWord(label: string): string {
  return label.replace(/\b(Bàn|bàn)\s*[:]?\s*(Bàn|bàn)\s+/gi, 'Bàn ')
}

/**
 * Một dòng duy nhất cho badge bàn (không lặp "Bàn" + "Bàn 16").
 * Có nhãn từ API thì ưu tiên; không thì rút gọn session id.
 */
export function formatOrderTableBadgeLine(
  tableDisplayLabel?: string | null,
  tableSessionId?: string | null
): string {
  const raw = (tableDisplayLabel && String(tableDisplayLabel).trim()) || ''
  if (raw) return collapseDuplicateTableWord(raw)
  const sid = tableSessionId && String(tableSessionId).trim()
  if (!sid) return '—'
  if (sid.length > 18) return `Phiên ${sid.slice(0, 10)}…`
  return sid
}
