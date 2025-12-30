import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentOmsetData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number; // Total revenue dari loan amount
  total_modal: number; // Total modal dari field omset
  total_contracts: number;
  total_commission: number;
  profit: number; // Keuntungan = Omset - Modal
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

      // Get all contracts with omset and total_loan_amount, linked via customer -> assigned_sales_id
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select(`
          id,
          omset,
          total_loan_amount,
          customer_id,
          customers!inner(
            assigned_sales_id
          )
        `);
      
      if (contractsError) throw contractsError;

      // Aggregate data per sales agent
      const agentOmsetMap = new Map<string, { 
        total_omset: number; 
        total_modal: number;
        total_contracts: number; 
      }>();

      (contracts || []).forEach((contract: any) => {
        const salesAgentId = contract.customers?.assigned_sales_id;
        if (salesAgentId) {
          const existing = agentOmsetMap.get(salesAgentId) || { 
            total_omset: 0, 
            total_modal: 0,
            total_contracts: 0 
          };
          
          // Modal = field omset, Omset = total_loan_amount
          const modal = Number(contract.omset || 0);
          const omset = Number(contract.total_loan_amount || 0);
          
          agentOmsetMap.set(salesAgentId, {
            total_omset: existing.total_omset + omset,
            total_modal: existing.total_modal + modal,
            total_contracts: existing.total_contracts + 1,
          });
        }
      });

      // Combine with agent info
      const result: AgentOmsetData[] = (agents || []).map((agent) => {
        const data = agentOmsetMap.get(agent.id) || { 
          total_omset: 0, 
          total_modal: 0,
          total_contracts: 0 
        };
        const commissionPct = Number(agent.commission_percentage) || 0;
        const totalCommission = (data.total_omset * commissionPct) / 100;
        const profit = data.total_omset - data.total_modal; // Keuntungan = Omset - Modal
        
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset: data.total_omset,
          total_modal: data.total_modal,
          total_contracts: data.total_contracts,
          total_commission: totalCommission,
          profit,
        };
      });

      return result;
    },
  });
};
