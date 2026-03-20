import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export function RootRedirect() {
  const { isLoading, session } = useAppContext();

  if (isLoading) {
    return <div className="app-loading">Loading workspace...</div>;
  }

  return <Navigate to={session ? '/app/overview' : '/login'} replace />;
}
