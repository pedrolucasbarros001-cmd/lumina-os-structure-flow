import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTeamMemberServices(teamMemberId?: string) {
  return useQuery({
    queryKey: ['team_member_services', teamMemberId],
    queryFn: async () => {
      if (!teamMemberId) return [];
      
      const { data, error } = await supabase
        .from('team_member_services')
        .select('service_id')
        .eq('team_member_id', teamMemberId);
      
      if (error) throw error;
      return data?.map(row => row.service_id) || [];
    },
    enabled: !!teamMemberId,
  });
}

export function useUpdateTeamMemberServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamMemberId, serviceIds }: { teamMemberId: string; serviceIds: string[] }) => {
      // Get current services
      const { data: current } = await supabase
        .from('team_member_services')
        .select('id, service_id')
        .eq('team_member_id', teamMemberId);

      const currentServiceIds = current?.map(row => row.service_id) || [];
      const idsToDelete = currentServiceIds.filter(id => !serviceIds.includes(id));
      const idsToAdd = serviceIds.filter(id => !currentServiceIds.includes(id));

      // Delete removed services
      if (idsToDelete.length > 0) {
        const { error } = await supabase
          .from('team_member_services')
          .delete()
          .eq('team_member_id', teamMemberId)
          .in('service_id', idsToDelete);
        
        if (error) throw error;
      }

      // Insert new services
      if (idsToAdd.length > 0) {
        const { error } = await supabase
          .from('team_member_services')
          .insert(
            idsToAdd.map(serviceId => ({
              team_member_id: teamMemberId,
              service_id: serviceId,
            }))
          );
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_member_services'] });
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
    },
  });
}
