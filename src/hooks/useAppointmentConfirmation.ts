import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppointmentConfirmationToken {
  id: string;
  appointment_id: string;
  token: string;
  action: 'confirm' | 'reschedule' | 'cancel';
  used: boolean;
  used_at?: string;
  expires_at: string;
  created_at: string;
}

// Create confirmation token for an appointment
export function useCreateConfirmationToken() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      appointmentId: string;
      action: 'confirm' | 'reschedule' | 'cancel';
    }) => {
      const { data, error } = await supabase.rpc(
        'create_appointment_confirmation_token',
        {
          appointment_id: input.appointmentId,
          action: input.action,
        }
      );

      if (error) throw error;
      return data[0]; // Returns first row with token and expires_at
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar link',
        description: error?.message,
      });
    },
  });
}

// Send appointment reminders (call via RPC)
export function useSendAppointmentReminders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(
        'send_appointment_reminders'
      );

      if (error) throw error;
      return data[0]; // Returns { sent_count, failed_count }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: `${result.sent_count} lembretes enviados`,
        description: result.failed_count > 0 
          ? `${result.failed_count} falharam` 
          : 'Tudo OK',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar lembretes',
        description: error?.message,
      });
    },
  });
}

// Confirm appointment via token (customer side)
export function useConfirmAppointmentByToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      token: string;
      confirmed: boolean;
    }) => {
      const { data, error } = await supabase.rpc(
        'confirm_appointment_by_token',
        {
          token: input.token,
          confirmed: input.confirmed,
        }
      );

      if (error) throw error;
      return data[0]; // Returns { success, message, appointment_id }
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        toast({
          title: result.confirmed ? 'Confirmado!' : 'Cancelado',
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: result.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao processar confirmação',
        description: error?.message,
      });
    },
  });
}

// Fetch pending confirmations for a client
export function usePendingConfirmations(clientId: string) {
  return useQuery({
    queryKey: ['pending_confirmations', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          id,
          datetime,
          duration,
          status,
          customer_confirmed,
          services(name, duration, price),
          team_members(name),
          clients(email, phone)
        `
        )
        .eq('client_id', clientId)
        .in('status', ['pending_approval', 'confirmed'])
        .is('customer_confirmed', null)
        .order('datetime', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

// Get appointment details from token
export function useGetAppointmentFromToken(token: string) {
  return useQuery({
    queryKey: ['appointment_from_token', token],
    queryFn: async () => {
      // First, get appointment_id from token
      const { data: tokenData, error: tokenError } = await supabase
        .from('appointment_confirmation_tokens')
        .select('appointment_id, used, expires_at, action')
        .eq('token', token)
        .maybeSingle();

      if (tokenError) throw tokenError;
      if (!tokenData) throw new Error('Token não encontrado');

      if (tokenData.used) {
        throw new Error('Este link já foi utilizado');
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error('Este link expirou');
      }

      // Get appointment details
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select(
          `
          *,
          services(name, duration, price),
          clients(name, email, phone),
          team_members(name),
          units(name)
        `
        )
        .eq('id', tokenData.appointment_id)
        .single();

      if (apptError) throw apptError;

      return {
        appointment: apptData,
        action: tokenData.action,
        token: token,
      };
    },
    enabled: !!token,
  });
}

// Get template for reminder email
export function getConfirmationEmailTemplate(
  appointmentDetails: any,
  confirmLink: string,
  rescheduleLink: string,
  cancelLink: string
): { subject: string; html: string } {
  const appointmentTime = new Date(appointmentDetails.datetime).toLocaleString('pt-PT');
  const serviceName = appointmentDetails.services?.name || 'Serviço';
  const staffName = appointmentDetails.team_members?.name || 'Staff';

  return {
    subject: `Confirme seu agendamento - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Confirmação de Agendamento</h2>
        
        <p>Olá ${appointmentDetails.clients?.name},</p>
        
        <p>Seu agendamento está marcado para:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Serviço:</strong> ${serviceName}</p>
          <p><strong>Data/Hora:</strong> ${appointmentTime}</p>
          <p><strong>Duração:</strong> ${appointmentDetails.services?.duration || 60} minutos</p>
          <p><strong>Profissional:</strong> ${staffName}</p>
        </div>
        
        <p style="margin: 30px 0;">Por favor, confirme sua presença para que possamos reservar seu horário:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 0 10px;">
            ✓ Confirmar
          </a>
          <a href="${cancelLink}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 0 10px;">
            ✗ Cancelar
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Se precisar remarcar, pode responder a este email ou clicar em "Remarcar" no nosso website.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #999; font-size: 12px;">
          LUMINA OS - Sistema de Agendamentos
        </p>
      </div>
    `,
  };
}
