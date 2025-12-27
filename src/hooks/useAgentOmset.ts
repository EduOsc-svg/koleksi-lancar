import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentOmsetData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_modal: number;
  total_loan: number;
  total_contracts: number;
  profit: number;
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

      // Get all contracts with omset (modal) and loan, linked via sales_agent_id directly
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select('id, omset, total_loan_amount, sales_agent_id');
      
      if (contractsError) throw contractsError;

      // Aggregate data per sales agent
      const agentDataMap = new Map<string, { 
        total_modal: number; 
        total_loan: number;
        total_contracts: number 
      }>();

      (contracts || []).forEach((contract: any) => {
        const salesAgentId = contract.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId) || { 
            total_modal: 0, 
            total_loan: 0,
            total_contracts: 0 
          };
          agentDataMap.set(salesAgentId, {
            total_modal: existing.total_modal + Number(contract.omset || 0),
            total_loan: existing.total_loan + Number(contract.total_loan_amount || 0),
            total_contracts: existing.total_contracts + 1,
          });
        }
      });

      // Combine with agent info
      const result: AgentOmsetData[] = (agents || []).map((agent) => {
        const data = agentDataMap.get(agent.id) || { 
          total_modal: 0, 
          total_loan: 0,
          total_contracts: 0 
        };
        const commissionPct = Number(agent.commission_percentage) || 0;
        const profit = data.total_loan - data.total_modal;
        const totalCommission = (profit * commissionPct) / 100;
        
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_modal: data.total_modal,
          total_loan: data.total_loan,
          total_contracts: data.total_contracts,
          profit,
          total_commission: totalCommission,
        };
      });

      return result;
    },
  });
};
