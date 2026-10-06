import { Navigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';
import { Loading } from './UI';

// Only lets logged-in users with the right role see the page
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
