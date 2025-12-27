import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentPerformanceData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_modal: number; // Modal yang dikeluarkan
  total_contracts: number;
  total_commission: number;
  total_to_collect: number; // Total yang harus ditagih (unpaid coupons)
  total_collected: number;  // Total yang sudah tertagih
  profit: number; // Total Loan - Modal
}

export interface AgentContractHistory {
  contract_ref: string;
  customer_name: string;
  product_type: string | null;
  modal: number;
  total_loan_amount: number;
  tenor_days: number;
  start_date: string;
  status: string;
}

export const useAgentPerformance = () => {
  return useQuery({
    queryKey: ['agent_performance'],
    queryFn: async () => {
      // Get all sales agents with their commission percentage
      const { data: agents, error: agentsError } = await supabase
        .from('sales_agents')
        .select('id, name, agent_code, commission_percentage')
        .order('name');
      
      if (agentsError) throw agentsError;

      // Get all contracts with omset (modal) and loan info - now using sales_agent_id directly
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select('id, omset, total_loan_amount, sales_agent_id');
      
      if (contractsError) throw contractsError;

      // Get all unpaid coupons for calculating "to collect"
      const { data: unpaidCoupons, error: couponsError } = await supabase
        .from('installment_coupons')
        .select(`
          amount,
          contract_id,
          credit_contracts!inner(
            sales_agent_id
          )
        `)
        .eq('status', 'unpaid');
      
      if (couponsError) throw couponsError;

      // Get all payments for calculating "collected"
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_logs')
        .select(`
          amount_paid,
          contract_id,
          credit_contracts!inner(
            sales_agent_id
          )
        `);
      
      if (paymentsError) throw paymentsError;

      // Aggregate data per sales agent
      const agentDataMap = new Map<string, {
        total_modal: number;
        total_contracts: number;
        total_loan: number;
        total_to_collect: number;
        total_collected: number;
      }>();

      // Process contracts - use sales_agent_id directly from contract
      (contracts || []).forEach((contract: any) => {
        const salesAgentId = contract.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId) || {
            total_modal: 0,
            total_contracts: 0,
            total_loan: 0,
            total_to_collect: 0,
            total_collected: 0,
          };
          agentDataMap.set(salesAgentId, {
            ...existing,
            total_modal: existing.total_modal + Number(contract.omset || 0),
            total_contracts: existing.total_contracts + 1,
            total_loan: existing.total_loan + Number(contract.total_loan_amount || 0),
          });
        }
      });

      // Process unpaid coupons
      (unpaidCoupons || []).forEach((coupon: any) => {
        const salesAgentId = coupon.credit_contracts?.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId);
          if (existing) {
            existing.total_to_collect += Number(coupon.amount || 0);
          }
        }
      });

      // Process payments
      (payments || []).forEach((payment: any) => {
        const salesAgentId = payment.credit_contracts?.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId);
          if (existing) {
            existing.total_collected += Number(payment.amount_paid || 0);
          }
        }
      });

      // Combine with agent info
      const result: AgentPerformanceData[] = (agents || []).map((agent) => {
        const data = agentDataMap.get(agent.id) || {
          total_modal: 0,
          total_contracts: 0,
          total_loan: 0,
          total_to_collect: 0,
          total_collected: 0,
        };
        const commissionPct = Number(agent.commission_percentage) || 0;
        const profit = data.total_loan - data.total_modal; // Profit = Loan - Modal
        const totalCommission = (profit * commissionPct) / 100; // Komisi dari profit
        
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_modal: data.total_modal,
          total_contracts: data.total_contracts,
          total_commission: totalCommission,
          total_to_collect: data.total_to_collect,
          total_collected: data.total_collected,
          profit,
        };
      });

      // Sort by profit descending
      return result.sort((a, b) => b.profit - a.profit);
    },
  });
};

export const useAgentContractHistory = (agentId: string | null) => {
  return useQuery({
    queryKey: ['agent_contract_history', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('credit_contracts')
        .select(`
          id,
          contract_ref,
          product_type,
          omset,
          total_loan_amount,
          tenor_days,
          start_date,
          status,
          sales_agent_id,
          customers(name)
        `)
        .eq('sales_agent_id', agentId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;

      return (data || []).map((contract: any) => ({
        contract_ref: contract.contract_ref,
        customer_name: contract.customers?.name || '-',
        product_type: contract.product_type,
        modal: Number(contract.omset || 0),
        total_loan_amount: Number(contract.total_loan_amount || 0),
        tenor_days: contract.tenor_days,
        start_date: contract.start_date,
        status: contract.status,
      })) as AgentContractHistory[];
    },
    enabled: !!agentId,
  });
};
