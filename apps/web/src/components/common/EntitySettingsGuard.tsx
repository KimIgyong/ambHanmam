import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/domain/auth/store/auth.store';

interface EntitySettingsGuardProps {
  children: React.ReactNode;
}

/**
 * MASTER 또는 ADMIN 이상만 접근 허용하는 가드.
 * MASTER: 자신의 법인 설정만 접근
 * ADMIN: 모든 법인 설정 접근
 */
export default function EntitySettingsGuard({ children }: EntitySettingsGuardProps) {
  const isMasterOrAdmin = useAuthStore((s) => s.isMasterOrAdmin);

  if (!isMasterOrAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
