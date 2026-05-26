/** Heartbeat: client ping mỗi 60s; sau 3 phút không ping thì bắt đầu auto-close */
export const SESSION_PING_INTERVAL_MS = 60_000;
export const SESSION_STALE_AFTER_MS = 3 * 60_000;
/** Tiến trình quét session zombie legacy, giữ cùng nhịp auto-close */
export const SESSION_CLEANUP_INTERVAL_MS = 30_000;

/** Sau khi thỏa điều kiện auto-resolve — đếm ngược đóng bàn (3 phút) */
export const AUTO_CLOSE_DELAY_MS = 3 * 60_000;
/** last_heartbeat phải cũ hơn mốc này mới bật auto-close */
export const AUTO_RESOLVE_HEARTBEAT_STALE_MS = 3 * 60_000;
/** Emit session:closing_soon cho app khách trước khi đóng */
export const AUTO_CLOSE_WARNING_BEFORE_MS = 60_000;
/** Cron kiểm tra auto-close mỗi 30 giây */
export const AUTO_CLOSE_CRON_INTERVAL_MS = 30_000;
