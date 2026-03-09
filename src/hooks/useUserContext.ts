import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface UserContext {
  isOwner: boolean;
  isStaff: boolean;
  linkedUnitId: string | null;
  teamMemberId: string | null;
  isLoading: boolean;
}

export function useUserContext(): UserContext {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  // Get team member data for staff users
  const { data: teamMember, isLoading: teamMemberLoading } = useQuery({
    queryKey: ['team_member_by_user', user?.id],
    queryFn: async () => {
      if (!user || profile?.user_type !== 'staff') return null;
      const { data, error } = await supabase
        .from('team_members')
        .select('id, unit_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && profile?.user_type === 'staff',
  });

  const isStaff = profile?.user_type === 'staff';
  const isOwner = profile?.user_type === 'owner' || !isStaff;
  
  return {
    isOwner,
    isStaff,
    linkedUnitId: isStaff ? (teamMember?.unit_id || profile?.linked_unit_id) : null,
    teamMemberId: teamMember?.id || null,
    isLoading: profileLoading || (isStaff && teamMemberLoading),
  };
}