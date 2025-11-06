import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Redirect to appropriate page based on auth status
  return user ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />;
};

export default Index;
