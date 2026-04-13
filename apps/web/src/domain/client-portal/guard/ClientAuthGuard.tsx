import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useClientAuthStore } from '../store/client-auth.store';

export default function ClientAuthGuard() {
  const { isAuthenticated } = useClientAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/client/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
