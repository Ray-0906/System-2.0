import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import SoloLoading from './Loading';

export default function ProtectedRoute({ allowGuest = false }) {
  const user = useUserStore(s => s.user);
  const initialized = useUserStore(s => s.initialized);
  const location = useLocation();

  if (!initialized) {
    return <SoloLoading message="Initializing..." />;
  }

  if (!user && !allowGuest) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user && allowGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
