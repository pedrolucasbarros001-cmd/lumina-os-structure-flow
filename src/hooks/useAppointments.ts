import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from './useUnit';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Appointment = Tables<'appointments'>;

export function useAppointments(date?: string) {
    const { data: unit } = useUnit();

    return useQuery({
        queryKey: ['appointments', unit?.id, date],
        queryFn: async () => {
            if (!unit) return [];
            let query = supabase
                .from('appointments')
                .select('*')
                .eq('unit_id', unit.id)
                .order('datetime', { ascending: true });

            if (date) {
                const start = `${date}T00:00:00`;
                const end = `${date}T23:59:59`;
                query = query.gte('datetime', start).lte('datetime', end);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Appointment[];
        },
        enabled: !!unit,
    });
}

export function useUpdateAppointmentStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: Appointment['status'] }) => {
            const { error } = await supabase
                .from('appointments')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
    });
}

export function useCreateAppointment() {
    const queryClient = useQueryClient();
    const { data: unit } = useUnit();
    return useMutation({
        mutationFn: async (payload: Omit<TablesInsert<'appointments'>, 'unit_id'>) => {
            if (!unit) throw new Error('No unit found');
            const { data, error } = await supabase
                .from('appointments')
                .insert({ ...payload, unit_id: unit.id })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
    });
}

export function useUpdateAppointment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesUpdate<'appointments'>>) => {
            const { error } = await supabase
                .from('appointments')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
    });
}

export function useClientAppointments(clientId: string | null) {
    const { data: unit } = useUnit();
    return useQuery({
        queryKey: ['appointments', 'client', clientId],
        queryFn: async () => {
            if (!unit || !clientId) return [];
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('unit_id', unit.id)
                .eq('client_id', clientId)
                .order('datetime', { ascending: false })
                .limit(10);
            if (error) throw error;
            return data as Appointment[];
        },
        enabled: !!unit && !!clientId,
    });
}
