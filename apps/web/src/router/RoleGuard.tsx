import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/domain/auth/store/auth.store';

interface RoleGuardProps {
  allowedRoles?: string[];
  allowedLevels?: string[];
}

/**
 * 역할/레벨 기반 접근 제어
 * - allowedRoles: 허용할 역할 목록
 * - allowedLevels: 허용할 레벨 목록
 */
export default function RoleGuard({ allowedRoles, allowedLevels }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/user/login" replace />;
  }

  if (allowedLevels && !allowedLevels.includes(user.level || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
