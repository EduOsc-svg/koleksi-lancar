import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentOmsetData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;
  total_contracts: number;
  total_commission: number;
}

export const useAgentOmset = () => {
  return useQuery({
    queryKey: ['agent_omset'],
    queryFn: async () => {
      // Get all sales agents with their commission percentage
      const { data: agents, error: agentsError } = await supabase
        .from('sales_agents')
        .select('id, name, agent_code, commission_percentage')
        .order('name');
      
      if (agentsError) throw agentsError;

      // Get all contracts with omset, linked via customer -> assigned_sales_id
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select(`
          id,
          omset,
          customer_id,
          customers!inner(
            assigned_sales_id
          )
        `)
        .gt('omset', 0);
      
      if (contractsError) throw contractsError;

      // Aggregate omset per sales agent
      const agentOmsetMap = new Map<string, { total_omset: number; total_contracts: number }>();

      (contracts || []).forEach((contract: any) => {
        const salesAgentId = contract.customers?.assigned_sales_id;
        if (salesAgentId) {
          const existing = agentOmsetMap.get(salesAgentId) || { total_omset: 0, total_contracts: 0 };
          agentOmsetMap.set(salesAgentId, {
            total_omset: existing.total_omset + Number(contract.omset || 0),
            total_contracts: existing.total_contracts + 1,
          });
        }
      });

      // Combine with agent info
      const result: AgentOmsetData[] = (agents || []).map((agent) => {
        const omsetData = agentOmsetMap.get(agent.id) || { total_omset: 0, total_contracts: 0 };
        const commissionPct = Number(agent.commission_percentage) || 0;
        const totalCommission = (omsetData.total_omset * commissionPct) / 100;
        
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset: omsetData.total_omset,
          total_contracts: omsetData.total_contracts,
          total_commission: totalCommission,
        };
      });

      return result;
    },
  });
};
