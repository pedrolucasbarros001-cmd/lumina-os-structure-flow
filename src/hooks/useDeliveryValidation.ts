// @ts-nocheck
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryValidationResult {
  is_valid: boolean;
  reason: string;
}

// Validate if coordinates are within coverage radius
export function useValidateDeliveryLocation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      unitId: string;
      appointmentType: 'unit' | 'home';
      customerLat: number;
      customerLon: number;
    }) => {
      // Call RPC function to validate
      const { data, error } = await supabase.rpc(
        'validate_delivery_appointment',
        {
          unit_id: input.unitId,
          appointment_type: input.appointmentType,
          customer_address_lat: input.customerLat,
          customer_address_lon: input.customerLon,
        }
      );

      if (error) throw error;
      return data as DeliveryValidationResult[];
    },
    onError: (error: any) => {
      console.error('Delivery validation error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao validar localização',
        description: error?.message || 'Tente novamente',
      });
    },
  });
}

// Check coverage radius for a unit
export function useUnitCoverageRadius(unitId: string) {
  return useQuery({
    queryKey: ['unit_coverage_radius', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobility_settings')
        .select('coverage_radius_km, base_fee, price_per_km')
        .eq('unit_id', unitId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },
    enabled: !!unitId,
  });
}

// Calculate delivery fee based on distance
export function calculateDeliveryFee(
  distanceKm: number,
  baseFee: number,
  pricePerKm: number
): number {
  return baseFee + distanceKm * pricePerKm;
}

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Validate appointment can be created
export function useValidateAppointmentCreation() {
  return useMutation({
    mutationFn: async (input: {
      unitId: string;
      appointmentType: 'unit' | 'home';
      customerLat?: number;
      customerLon?: number;
      teamMemberId?: string;
      startTime: Date;
      endTime: Date;
    }) => {
      const errors: string[] = [];

      // Validate delivery location if applicable
      if (input.appointmentType === 'home' && input.customerLat && input.customerLon) {
        const { data: validationResult, error: validationError } = await supabase.rpc(
          'validate_delivery_appointment',
          {
            unit_id: input.unitId,
            appointment_type: input.appointmentType,
            customer_address_lat: input.customerLat,
            customer_address_lon: input.customerLon,
          }
        );

        if (validationError) {
          errors.push('Erro ao validar localização');
        } else if (validationResult && !validationResult[0]?.is_valid) {
          errors.push(validationResult[0]?.reason || 'Localização inválida');
        }
      }

      // Validate staff availability (check blocked time)
      if (input.teamMemberId) {
        const { data: blockedTimes, error: blockedError } = await supabase
          .from('staff_blocked_time')
          .select('start_time, end_time')
          .eq('team_member_id', input.teamMemberId)
          .eq('status', 'active')
          .gte('end_time', input.startTime.toISOString())
          .lte('start_time', input.endTime.toISOString());

        if (!blockedError && blockedTimes && blockedTimes.length > 0) {
          errors.push('Staff tem período bloqueado neste horário');
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }

      return { valid: true };
    },
  });
}

// Mock function to check if address is in service area
export function isAddressInServiceArea(
  unitLat: number,
  unitLon: number,
  customerLat: number,
  customerLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(unitLat, unitLon, customerLat, customerLon);
  return distance <= radiusKm;
}
