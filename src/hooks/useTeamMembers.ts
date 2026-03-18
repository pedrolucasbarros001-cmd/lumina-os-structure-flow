import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from './useUnit';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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

export function useUpdateTeamMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string; name?: string; role?: string; commission_rate?: number; accepts_home_visits?: boolean }) => {
            const { data, error } = await supabase
                .from('team_members')
                .update(payload as TablesUpdate<'team_members'>)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
    });
}

export function useArchiveTeamMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('team_members')
                .update({ is_active: false })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
    });
}
