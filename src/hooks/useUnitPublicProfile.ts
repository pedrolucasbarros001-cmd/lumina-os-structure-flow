// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnitProfile {
  about?: string;
  instagram_url?: string;
  cancellation_policy?: string;
  min_booking_notice_hours?: number;
  max_advance_booking_days?: number;
  buffer_minutes?: number;
  allow_any_staff?: boolean;
}

export function useUnitPublicProfile(unitId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['unitPublicProfile', unitId],
    queryFn: async () => {
      if (!unitId) return null;

      const { data, error } = await supabase
        .from('units')
        .select('about, instagram_url, cancellation_policy, min_booking_notice_hours, max_advance_booking_days, buffer_minutes, allow_any_staff')
        .eq('id', unitId)
        .single();

      if (error) throw error;
      return data as UnitProfile;
    },
    enabled: !!unitId,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: UnitProfile) => {
      if (!unitId) throw new Error('Unit ID is required');

      const { error } = await supabase.from('units').update(updates).eq('id', unitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitPublicProfile', unitId] });
      toast({ title: 'Sucesso', description: 'Perfil público atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: 'Falha ao atualizar perfil', variant: 'destructive' });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateProfile,
  };
}
