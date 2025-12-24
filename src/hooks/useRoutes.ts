import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';

export interface Route {
  id: string;
  code: string;
  name: string;
  default_collector_id: string | null;
  created_at: string;
}

export interface RouteWithSales extends Route {
  sales_agents: { name: string } | null;
}

export const useRoutes = () => {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*, sales_agents(name)')
        .order('code');
      if (error) throw error;
      return data as RouteWithSales[];
    },
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (route: Omit<Route, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('routes')
        .insert(route)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      
      logActivity.mutate({
        action: 'CREATE',
        entity_type: 'route',
        entity_id: data.id,
        description: `Created route ${data.name} (${data.code})`,
        route_id: data.id,
      });
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async ({ id, ...route }: Partial<Route> & { id: string }) => {
      const { data, error } = await supabase
        .from('routes')
        .update(route)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      
      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'route',
        entity_id: data.id,
        description: `Updated route ${data.name}`,
        route_id: data.id,
      });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get route info before deleting
      const { data: routeData } = await supabase
        .from('routes')
        .select('name, code')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, name: routeData?.name, code: routeData?.code };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      
      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'route',
        entity_id: data.id,
        description: `Deleted route ${data.name || data.id}`,
      });
    },
  });
};
