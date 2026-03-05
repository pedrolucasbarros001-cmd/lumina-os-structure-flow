import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from './useUnit';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type TeamMember = Tables<'team_members'>;

export function useTeamMembers() {
    const { data: unit } = useUnit();

    return useQuery({
        queryKey: ['team_members', unit?.id],
        queryFn: async () => {
            if (!unit) return [];
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('unit_id', unit.id)
                .eq('is_active', true)
                .order('name');
            if (error) throw error;
            return data as TeamMember[];
        },
        enabled: !!unit,
    });
}

export function useCreateTeamMember() {
    const queryClient = useQueryClient();
    const { data: unit } = useUnit();
    return useMutation({
        mutationFn: async (payload: Omit<TablesInsert<'team_members'>, 'unit_id'>) => {
            if (!unit) throw new Error('No unit found');
            const { data, error } = await supabase
                .from('team_members')
                .insert({ ...payload, unit_id: unit.id })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
    });
}
