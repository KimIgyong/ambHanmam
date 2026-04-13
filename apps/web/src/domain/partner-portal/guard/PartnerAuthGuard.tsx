import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePartnerAuthStore } from '../store/partner-auth.store';

export default function PartnerAuthGuard() {
  const { isAuthenticated } = usePartnerAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/partner/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
