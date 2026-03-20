import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export function ProtectedRoute() {
  const { isLoading, session } = useAppContext();
  const location = useLocation();

  if (isLoading) {
    return <div className="app-loading">Loading workspace...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
