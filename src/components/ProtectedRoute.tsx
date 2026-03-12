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

  // If profile hasn't loaded yet (edge case: query enabled but data null while user exists), keep loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Phase 1 gate: onboarding must be complete (staff invited via VIP already have onboarding_completed=true)
  if (!profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding IS completed and user tries to access /onboarding, redirect to dashboard
  if (profile.onboarding_completed && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // Phase 2 gate: progressive setup must be complete (unless we're on /setup or /onboarding)
  if (
    requireSetup &&
    profile.onboarding_completed &&
    !(profile as any).setup_completed &&
    location.pathname !== '/setup'
  ) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
