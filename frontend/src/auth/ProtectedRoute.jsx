import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
