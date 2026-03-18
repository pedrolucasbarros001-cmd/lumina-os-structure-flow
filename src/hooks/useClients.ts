import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from './useUnit';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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

export function useUpdateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string; name?: string; phone?: string | null; email?: string | null }) => {
            const { data, error } = await supabase
                .from('clients')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    });
}

export function useDeleteClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    });
}
