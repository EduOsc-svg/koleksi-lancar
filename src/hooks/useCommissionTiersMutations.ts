import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommissionTier } from './useCommissionTiers';

// Create a new commission tier
export const useCreateCommissionTier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tier: Omit<CommissionTier, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .insert(tier)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission_tiers'] });
    },
  });
};

// Update an existing commission tier
export const useUpdateCommissionTier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...tier }: Partial<CommissionTier> & { id: string }) => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .update(tier)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission_tiers'] });
    },
  });
};

// Delete a commission tier
export const useDeleteCommissionTier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commission_tiers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission_tiers'] });
    },
  });
};
