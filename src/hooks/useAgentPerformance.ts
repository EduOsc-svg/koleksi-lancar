import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentPerformanceData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;  // Total revenue/penjualan dari kontrak
  total_modal: number;  // Total modal/investasi awal
  total_contracts: number;
  total_commission: number;
  total_to_collect: number; // Total yang harus ditagih (unpaid coupons)
  total_collected: number;  // Total yang sudah tertagih
  profit: number; // Omset - Modal (keuntungan bersih)
  profit_margin: number; // Persentase keuntungan
}

export interface AgentContractHistory {
  contract_ref: string;
  customer_name: string;
  customer_code: string | null;
  product_type: string | null;
  modal: number; // Modal awal kontrak
  omset: number; // Total yang dibayar customer
  profit: number; // Keuntungan = Omset - Modal
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
        total_omset: number;
        total_modal: number;
        total_contracts: number;
        total_to_collect: number;
        total_collected: number;
      }>();

      // Process contracts - use sales_agent_id directly from contract
      (contracts || []).forEach((contract: any) => {
        const salesAgentId = contract.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId) || {
            total_omset: 0,
            total_modal: 0,
            total_contracts: 0,
            total_to_collect: 0,
            total_collected: 0,
          };
          
          // Modal = field omset, Omset = total_loan_amount
          const modal = Number(contract.omset || 0);
          const omset = Number(contract.total_loan_amount || 0);
          
          agentDataMap.set(salesAgentId, {
            ...existing,
            total_omset: existing.total_omset + omset,
            total_modal: existing.total_modal + modal,
            total_contracts: existing.total_contracts + 1,
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
          total_omset: 0,
          total_modal: 0,
          total_contracts: 0,
          total_to_collect: 0,
          total_collected: 0,
        };
        const commissionPct = Number(agent.commission_percentage) || 0;
        const totalCommission = (data.total_omset * commissionPct) / 100;
        const profit = data.total_omset - data.total_modal; // Keuntungan = Omset - Modal
        const profitMargin = data.total_omset > 0 ? (profit / data.total_omset) * 100 : 0;
        
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset: data.total_omset,
          total_modal: data.total_modal,
          total_contracts: data.total_contracts,
          total_commission: totalCommission,
          total_to_collect: data.total_to_collect,
          total_collected: data.total_collected,
          profit,
          profit_margin: profitMargin,
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
          customers(
            name,
            customer_code
          )
        `)
        .eq('sales_agent_id', agentId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;

      return (data || []).map((contract: any) => {
        const modal = Number(contract.omset || 0); // Field omset sebenarnya adalah modal
        const omset = Number(contract.total_loan_amount || 0); // Total loan amount adalah omset sebenarnya
        const profit = omset - modal; // Keuntungan = Omset - Modal
        
        return {
          contract_ref: contract.contract_ref,
          customer_name: contract.customers?.name || '-',
          customer_code: contract.customers?.customer_code || null,
          product_type: contract.product_type,
          modal,
          omset,
          profit,
          tenor_days: contract.tenor_days,
          start_date: contract.start_date,
          status: contract.status,
        };
      }) as AgentContractHistory[];
    },
    enabled: !!agentId,
  });
};
