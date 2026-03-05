import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Set to false to skip the setup_completed check (e.g. /setup and /onboarding themselves) */
  requireSetup?: boolean;
}

export default function ProtectedRoute({ children, requireSetup = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (!user ? false : profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Phase 1 gate: onboarding must be complete
  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Phase 2 gate: progressive setup must be complete (unless we're on /setup or /onboarding)
  if (
    requireSetup &&
    profile &&
    profile.onboarding_completed &&
    !(profile as any).setup_completed &&
    location.pathname !== '/setup'
  ) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
