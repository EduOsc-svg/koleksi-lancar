import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear, endOfYear, format, eachMonthOfInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export interface MonthlyBreakdown {
  month: string;
  monthLabel: string;
  total_modal: number;
  total_omset: number;
  profit: number;
  commission: number;
  collected: number;
  contracts_count: number;
}

export interface AgentYearlyPerformance {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_modal: number;
  total_omset: number;
  profit: number;
  total_commission: number;
  contracts_count: number;
}

export interface YearlyFinancialSummary {
  total_modal: number;
  total_omset: number;
  total_profit: number;
  total_commission: number;
  total_collected: number;
  total_to_collect: number;
  total_expenses: number;
  net_profit: number;
  contracts_count: number;
  profit_margin: number;
  collection_rate: number;
  monthly_breakdown: MonthlyBreakdown[];
  agents: AgentYearlyPerformance[];
}

export const useYearlyFinancialSummary = (year: Date = new Date()) => {
  const yearStart = format(startOfYear(year), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(year), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['yearly_financial_summary', yearStart, yearEnd],
    queryFn: async (): Promise<YearlyFinancialSummary> => {
      // Fetch all data in parallel
      const [
        { data: agents, error: agentsError },
        { data: contracts, error: contractsError },
        { data: payments, error: paymentsError },
        { data: expenses, error: expensesError },
        { data: unpaidCoupons, error: couponsError },
      ] = await Promise.all([
        supabase.from('sales_agents').select('id, name, agent_code, commission_percentage').order('name'),
        supabase.from('credit_contracts').select('id, omset, total_loan_amount, sales_agent_id, start_date').gte('start_date', yearStart).lte('start_date', yearEnd),
        supabase.from('payment_logs').select('amount_paid, payment_date, contract_id, credit_contracts!inner(sales_agent_id)').gte('payment_date', yearStart).lte('payment_date', yearEnd),
        supabase.from('operational_expenses').select('amount, expense_date').gte('expense_date', yearStart).lte('expense_date', yearEnd),
        supabase.from('installment_coupons').select('amount, due_date, contract_id').eq('status', 'unpaid').gte('due_date', yearStart).lte('due_date', yearEnd),
      ]);

      if (agentsError) throw agentsError;
      if (contractsError) throw contractsError;
      if (paymentsError) throw paymentsError;
      if (expensesError) throw expensesError;
      if (couponsError) throw couponsError;

      // Monthly breakdown calculation
      const months = eachMonthOfInterval({ start: startOfYear(year), end: endOfYear(year) });
      const monthlyData: Map<string, MonthlyBreakdown> = new Map();
      
      months.forEach(monthDate => {
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyData.set(monthKey, {
          month: monthKey,
          monthLabel: format(monthDate, 'MMM yyyy', { locale: idLocale }),
          total_modal: 0,
          total_omset: 0,
          profit: 0,
          commission: 0,
          collected: 0,
          contracts_count: 0,
        });
      });

      // Agent performance calculation
      const agentDataMap = new Map<string, {
        total_modal: number;
        total_omset: number;
        contracts_count: number;
      }>();

      // Process contracts - Modal = omset field, Omset = total_loan_amount
      let totalModal = 0;
      let totalOmset = 0;
      let totalContractsCount = 0;

      (contracts || []).forEach((contract: any) => {
        const monthKey = format(new Date(contract.start_date), 'yyyy-MM');
        const modal = Number(contract.omset || 0);  // omset field is actually Modal
        const omset = Number(contract.total_loan_amount || 0);  // total_loan_amount is Omset
        const profit = omset - modal;
        const commission = omset * 0.05;  // 5% commission

        totalModal += modal;
        totalOmset += omset;
        totalContractsCount++;

        // Update monthly breakdown
        const monthData = monthlyData.get(monthKey);
        if (monthData) {
          monthData.total_modal += modal;
          monthData.total_omset += omset;
          monthData.profit += profit;
          monthData.commission += commission;
          monthData.contracts_count++;
        }

        // Update agent performance
        const salesAgentId = contract.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId) || {
            total_modal: 0,
            total_omset: 0,
            contracts_count: 0,
          };
          agentDataMap.set(salesAgentId, {
            total_modal: existing.total_modal + modal,
            total_omset: existing.total_omset + omset,
            contracts_count: existing.contracts_count + 1,
          });
        }
      });

      // Process payments
      let totalCollected = 0;
      (payments || []).forEach((payment: any) => {
        const monthKey = format(new Date(payment.payment_date), 'yyyy-MM');
        const amount = Number(payment.amount_paid || 0);
        totalCollected += amount;

        const monthData = monthlyData.get(monthKey);
        if (monthData) {
          monthData.collected += amount;
        }
      });

      // Calculate totals
      const totalProfit = totalOmset - totalModal;
      const totalCommission = totalOmset * 0.05;
      const totalExpenses = (expenses || []).reduce((sum, exp: any) => sum + Number(exp.amount || 0), 0);
      const totalToCollect = (unpaidCoupons || []).reduce((sum, c: any) => sum + Number(c.amount || 0), 0);
      const netProfit = totalProfit - totalCommission - totalExpenses;
      const profitMargin = totalOmset > 0 ? (totalProfit / totalOmset) * 100 : 0;
      const expectedTotal = totalToCollect + totalCollected;
      const collectionRate = expectedTotal > 0 ? (totalCollected / expectedTotal) * 100 : 0;

      // Build agent results
      const agentResults: AgentYearlyPerformance[] = (agents || []).map((agent) => {
        const data = agentDataMap.get(agent.id) || {
          total_modal: 0,
          total_omset: 0,
          contracts_count: 0,
        };
        const profit = data.total_omset - data.total_modal;
        const totalAgentCommission = data.total_omset * (Number(agent.commission_percentage) || 0) / 100;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: Number(agent.commission_percentage) || 0,
          total_modal: data.total_modal,
          total_omset: data.total_omset,
          profit,
          total_commission: totalAgentCommission,
          contracts_count: data.contracts_count,
        };
      }).filter(a => a.contracts_count > 0)
        .sort((a, b) => b.total_omset - a.total_omset);

      return {
        total_modal: totalModal,
        total_omset: totalOmset,
        total_profit: totalProfit,
        total_commission: totalCommission,
        total_collected: totalCollected,
        total_to_collect: totalToCollect,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        contracts_count: totalContractsCount,
        profit_margin: profitMargin,
        collection_rate: collectionRate,
        monthly_breakdown: Array.from(monthlyData.values()),
        agents: agentResults,
      };
    },
  });
};
