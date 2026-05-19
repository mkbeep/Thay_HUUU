import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  canAccessAdminManagerPages,
  DEFAULT_AUTHENTICATED_HOME,
} from '../../utils/permissions';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  /** Hàm kiểm tra quyền — mặc định: admin hoặc manager */
  allow?: (roles: string[] | undefined, fallbackRole?: string) => boolean;
  redirectTo?: string;
}

export function RoleProtectedRoute({
  children,
  allow = canAccessAdminManagerPages,
  redirectTo = DEFAULT_AUTHENTICATED_HOME,
}: RoleProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);

  if (!allow(user?.roles, user?.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
