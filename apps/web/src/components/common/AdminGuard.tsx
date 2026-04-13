import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/domain/auth/store/auth.store';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * 어드민 그룹(SUPER_ADMIN, ADMIN)만 접근 허용하는 가드.
 * 비-어드민 사용자는 홈('/')으로 리다이렉트.
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
