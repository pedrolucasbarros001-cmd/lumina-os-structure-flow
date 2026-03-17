import { supabase } from '@/lib/supabase';

/**
 * API utilities para deliveries
 * Usam Supabase RPC functions e direct table access
 */

export const deliveryAPI = {
  /**
   * Check-in de entrega (marcar como 'arrived')
   */
  async checkIn(deliveryId: string, lat: number, lon: number) {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'arrived',
          driver_lat: lat,
          driver_lon: lon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Check-in error:', error);
      throw error;
    }
  },

  /**
   * Completar entrega e atualizar appointment
   */
  async completeDelivery(deliveryId: string, appointmentId: string) {
    try {
      // 1. Update delivery status
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('deliveries')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // 2. Update appointment status (opcional, depende da lógica)
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      return { success: true, delivery: deliveryData };
    } catch (error) {
      console.error('Complete delivery error:', error);
      throw error;
    }
  },

  /**
   * Obter link de rastreamento público
   * (compartilhar com cliente)
   */
  getTrackingLink(deliveryId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/delivery/${deliveryId}`;
  },

  /**
   * Enviar link de rastreamento via SMS/Email
   */
  async sendTrackingLink(
    deliveryId: string,
    customerPhone: string,
    customerEmail?: string
  ) {
    try {
      const trackingLink = this.getTrackingLink(deliveryId);

      // Enviar SMS (se tiver integração Twilio ou similar)
      if (customerPhone) {
        // Este é ume exemplo - ajustar conforme a integração
        const { error } = await supabase.functions.invoke('send-sms', {
          body: {
            phone: customerPhone,
            message: `Rastreie sua entrega: ${trackingLink}`,
          },
        });

        if (error) console.error('SMS error:', error);
      }

      // Enviar Email (se tiver integração)
      if (customerEmail) {
        const { error } = await supabase.functions.invoke('send-email', {
          body: {
            email: customerEmail,
            subject: 'Rastreie sua entrega',
            html: `
              <p>Sua entrega está a caminho!</p>
              <p><a href="${trackingLink}">Clique aqui para rastrear</a></p>
            `,
          },
        });

        if (error) console.error('Email error:', error);
      }

      return { success: true, trackingLink };
    } catch (error) {
      console.error('Send tracking link error:', error);
      throw error;
    }
  },

  /**
   * Validar se o ID da entrega é válido (proteção de segurança)
   */
  async validateDeliveryId(deliveryId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id')
        .eq('id', deliveryId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  },

  /**
   * Obter entregas de um unit (para staff/manager)
   */
  async getUnitDeliveries(unitId: string, status?: string) {
    try {
      let query = supabase
        .from('deliveries')
        .select(
          `
          *,
          appointments (
            id,
            title,
            customer_name
          )
        `
        )
        .eq('unit_id', unitId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get unit deliveries error:', error);
      throw error;
    }
  },

  /**
   * Calcular ETA (tempo estimado de chegada)
   */
  calculateETA(
    driverLat: number,
    driverLon: number,
    customerLat: number,
    customerLon: number,
    avgSpeedKmH: number = 40 // velocidade média em cidade
  ): number {
    // Haversine distance
    const R = 6371; // km
    const dLat = ((customerLat - driverLat) * Math.PI) / 180;
    const dLon = ((customerLon - driverLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((driverLat * Math.PI) / 180) *
        Math.cos((customerLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate ETA in minutes
    const timeMinutes = (distance / avgSpeedKmH) * 60;
    return Math.round(timeMinutes);
  },
};
