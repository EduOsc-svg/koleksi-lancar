import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentPerformanceData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;
  total_contracts: number;
  total_commission: number;
  total_to_collect: number; // Total yang harus ditagih (unpaid coupons)
  total_collected: number;  // Total yang sudah tertagih
  profit: number; // Omset - Total Loan
}

export interface AgentCollectionHistory {
  payment_date: string;
  amount_paid: number;
  customer_name: string;
  contract_ref: string;
  installment_index: number;
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

      // Get all contracts with omset and loan info
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

      // Get all unpaid coupons for calculating "to collect"
      const { data: unpaidCoupons, error: couponsError } = await supabase
        .from('installment_coupons')
        .select(`
          amount,
          contract_id,
          credit_contracts!inner(
            customer_id,
            customers!inner(
              assigned_sales_id
            )
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
            customer_id,
            customers!inner(
              assigned_sales_id
            )
          )
        `);
      
      if (paymentsError) throw paymentsError;

      // Aggregate data per sales agent
      const agentDataMap = new Map<string, {
        total_omset: number;
        total_contracts: number;
        total_loan: number;
        total_to_collect: number;
        total_collected: number;
      }>();

      // Process contracts
      (contracts || []).forEach((contract: any) => {
        const salesAgentId = contract.customers?.assigned_sales_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId) || {
            total_omset: 0,
            total_contracts: 0,
            total_loan: 0,
            total_to_collect: 0,
            total_collected: 0,
          };
          agentDataMap.set(salesAgentId, {
            ...existing,
            total_omset: existing.total_omset + Number(contract.omset || 0),
            total_contracts: existing.total_contracts + 1,
            total_loan: existing.total_loan + Number(contract.total_loan_amount || 0),
          });
        }
      });

      // Process unpaid coupons
      (unpaidCoupons || []).forEach((coupon: any) => {
        const salesAgentId = coupon.credit_contracts?.customers?.assigned_sales_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId);
          if (existing) {
            existing.total_to_collect += Number(coupon.amount || 0);
          }
        }
      });

      // Process payments
      (payments || []).forEach((payment: any) => {
        const salesAgentId = payment.credit_contracts?.customers?.assigned_sales_id;
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
          total_contracts: 0,
          total_loan: 0,
          total_to_collect: 0,
          total_collected: 0,
        };
        const commissionPct = Number(agent.commission_percentage) || 0;
        const totalCommission = (data.total_omset * commissionPct) / 100;
        const profit = data.total_omset - data.total_loan;
        
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset: data.total_omset,
          total_contracts: data.total_contracts,
          total_commission: totalCommission,
          total_to_collect: data.total_to_collect,
          total_collected: data.total_collected,
          profit,
        };
      });

      // Sort by total_omset descending
      return result.sort((a, b) => b.total_omset - a.total_omset);
    },
  });
};

export const useAgentCollectionHistory = (agentId: string | null) => {
  return useQuery({
    queryKey: ['agent_collection_history', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data, error } = await supabase
        .from('payment_logs')
        .select(`
          id,
          payment_date,
          amount_paid,
          installment_index,
          credit_contracts!inner(
            contract_ref,
            customer_id,
            customers!inner(
              name,
              assigned_sales_id
            )
          )
        `)
        .order('payment_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Filter by sales agent
      const filtered = (data || []).filter((payment: any) => 
        payment.credit_contracts?.customers?.assigned_sales_id === agentId
      );

      return filtered.map((payment: any) => ({
        payment_date: payment.payment_date,
        amount_paid: Number(payment.amount_paid),
        customer_name: payment.credit_contracts?.customers?.name || '-',
        contract_ref: payment.credit_contracts?.contract_ref || '-',
        installment_index: payment.installment_index,
      })) as AgentCollectionHistory[];
    },
    enabled: !!agentId,
  });
};
