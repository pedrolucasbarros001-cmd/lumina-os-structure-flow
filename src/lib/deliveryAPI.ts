import { supabase } from '@/integrations/supabase/client';

export const deliveryAPI = {
  async checkIn(deliveryId: string, lat: number, lng: number) {
    const { data, error } = await supabase
      .from('deliveries')
      .update({
        status: 'arrived',
        driver_lat: lat,
        driver_lng: lng,
      })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  async completeDelivery(deliveryId: string, appointmentId: string) {
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', deliveryId);

    if (deliveryError) throw deliveryError;

    const { error: appointmentError } = await supabase
      .from('appointments')
      .update({ status: 'completed' as any })
      .eq('id', appointmentId);

    if (appointmentError) throw appointmentError;

    return { success: true };
  },

  getTrackingLink(deliveryId: string): string {
    return `${window.location.origin}/delivery/${deliveryId}`;
  },

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  calculateETA(lat1: number, lng1: number, lat2: number, lng2: number, avgSpeedKmH = 40): number {
    const distance = this.calculateDistance(lat1, lng1, lat2, lng2);
    return Math.round((distance / avgSpeedKmH) * 60);
  },
};
