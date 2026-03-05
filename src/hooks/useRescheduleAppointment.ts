import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRescheduleAppointment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, datetime }: { id: string; datetime: string }) => {
            const { error } = await supabase
                .from('appointments')
                .update({ datetime, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
    });
}
