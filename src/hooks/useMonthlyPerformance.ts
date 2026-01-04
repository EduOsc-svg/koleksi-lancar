import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, startOfYear, endOfYear } from 'date-fns';

export interface MonthlyPerformanceData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;
  total_modal: number;
  total_contracts: number;
  total_commission: number;
  total_to_collect: number;
  total_collected: number;
  profit: number;
  profit_margin: number;
}

export interface MonthlyPerformanceSummary {
  total_modal: number;
  total_omset: number;
  total_profit: number;
  total_commission: number;
  profit_margin: number;
  agents: MonthlyPerformanceData[];
}

export interface YearlyTargetData {
  total_to_collect: number;
  total_collected: number;
  collection_rate: number;
}

// Hook untuk performa bulanan (berdasarkan tanggal kontrak)
export const useMonthlyPerformance = (month: Date = new Date()) => {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['monthly_performance', monthStart, monthEnd],
    queryFn: async (): Promise<MonthlyPerformanceSummary> => {
      // Get all sales agents
      const { data: agents, error: agentsError } = await supabase
        .from('sales_agents')
        .select('id, name, agent_code, commission_percentage')
        .order('name');
      
      if (agentsError) throw agentsError;

      // Get contracts created within this month
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select('id, omset, total_loan_amount, sales_agent_id, start_date')
        .gte('start_date', monthStart)
        .lte('start_date', monthEnd);
      
      if (contractsError) throw contractsError;

      // Get payments made this month
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_logs')
        .select(`
          amount_paid,
          payment_date,
          contract_id,
          credit_contracts!inner(sales_agent_id)
        `)
        .gte('payment_date', monthStart)
        .lte('payment_date', monthEnd);
      
      if (paymentsError) throw paymentsError;

      // Aggregate per agent
      const agentDataMap = new Map<string, {
        total_omset: number;
        total_modal: number;
        total_contracts: number;
        total_collected: number;
      }>();

      // Process contracts
      (contracts || []).forEach((contract: any) => {
        const salesAgentId = contract.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId) || {
            total_omset: 0,
            total_modal: 0,
            total_contracts: 0,
            total_collected: 0,
          };
          
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

      // Process payments
      (payments || []).forEach((payment: any) => {
        const salesAgentId = payment.credit_contracts?.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId);
          if (existing) {
            existing.total_collected += Number(payment.amount_paid || 0);
          } else {
            agentDataMap.set(salesAgentId, {
              total_omset: 0,
              total_modal: 0,
              total_contracts: 0,
              total_collected: Number(payment.amount_paid || 0),
            });
          }
        }
      });

      // Build result
      const agentResults: MonthlyPerformanceData[] = (agents || []).map((agent) => {
        const data = agentDataMap.get(agent.id) || {
          total_omset: 0,
          total_modal: 0,
          total_contracts: 0,
          total_collected: 0,
        };
        const commissionPct = Number(agent.commission_percentage) || 0;
        const totalCommission = (data.total_omset * commissionPct) / 100;
        const profit = data.total_omset - data.total_modal;
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
          total_to_collect: 0,
          total_collected: data.total_collected,
          profit,
          profit_margin: profitMargin,
        };
      }).filter(a => a.total_contracts > 0 || a.total_collected > 0);

      // Calculate totals
      const total_modal = agentResults.reduce((sum, a) => sum + a.total_modal, 0);
      const total_omset = agentResults.reduce((sum, a) => sum + a.total_omset, 0);
      const total_profit = agentResults.reduce((sum, a) => sum + a.profit, 0);
      const total_commission = agentResults.reduce((sum, a) => sum + a.total_commission, 0);
      const profit_margin = total_omset > 0 ? (total_profit / total_omset) * 100 : 0;

      return {
        total_modal,
        total_omset,
        total_profit,
        total_commission,
        profit_margin,
        agents: agentResults.sort((a, b) => b.profit - a.profit),
      };
    },
  });
};

// Hook untuk target penagihan tahunan (sesuai tutup buku)
export const useYearlyTarget = (year: Date = new Date()) => {
  const yearStart = format(startOfYear(year), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(year), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['yearly_target', yearStart, yearEnd],
    queryFn: async (): Promise<YearlyTargetData> => {
      // Get all unpaid coupons for contracts that started in this year
      const { data: unpaidCoupons, error: couponsError } = await supabase
        .from('installment_coupons')
        .select(`
          amount,
          due_date,
          contract_id,
          credit_contracts!inner(start_date)
        `)
        .eq('status', 'unpaid')
        .gte('due_date', yearStart)
        .lte('due_date', yearEnd);
      
      if (couponsError) throw couponsError;

      // Get all payments made this year
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_logs')
        .select('amount_paid, payment_date')
        .gte('payment_date', yearStart)
        .lte('payment_date', yearEnd);
      
      if (paymentsError) throw paymentsError;

      const total_to_collect = (unpaidCoupons || []).reduce((sum, c: any) => sum + Number(c.amount || 0), 0);
      const total_collected = (payments || []).reduce((sum, p: any) => sum + Number(p.amount_paid || 0), 0);
      
      // Collection rate is based on total expected vs collected
      const expectedTotal = total_to_collect + total_collected;
      const collection_rate = expectedTotal > 0 ? (total_collected / expectedTotal) * 100 : 0;

      return {
        total_to_collect,
        total_collected,
        collection_rate,
      };
    },
  });
};
