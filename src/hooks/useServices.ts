import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from './useUnit';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Service = Tables<'services'>;

export function useServices() {
    const { data: unit } = useUnit();

    return useQuery({
        queryKey: ['services', unit?.id],
        queryFn: async () => {
            if (!unit) return [];
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('unit_id', unit.id)
                .order('name');
            if (error) throw error;
            return data as Service[];
        },
        enabled: !!unit,
    });
}

export function useCreateService() {
    const queryClient = useQueryClient();
    const { data: unit } = useUnit();
    return useMutation({
        mutationFn: async (payload: Omit<TablesInsert<'services'>, 'unit_id'>) => {
            if (!unit) throw new Error('No unit found');
            const { data, error } = await supabase
                .from('services')
                .insert({
                    ...payload,
                    unit_id: unit.id,
                    duration_minutes: (payload as any).duration_minutes || payload.duration || 60
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
    });
}

export function useUpdateService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: TablesUpdate<'services'> & { id: string }) => {
            const { error } = await supabase
                .from('services')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
    });
}
