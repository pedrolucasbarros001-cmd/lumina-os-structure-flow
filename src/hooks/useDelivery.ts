// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

export interface Delivery {
  id: string;
  appointment_id: string;
  unit_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_lat: number;
  customer_lon: number;
  status: 'pending' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  driver_lat?: number;
  driver_lon?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
}

// Fetch deliveries for a unit
export function useUnitDeliveries(unitId: string) {
  return useQuery({
    queryKey: ['deliveries', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('unit_id', unitId)
        .in('status', ['pending', 'en_route', 'arrived'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Delivery[];
    },
    enabled: !!unitId,
    refetchInterval: 5000, // Refetch a cada 5 segundos
  });
}

// Fetch single delivery
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
      return data as Delivery;
    },
    enabled: !!deliveryId,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  });
}

// Start delivery (mudar status para en_route)
export function useStartDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'en_route',
          started_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data as Delivery;
    },
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery', delivery.id] });
    },
  });
}

// Update driver location
export function useUpdateDriverLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { deliveryId: string; lat: number; lon: number }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          driver_lat: payload.lat,
          driver_lon: payload.lon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data as Delivery;
    },
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['delivery', delivery.id] });
    },
  });
}

// Complete delivery
export function useCompleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data as Delivery;
    },
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery', delivery.id] });
    },
  });
}

// Get user's current location (GPS)
export function useCurrentLocation() {
  const { current: watching } = useRef<number | null>(null);

  const getLocation = async (): Promise<DeliveryLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation não está disponível'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const watchLocation = (callback: (location: DeliveryLocation) => void) => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  return { getLocation, watchLocation };
}

// Calcular distância entre dois pontos (Haversine)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Subscribe to real-time updates
export function useDeliveryRealtime(deliveryId: string, onUpdate?: (data: Delivery) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!deliveryId) return;

    channelRef.current = supabase
      .channel(`delivery:${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          if (onUpdate) {
            onUpdate(payload.new as Delivery);
          }
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [deliveryId, onUpdate]);
}
