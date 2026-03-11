import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      let profile = existingProfile;

      // Bootstrap profile if missing (guarantees onboarding gate works)
      if (!profile) {
        const { data: createdProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
            user_type: 'owner',
            onboarding_completed: false,
            setup_completed: false,
          })
          .select('*')
          .single();

        if (createProfileError) throw createProfileError;
        profile = createdProfile;
      }

      // Bootstrap trial only for owner accounts without active/trial subscription
      if (profile?.user_type !== 'staff') {
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('owner_id', user.id)
          .in('status', ['active', 'trial'])
          .limit(1)
          .maybeSingle();

        if (subscriptionError) throw subscriptionError;

        if (!subscription) {
          const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
          const { error: createSubscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              owner_id: user.id,
              plan_type: 'monthly',
              status: 'trial',
              expires_at: trialEnd,
            });

          if (createSubscriptionError) throw createSubscriptionError;
        }
      }

      return profile;
    },
    enabled: !!user,
  });
}
