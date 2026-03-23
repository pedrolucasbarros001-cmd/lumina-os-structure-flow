import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamShift {
  id: string;
  team_member_id: string;
  day_of_week: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAYS_LABELS = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo',
};

// Fetch shifts for a specific team member
// NOTE: This requires the team_shifts table to be created in Supabase
export function useTeamMemberShifts(teamMemberId?: string) {
  return useQuery({
    queryKey: ['team_member_shifts', teamMemberId],
    queryFn: async () => {
      if (!teamMemberId) return [];

      // TODO: Uncomment when team_shifts table is created
      // const { data, error } = await supabase
      //   .from('team_shifts')
      //   .select('*')
      //   .eq('team_member_id', teamMemberId)
      //   .order('day_of_week');

      // if (error) throw error;
      // return (data || []) as TeamShift[];

      // Temporary: return mock data
      return [];
    },
    enabled: !!teamMemberId,
  });
}

// Update a single shift
// NOTE: This requires the team_shifts table to be created in Supabase
export function useUpdateTeamShift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      is_working,
      start_time,
      end_time,
    }: {
      id: string;
      is_working: boolean;
      start_time: string | null;
      end_time: string | null;
    }) => {
      // TODO: Uncomment when team_shifts table is created
      // const { data, error } = await supabase
      //   .from('team_shifts')
      //   .update({ is_working, start_time, end_time })
      //   .eq('id', id)
      //   .select()
      //   .single();

      // if (error) throw error;
      // return data;

      return { id };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['team_member_shifts'] });
    },
    onError: () => {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao atualizar horário do colaborador' 
      });
    },
  });
}

// Create or update all shifts for a team member
export function useUpsertTeamMemberShifts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      teamMemberId,
      shifts,
    }: {
      teamMemberId: string;
      shifts: Omit<TeamShift, 'id' | 'created_at' | 'updated_at'>[];
    }) => {
      // TODO: Uncomment when team_shifts table is created
      // Upsert shifts for all days
      // const { error } = await supabase.from('team_shifts').upsert(
      //   shifts.map(shift => ({
      //     ...shift,
      //     team_member_id: teamMemberId,
      //   })),
      //   {
      //     onConflict: 'team_member_id,day_of_week',
      //   }
      // );

      // if (error) throw error;
      return shifts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_member_shifts'] });
    },
    onError: () => {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao guardar horários do colaborador' 
      });
    },
  });
}

export { DAYS_ORDER, DAYS_LABELS };
