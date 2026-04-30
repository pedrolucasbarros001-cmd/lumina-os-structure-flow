// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffBlockedTime {
  id: string;
  team_member_id: string;
  unit_id: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  is_recurring: boolean;
  status: 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface StaffBlockReason {
  id: string;
  unit_id: string;
  reason: string;
  color_hex: string;
  created_at: string;
}

// Fetch blocked time for a staff member in a date range
export function useStaffBlockedTime(
  teamMemberId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['staff_blocked_time', teamMemberId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('staff_blocked_time')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .eq('status', 'active');

      if (startDate && endDate) {
        query = query
          .gte('end_time', startDate)
          .lte('start_time', endDate);
      }

      const { data, error } = await query.order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!teamMemberId,
  });
}

// Fetch all blocked time for a unit
export function useUnitBlockedTime(unitId: string) {
  return useQuery({
    queryKey: ['unit_blocked_time', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_blocked_time')
        .select('*')
        .eq('unit_id', unitId)
        .eq('status', 'active')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!unitId,
  });
}

// Fetch block reasons for a unit
export function useStaffBlockReasons(unitId: string) {
  return useQuery({
    queryKey: ['staff_block_reasons', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_block_reasons')
        .select('*')
        .eq('unit_id', unitId)
        .order('reason', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!unitId,
  });
}

// Create new blocked time
export function useCreateBlockedTime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      team_member_id: string;
      unit_id: string;
      start_time: string;
      end_time: string;
      title: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('staff_blocked_time')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['staff_blocked_time', data.team_member_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['unit_blocked_time', data.unit_id],
      });
      toast({ title: 'Período bloqueado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao bloquear período',
        description: error?.message,
      });
    },
  });
}

// Update blocked time
export function useUpdateBlockedTime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      start_time?: string;
      end_time?: string;
      title?: string;
      description?: string;
      team_member_id: string;
      unit_id: string;
    }) => {
      const { id, team_member_id, unit_id, ...updates } = input;
      const { data, error } = await supabase
        .from('staff_blocked_time')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['staff_blocked_time', data.team_member_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['unit_blocked_time', data.unit_id],
      });
      toast({ title: 'Período actualizado!' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao actualizar',
        description: error?.message,
      });
    },
  });
}

// Delete blocked time (soft delete)
export function useDeleteBlockedTime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_blocked_time')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['staff_blocked_time'] });
      queryClient.invalidateQueries({ queryKey: ['unit_blocked_time'] });
      toast({ title: 'Período removido!' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: error?.message,
      });
    },
  });
}

// Check if staff member is available at a specific time
export function isStaffAvailable(
  blockedTimes: StaffBlockedTime[],
  startTime: Date,
  endTime: Date
): boolean {
  return !blockedTimes.some((block) => {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    
    // Check for overlap
    return startTime < blockEnd && endTime > blockStart;
  });
}

// Get next available slot for staff (considering blocked times)
export function getNextAvailableSlot(
  blockedTimes: StaffBlockedTime[],
  desiredTime: Date,
  durationMinutes: number = 60
): Date | null {
  const endTime = new Date(desiredTime.getTime() + durationMinutes * 60000);
  
  // Check if desired time is available
  if (isStaffAvailable(blockedTimes, desiredTime, endTime)) {
    return desiredTime;
  }
  
  // Find next available slot
  let currentSlot = new Date(desiredTime);
  const maxIterations = 288; // Check next 48 hours (30-min intervals = 96 slots/day)
  
  for (let i = 0; i < maxIterations; i++) {
    currentSlot = new Date(currentSlot.getTime() + 30 * 60000); // 30-min increment
    const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);
    
    if (isStaffAvailable(blockedTimes, currentSlot, slotEnd)) {
      return currentSlot;
    }
  }
  
  return null; // No availability found
}
