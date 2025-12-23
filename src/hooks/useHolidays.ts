import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';

export interface Holiday {
  id: string;
  holiday_date: string | null;
  description: string | null;
  holiday_type: 'specific_date' | 'recurring_weekday';
  day_of_week: number | null;
  created_at: string;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useHolidays = () => {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('holiday_date', { ascending: true });
      if (error) throw error;
      return data as Holiday[];
    },
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async (holiday: { 
      holiday_type: 'specific_date' | 'recurring_weekday';
      holiday_date?: string | null; 
      day_of_week?: number | null;
      description?: string | null 
    }) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert(holiday)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      const desc = data.holiday_type === 'specific_date' 
        ? `Added holiday: ${data.holiday_date} - ${data.description || 'No description'}`
        : `Added recurring holiday: Every ${DAY_NAMES[data.day_of_week || 0]} - ${data.description || 'No description'}`;
      logActivity.mutate({
        action: 'CREATE',
        entity_type: 'holiday',
        entity_id: data.id,
        description: desc,
      });
    },
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, ...holiday }: Partial<Holiday> & { id: string }) => {
      const { data, error } = await supabase
        .from('holidays')
        .update(holiday)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'holiday',
        entity_id: data.id,
        description: `Updated holiday: ${data.holiday_date}`,
      });
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: holidayData } = await supabase
        .from('holidays')
        .select('holiday_date, description')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, ...holidayData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'holiday',
        entity_id: data.id,
        description: `Deleted holiday: ${data.holiday_date || data.id}`,
      });
    },
  });
};
