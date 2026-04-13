import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/domain/auth/store/auth.store';

/**
 * 인증 가드: 로그인 필수 + 상태 기반 리다이렉트
 * - PENDING → /pending
 * - INACTIVE/SUSPENDED → /inactive
 * - mustChangePw → /force-change-password
 */
export default function AuthGuard() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/user/login" state={{ from: location }} replace />;
  }

  // PENDING: 승인 대기 페이지로
  if (user.status === 'PENDING' && location.pathname !== '/pending') {
    return <Navigate to="/pending" replace />;
  }

  // INACTIVE / SUSPENDED: 비활성 페이지로
  if (
    (user.status === 'INACTIVE' || user.status === 'SUSPENDED') &&
    location.pathname !== '/inactive'
  ) {
    return <Navigate to="/inactive" replace />;
  }

  // 비밀번호 변경 필요 (최초 설정 또는 강제 변경)
  if (
    user.mustChangePw &&
    location.pathname !== '/force-change-password' &&
    location.pathname !== '/initial-setup'
  ) {
    return <Navigate to="/initial-setup" replace />;
  }

  return <Outlet />;
}
