import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreateDeliveryInput {
  appointmentId: string;
  appointmentData: {
    client_name?: string;
    client_phone?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  unitId: string;
}

export function useDelivery(deliveryId: string) {
  return useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!deliveryId,
    refetchInterval: 10000, // Poll every 10s for live tracking
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, appointmentData, unitId }: CreateDeliveryInput) => {
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          appointment_id: appointmentId,
          customer_name: appointmentData.client_name || 'Cliente',
          customer_phone: appointmentData.client_phone || '',
          customer_lat: appointmentData.lat || null,
          customer_lng: appointmentData.lng || null,
          customer_address: appointmentData.address || '',
          unit_id: unitId,
          status: 'en_route',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, driverLat, driverLng }: { 
      id: string; 
      status: string; 
      driverLat?: number; 
      driverLng?: number;
    }) => {
      const updates: Record<string, unknown> = { status };
      if (driverLat !== undefined) updates.driver_lat = driverLat;
      if (driverLng !== undefined) updates.driver_lng = driverLng;
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['delivery', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}
