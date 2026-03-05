import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear, endOfYear, format, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { calculateTieredCommission, CommissionTier } from './useCommissionTiers';

export type ContractStatusFilter = 'all' | 'lancar' | 'kurang_lancar' | 'macet' | 'completed';

export interface MonthlyBreakdown {
  month: string;
  monthLabel: string;
  total_modal: number;
  total_omset: number;
  profit: number;
  commission: number;
  collected: number;
  operational: number;
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

export interface MonthlyContractDetail {
  agent_code: string;
  customer_name: string;
  product_type: string;
  price: number; // total_loan_amount (harga barang / omset)
  modal: number;
  omset: number;
  commission: number;
  net_profit: number;
}

export interface MonthlyDetailData {
  monthKey: string;
  monthLabel: string;
  contracts: MonthlyContractDetail[];
  operational_expenses: { description: string; amount: number; category: string | null }[];
  total_operational: number;
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
  completed_count: number;
  active_count: number;
  lancar_count: number;
  kurang_lancar_count: number;
  macet_count: number;
  profit_margin: number;
  collection_rate: number;
  monthly_breakdown: MonthlyBreakdown[];
  agents: AgentYearlyPerformance[];
  monthly_details: MonthlyDetailData[];
}

// Calculate dynamic contract status based on days_per_due metric
const calculateContractStatus = (contract: {
  status: string;
  current_installment_index: number;
  created_at: string;
}): 'completed' | 'lancar' | 'kurang_lancar' | 'macet' => {
  if (contract.status === 'completed') return 'completed';
  
  const daysSinceCreation = differenceInDays(new Date(), new Date(contract.created_at));
  const installmentsPaid = contract.current_installment_index;
  
  // Avoid division by zero
  if (installmentsPaid === 0) {
    // No payments yet - check how long since contract started
    return daysSinceCreation > 7 ? 'macet' : daysSinceCreation > 3 ? 'kurang_lancar' : 'lancar';
  }
  
  const daysPerDue = daysSinceCreation / installmentsPaid;
  
  // Status tiers based on days_per_due metric
  if (daysPerDue <= 1.2) return 'lancar';
  if (daysPerDue <= 2.0) return 'kurang_lancar';
  return 'macet';
};

export const useYearlyFinancialSummary = (year: Date = new Date(), statusFilter: ContractStatusFilter = 'all') => {
  const yearStart = format(startOfYear(year), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(year), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['yearly_financial_summary', yearStart, yearEnd, statusFilter],
    queryFn: async (): Promise<YearlyFinancialSummary> => {
      // Fetch all data in parallel
      const [
        { data: agents, error: agentsError },
        { data: contracts, error: contractsError },
        { data: payments, error: paymentsError },
        { data: expenses, error: expensesError },
        { data: unpaidCoupons, error: couponsError },
        { data: commissionTiers, error: tiersError },
      ] = await Promise.all([
        supabase.from('sales_agents').select('id, name, agent_code, commission_percentage, use_tiered_commission').order('name'),
        // Get contracts started in this year
        supabase.from('credit_contracts').select('id, omset, total_loan_amount, sales_agent_id, start_date, status, current_installment_index, tenor_days, created_at, product_type, customer_id, customers(name)')
          .gte('start_date', yearStart)
          .lte('start_date', yearEnd),
        supabase.from('payment_logs').select('amount_paid, payment_date, contract_id, credit_contracts!inner(sales_agent_id)').gte('payment_date', yearStart).lte('payment_date', yearEnd),
        supabase.from('operational_expenses').select('amount, expense_date, description, category').gte('expense_date', yearStart).lte('expense_date', yearEnd),
        supabase.from('installment_coupons').select('amount, due_date, contract_id').eq('status', 'unpaid').gte('due_date', yearStart).lte('due_date', yearEnd),
        supabase.from('commission_tiers').select('*').order('min_amount', { ascending: true }),
      ]);

      if (agentsError) throw agentsError;
      if (contractsError) throw contractsError;
      if (paymentsError) throw paymentsError;
      if (expensesError) throw expensesError;
      if (couponsError) throw couponsError;
      if (tiersError) throw tiersError;

      const tiers = (commissionTiers || []) as CommissionTier[];

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
          operational: 0,
          contracts_count: 0,
        });
      });

      // Agent performance calculation - track per-contract commission
      const agentDataMap = new Map<string, {
        total_modal: number;
        total_omset: number;
        total_commission: number;
        contracts_count: number;
      }>();

      // Process contracts - Modal = omset field, Omset = total_loan_amount
      let totalModal = 0;
      let totalOmset = 0;
      let totalCommission = 0;
      let totalContractsCount = 0;
      let completedCount = 0;
      let activeCount = 0;
      let lancarCount = 0;
      let kurangLancarCount = 0;
      let macetCount = 0;

      // Filter contracts relevant to the selected year and apply status filter
      const relevantContracts = (contracts || []).filter((contract: any) => {
        const startDate = new Date(contract.start_date);
        const contractYear = startDate.getFullYear();
        const selectedYear = year.getFullYear();
        
        // First check if contract is in the selected year
        if (contractYear > selectedYear) return false;
        
        // Calculate dynamic status
        const dynamicStatus = calculateContractStatus(contract);
        
        // Apply status filter
        if (statusFilter !== 'all' && dynamicStatus !== statusFilter) {
          return false;
        }
        
        return true;
      });

      relevantContracts.forEach((contract: any) => {
        const dynamicStatus = calculateContractStatus(contract);
        const monthKey = format(new Date(contract.start_date), 'yyyy-MM');
        const modal = Number(contract.omset || 0);  // omset field is actually Modal
        const omset = Number(contract.total_loan_amount || 0);  // total_loan_amount is Omset
        const profit = omset - modal;
        
        // Calculate commission using tiered system based on contract omset
        const commissionPct = calculateTieredCommission(omset, tiers);
        const commission = (omset * commissionPct) / 100;

        totalModal += modal;
        totalOmset += omset;
        totalCommission += commission;
        totalContractsCount++;
        
        // Count by dynamic status
        switch (dynamicStatus) {
          case 'completed':
            completedCount++;
            break;
          case 'lancar':
            lancarCount++;
            activeCount++;
            break;
          case 'kurang_lancar':
            kurangLancarCount++;
            activeCount++;
            break;
          case 'macet':
            macetCount++;
            activeCount++;
            break;
        }

        // Update monthly breakdown
        const monthData = monthlyData.get(monthKey);
        if (monthData) {
          monthData.total_modal += modal;
          monthData.total_omset += omset;
          monthData.profit += profit;
          monthData.commission += commission;
          monthData.contracts_count++;
        }

        // Update agent performance with per-contract commission
        const salesAgentId = contract.sales_agent_id;
        if (salesAgentId) {
          const existing = agentDataMap.get(salesAgentId) || {
            total_modal: 0,
            total_omset: 0,
            total_commission: 0,
            contracts_count: 0,
          };
          agentDataMap.set(salesAgentId, {
            total_modal: existing.total_modal + modal,
            total_omset: existing.total_omset + omset,
            total_commission: existing.total_commission + commission,
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

      // Process expenses by month
      let totalExpenses = 0;
      (expenses || []).forEach((exp: any) => {
        const monthKey = format(new Date(exp.expense_date), 'yyyy-MM');
        const amount = Number(exp.amount || 0);
        totalExpenses += amount;
        const monthData = monthlyData.get(monthKey);
        if (monthData) {
          monthData.operational += amount;
        }
      });

      // Calculate totals
      const totalProfit = totalOmset - totalModal;
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
          total_commission: 0,
          contracts_count: 0,
        };
        const profit = data.total_omset - data.total_modal;

        // Calculate average commission percentage for display
        const avgCommissionPct = data.total_omset > 0 
          ? (data.total_commission / data.total_omset) * 100 
          : 0;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: avgCommissionPct,
          total_modal: data.total_modal,
          total_omset: data.total_omset,
          profit,
          total_commission: data.total_commission,
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
        completed_count: completedCount,
        active_count: activeCount,
        lancar_count: lancarCount,
        kurang_lancar_count: kurangLancarCount,
        macet_count: macetCount,
        profit_margin: profitMargin,
        collection_rate: collectionRate,
        monthly_breakdown: Array.from(monthlyData.values()),
        agents: agentResults,
      };
    },
  });
};
