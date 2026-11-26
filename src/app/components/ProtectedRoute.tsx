import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { session, perfil, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0f18] text-white">Verificando acesso...</div>;
  }
  if (!session) return <Navigate to="/" replace state={{ from: location }} />;
  if (!perfil || !perfil.ativo) return <Navigate to="/" replace state={{ authError: 'Seu usuário não possui um perfil ativo no sistema.' }} />;
  return <Outlet />;
}
