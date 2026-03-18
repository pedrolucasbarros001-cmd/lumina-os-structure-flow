import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSetup?: boolean;
}

export default function ProtectedRoute({ children, requireSetup = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Wait for auth + profile to resolve before making any routing decision
  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Profile still loading edge case
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Phase 1 gate: onboarding must be complete
  if (!profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding IS completed and user tries to access /onboarding, redirect to agenda
  if (profile.onboarding_completed && location.pathname === '/onboarding') {
    return <Navigate to="/agenda" replace />;
  }

  // Staff route protection — bloquear por prefixo para cobrir subpaths futuros
  const staffRestrictedPrefixes = ['/team', '/unit', '/settings', '/vendas', '/catalogo'];
  if (profile.user_type === 'staff' && staffRestrictedPrefixes.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
    return <Navigate to="/agenda" replace />;
  }

  return <>{children}</>;
}
