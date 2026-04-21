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
  modal: number;
  omset: number;
  commission: number;
  net_profit: number;
  start_date?: string;
  contract_ref?: string;
}

export interface MonthlyDetailData {
  monthKey: string;
  monthLabel: string;
  contracts: MonthlyContractDetail[];
  operational_expenses: { description: string; amount: number; category: string | null }[];
  total_operational: number;
  total_omset?: number;
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
  net_profit_pct: number;
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
        supabase.from('credit_contracts').select('id, contract_ref, omset, total_loan_amount, sales_agent_id, start_date, status, current_installment_index, tenor_days, created_at, product_type, customer_id, customers(name)')
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
      // Diagnostic: log tiers fetched (helpful to verify DB values during debugging)
      if (process.env.NODE_ENV !== 'production') {
        try {
          // eslint-disable-next-line no-console
          console.debug('[yearlySummary] commission tiers:', JSON.stringify(tiers));
        } catch (err) {
          /* ignore */
        }
      }

      // Build agent lookup map
      const agentLookup = new Map<string, { code: string; name: string }>();
      (agents || []).forEach(a => agentLookup.set(a.id, { code: a.agent_code, name: a.name }));

      // Monthly breakdown calculation
      const months = eachMonthOfInterval({ start: startOfYear(year), end: endOfYear(year) });
  const monthlyData: Map<string, MonthlyBreakdown> = new Map();
  const monthlyContractDetails: Map<string, MonthlyContractDetail[]> = new Map();
  const monthlyExpenseDetails: Map<string, { description: string; amount: number; category: string | null }[]> = new Map();
  // track per-month, per-agent collected totals (based on actual payments)
  const monthlyAgentTotals: Map<string, Record<string, number>> = new Map();
  // payments by month and contract (used to populate contract-level collected amounts)
  const paymentsByMonthContract: Map<string, Record<string, number>> = new Map();
  // aggregate per-agent for whole year based on payments
  const agentTotalsYear: Map<string, number> = new Map();
      
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
        monthlyContractDetails.set(monthKey, []);
        monthlyExpenseDetails.set(monthKey, []);
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
  // We no longer treat contract.total_loan_amount as realized omset here.
  // Omset (revenue) will be derived from actual payments (payment_logs) per month.
  const omset = 0;
  const profit = 0; // will compute profit/net after assigning collected amounts
        
