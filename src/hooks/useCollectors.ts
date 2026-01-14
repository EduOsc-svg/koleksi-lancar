import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';

export interface Collector {
  id: string;
  collector_code: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export const useCollectors = () => {
  return useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collectors')
        .select('*')
        .order('collector_code');
      if (error) throw error;
      return data as Collector[];
    },
  });
};

export const useCreateCollector = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (collector: Omit<Collector, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('collectors')
        .insert(collector)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      
      logActivity.mutate({
        action: 'CREATE',
        entity_type: 'collector',
        entity_id: data.id,
        description: `Created collector ${data.name} (${data.collector_code})`,
      });
    },
  });
};

export const useUpdateCollector = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async ({ id, ...collector }: Partial<Collector> & { id: string }) => {
      const { data, error } = await supabase
        .from('collectors')
        .update(collector)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      
      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'collector',
        entity_id: data.id,
        description: `Updated collector ${data.name}`,
      });
    },
  });
};

export const useDeleteCollector = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: collectorData } = await supabase
        .from('collectors')
        .select('name, collector_code')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('collectors')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, name: collectorData?.name, collector_code: collectorData?.collector_code };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] });
      
      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'collector',
        entity_id: data.id,
        description: `Deleted collector ${data.name || data.id}`,
      });
    },
  });
};
