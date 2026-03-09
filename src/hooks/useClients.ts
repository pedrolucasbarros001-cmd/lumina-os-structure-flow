import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from './useUnit';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Client = Tables<'clients'>;

export function useClients() {
    const { data: unit } = useUnit();

    return useQuery({
        queryKey: ['clients', unit?.id],
        queryFn: async () => {
            if (!unit) return [];
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('unit_id', unit.id)
                .order('name');
            if (error) throw error;
            return data as Client[];
        },
        enabled: !!unit,
    });
}

export function useCreateClient() {
    const queryClient = useQueryClient();
    const { data: unit } = useUnit();
    return useMutation({
        mutationFn: async (payload: Omit<TablesInsert<'clients'>, 'unit_id'>) => {
            if (!unit) throw new Error('No unit found');
            const { data, error } = await supabase
                .from('clients')
                .insert({ ...payload, unit_id: unit.id })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    });
}
