import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePublicUnit(slug: string | undefined) {
  const unitQuery = useQuery({
    queryKey: ['public-unit', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const unitId = unitQuery.data?.id;

  const servicesQuery = useQuery({
    queryKey: ['public-services', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('unit_id', unitId!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
  });

  const teamQuery = useQuery({
    queryKey: ['public-team', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, team_member_services(service_id)')
        .eq('unit_id', unitId!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
  });

  const mobilityQuery = useQuery({
    queryKey: ['public-mobility', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobility_settings')
        .select('*')
        .eq('unit_id', unitId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
  });

  return {
    unit: unitQuery.data,
    services: servicesQuery.data ?? [],
    team: teamQuery.data ?? [],
    mobility: mobilityQuery.data,
    isLoading: unitQuery.isLoading,
  };
}