        // Calculate commission using tiered system based on contract omset
  // Do not compute per-contract commission here. We'll compute monthly/agent commissions
  // using the tier rules applied to aggregated totals (to keep consistency with Sales page).
  totalModal += modal;
  totalOmset += omset;
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
          // Do not add per-contract commission; compute monthly commission later from month total
          monthData.contracts_count++;
        }

        // Add to monthly contract details (omset/collected will be filled later from payments)
        const agentInfo = contract.sales_agent_id ? agentLookup.get(contract.sales_agent_id) : null;
        const customerName = (contract as any).customers?.name || 'N/A';
        const details = monthlyContractDetails.get(monthKey);
        if (details) {
          // Store basic contract detail for now; we will allocate commission proportionally later
          details.push({
            agent_code: agentInfo?.code || '-',
            customer_name: customerName,
            product_type: contract.product_type || '-',
            modal,
            omset: 0,
            commission: 0, // placeholder, will be filled after monthly totals known
            net_profit: 0, // will adjust after collected & commission allocation
            start_date: contract.start_date,
            contract_ref: (contract as any).contract_ref || (contract.id || '').toString(),
          });
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
            // we'll compute total_commission from aggregated total_omset later
            total_commission: existing.total_commission,
            contracts_count: existing.contracts_count + 1,
          });
        }
      });

      // After processing all contracts, we'll compute monthly commissions using per-agent totals
      // derived from actual payments (not contract nominal values). Allocate commission
      // proportionally to contracts in that month based on collected amounts.
      let recomputedTotalCommission = 0;
      months.forEach((monthDate) => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const md = monthlyData.get(monthKey)!;

        // At this point monthlyAgentTotals (per-month/per-agent totals) will be populated
        // from the payments processing below. If there is no data, monthCommission stays 0.
        const agentTotals = monthlyAgentTotals.get(monthKey) || {};
        let monthCommission = 0;
        Object.entries(agentTotals).forEach(([agentKey, agentTotal]) => {
          const pct = agentTotal > 0 ? calculateTieredCommission(agentTotal, tiers) : 0;
          monthCommission += (agentTotal * pct) / 100;
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug(`[yearlySummary] month=${monthKey} agent=${agentKey} collected=${agentTotal} pct=${pct}`);
          }
        });

        md.commission = monthCommission;
        recomputedTotalCommission += monthCommission;

        // Allocate commission proportionally to each contract in the month (based on collected amounts)
        const details = monthlyContractDetails.get(monthKey) || [];
        if (md.total_omset > 0 && details.length > 0) {
          details.forEach((d) => {
            const collectedForContract = paymentsByMonthContract.get(monthKey)?.[d.contract_ref || ''] || 0;
            d.omset = collectedForContract;
            const share = md.total_omset > 0 ? (collectedForContract / md.total_omset) : 0;
            const allocated = monthCommission * share;
            d.commission = allocated;
            d.net_profit = (d.omset - d.modal) - allocated;
          });
        }
      });

      // Replace totalCommission aggregated per-contract with recomputed monthly-based total
      totalCommission = recomputedTotalCommission;

      // Process payments: build per-month, per-contract collected amounts and
      // per-month/per-agent aggregates (we'll use these as "real" omset values)
      let totalCollected = 0;
      (payments || []).forEach((payment: any) => {
        const monthKey = format(new Date(payment.payment_date), 'yyyy-MM');
        const amount = Number(payment.amount_paid || 0);
        totalCollected += amount;

        // per-month collected
        const monthData = monthlyData.get(monthKey);
        if (monthData) {
          monthData.collected += amount;
        }

        // per-month per-contract
        const contractId = (payment.contract_id || '')?.toString();
        const paymentsForMonth = paymentsByMonthContract.get(monthKey) || {};
        paymentsForMonth[contractId] = (paymentsForMonth[contractId] || 0) + amount;
        paymentsByMonthContract.set(monthKey, paymentsForMonth);

        // per-month per-agent (use joined credit_contracts.sales_agent_id if available)
        const salesAgentId = payment.credit_contracts?.sales_agent_id || null;
        const agentKey = salesAgentId ? (agentLookup.get(salesAgentId)?.code || salesAgentId) : 'UNKNOWN';
        const agentTotalsForMonth = monthlyAgentTotals.get(monthKey) || {};
        agentTotalsForMonth[agentKey] = (agentTotalsForMonth[agentKey] || 0) + amount;
        monthlyAgentTotals.set(monthKey, agentTotalsForMonth);

        // aggregate per-agent for whole year
        if (salesAgentId) {
          agentTotalsYear.set(salesAgentId, (agentTotalsYear.get(salesAgentId) || 0) + amount);
        }
      });

      // Use collected amounts as realized omset totals
      totalOmset = totalCollected;
      // update monthly total_omset from collected (payments)
      months.forEach((m) => {
        const mk = format(m, 'yyyy-MM');
        const md = monthlyData.get(mk);
        if (md) md.total_omset = md.collected;
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
        const expDetails = monthlyExpenseDetails.get(monthKey);
        if (expDetails) {
          expDetails.push({ description: exp.description, amount, category: exp.category || null });
        }
      });

      // Calculate totals
      const totalProfit = totalOmset - totalModal;
      const totalToCollect = (unpaidCoupons || []).reduce((sum, c: any) => sum + Number(c.amount || 0), 0);
  const netProfit = totalProfit - totalCommission - totalExpenses;
  const netProfitPct = totalOmset > 0 ? (netProfit / totalOmset) * 100 : 0;
      const profitMargin = totalOmset > 0 ? (totalProfit / totalOmset) * 100 : 0;
      const expectedTotal = totalToCollect + totalCollected;
      const collectionRate = expectedTotal > 0 ? (totalCollected / expectedTotal) * 100 : 0;

      // Build agent results (use realized collected totals for agent omset)
      // Merge modal/contract counts from earlier agentDataMap with collected totals from agentTotalsYear
      const agentResults: AgentYearlyPerformance[] = (agents || []).map((agent) => {
        const existing = agentDataMap.get(agent.id) || {
          total_modal: 0,
          total_omset: 0,
          total_commission: 0,
          contracts_count: 0,
        };
        const collectedOmset = agentTotalsYear.get(agent.id) || 0;
        const profit = collectedOmset - existing.total_modal;

        const commissionPct = collectedOmset > 0 ? calculateTieredCommission(collectedOmset, tiers) : 0;
        const computedAgentCommission = (collectedOmset * commissionPct) / 100;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_modal: existing.total_modal,
          total_omset: collectedOmset,
          profit,
          total_commission: computedAgentCommission,
          contracts_count: existing.contracts_count,
        };
      }).filter(a => a.contracts_count > 0)
        .sort((a, b) => b.total_omset - a.total_omset);

      // Build monthly details
      const monthlyDetails: MonthlyDetailData[] = months.map(monthDate => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const md = monthlyData.get(monthKey)!;
        return {
          monthKey,
          monthLabel: md.monthLabel,
          contracts: monthlyContractDetails.get(monthKey) || [],
          operational_expenses: monthlyExpenseDetails.get(monthKey) || [],
          total_operational: md.operational,
          total_omset: md.total_omset,
        };
      });

      return {
        total_modal: totalModal,
        total_omset: totalOmset,
        total_profit: totalProfit,
        total_commission: totalCommission,
        total_collected: totalCollected,
        total_to_collect: totalToCollect,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        net_profit_pct: netProfitPct,
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
        monthly_details: monthlyDetails,
      };
    },
  });
};
