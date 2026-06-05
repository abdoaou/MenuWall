import { Navigate, useLocation } from 'react-router-dom';
import { useApi } from '../context/ApiContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApi();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
