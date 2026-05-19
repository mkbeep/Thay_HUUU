/** Roles admin / manager — dùng cho Staff, Kho, Báo cáo */
export const ADMIN_MANAGER_ROLES = ['admin', 'manager'] as const;

/** Tắt trang Khuyến mãi (bật lại khi cần) */
export const PROMOTIONS_ENABLED = false;

/** Tắt Dashboard (bật lại khi cần) */
export const DASHBOARD_ENABLED = false;

/** Trang đích sau đăng nhập / khi tắt dashboard */
export const DEFAULT_AUTHENTICATED_HOME = DASHBOARD_ENABLED ? '/' : '/orders';

function hasAdminManagerRole(
  roles?: string[],
  fallbackRole?: string
): boolean {
  const effectiveRoles = roles?.length ? roles : fallbackRole ? [fallbackRole] : [];
  return effectiveRoles.some((role) =>
    (ADMIN_MANAGER_ROLES as readonly string[]).includes(role)
  );
}

export function canAccessAdminManagerPages(
  roles?: string[],
  fallbackRole?: string
): boolean {
  return hasAdminManagerRole(roles, fallbackRole);
}

/** @deprecated dùng canAccessAdminManagerPages */
export const STAFF_MANAGEMENT_ROLES = ADMIN_MANAGER_ROLES;

export function canAccessStaffManagement(
  roles?: string[],
  fallbackRole?: string
): boolean {
  return canAccessAdminManagerPages(roles, fallbackRole);
}
