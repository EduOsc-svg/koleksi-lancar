import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  details: Json | null;
  customer_id: string | null;
  contract_id: string | null;
  sales_agent_id: string | null;
  route_id: string | null;
  created_at: string;
}

export interface LogActivityParams {
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  details?: Json;
  customer_id?: string;
  contract_id?: string;
  sales_agent_id?: string;
  route_id?: string;
}

export const useActivityLogs = (limit: number = 100) => {
  return useQuery({
    queryKey: ['activity_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLog[];
    },
  });
};

export const useLogActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: LogActivityParams) => {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      
      let userName = user?.email || 'Unknown';
      let userRole = 'user';

      // Try to get user role
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (roleData) {
          userRole = roleData.role;
        }
      }

      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || null,
          user_name: userName,
          user_role: userRole,
          action: params.action,
          entity_type: params.entity_type,
          entity_id: params.entity_id || null,
          description: params.description,
          details: params.details || null,
          customer_id: params.customer_id || null,
          contract_id: params.contract_id || null,
          sales_agent_id: params.sales_agent_id || null,
          route_id: params.route_id || null,
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
    },
  });
};