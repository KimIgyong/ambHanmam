import { Navigate } from 'react-router-dom';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';

interface MenuGuardProps {
  menuCode: string;
  children: React.ReactNode;
}

export default function MenuGuard({ menuCode, children }: MenuGuardProps) {
  const { data: myMenus, isLoading } = useMyMenus();

  // Still loading — render nothing to avoid flash
  if (isLoading) return null;

  // If data loaded and menu not in accessible list, redirect
  if (myMenus && !myMenus.find((m) => m.menuCode === menuCode)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
