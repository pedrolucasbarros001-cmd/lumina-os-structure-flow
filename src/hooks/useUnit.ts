import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

export function useUnit() {
  const { user } = useAuth();
  const { activeCompanyId } = useCompany();

  return useQuery({
    queryKey: ['unit', user?.id, activeCompanyId],
    queryFn: async () => {
      if (!user) return null;

      const loadUnitById = async (unitId: string) => {
        const { data, error } = await supabase
          .from('units')
          .select('*')
          .eq('id', unitId)
          .maybeSingle();

        if (error) throw error;
        return data;
      };

      // 1) Active company from switcher (if available)
      if (activeCompanyId) {
        const activeUnit = await loadUnitById(activeCompanyId);
        if (activeUnit) return activeUnit;
      }

      // 2) Membership-based unit (staff/reception)
      const { data: membership, error: membershipError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (membership?.company_id) {
        const memberUnit = await loadUnitById(membership.company_id);
        if (memberUnit) return memberUnit;
      }

      // 3) Team member fallback (legacy invites)
      const { data: teamMember, error: teamMemberError } = await supabase
        .from('team_members')
        .select('unit_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (teamMemberError) throw teamMemberError;
      if (teamMember?.unit_id) {
        const teamUnit = await loadUnitById(teamMember.unit_id);
        if (teamUnit) return teamUnit;
      }

      // 4) Owner fallback
      const { data: ownerUnit, error: ownerUnitError } = await supabase
        .from('units')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (ownerUnitError) throw ownerUnitError;
      return ownerUnit;
    },
    enabled: !!user,
  });
}
