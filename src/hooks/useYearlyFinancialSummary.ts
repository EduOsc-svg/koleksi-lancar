import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear, endOfYear, format, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { calculateTieredCommission, CommissionTier } from './useCommissionTiers';
import { realizeContract, sumPaymentsByContract } from '@/lib/cashBasisCalc';


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

const calculateContractStatus = (contract: {
  status: string;
  current_installment_index: number;
  created_at: string;
}): 'completed' | 'lancar' | 'kurang_lancar' | 'macet' => {
  if (contract.status === 'completed') return 'completed';
  const daysSinceCreation = differenceInDays(new Date(), new Date(contract.created_at));
  const installmentsPaid = contract.current_installment_index;
  if (installmentsPaid === 0) {
    return daysSinceCreation > 7 ? 'macet' : daysSinceCreation > 3 ? 'kurang_lancar' : 'lancar';
  }
  const daysPerDue = daysSinceCreation / installmentsPaid;
  if (daysPerDue <= 1.2) return 'lancar';
  if (daysPerDue <= 2.0) return 'kurang_lancar';
  return 'macet';
};

/**
 * Ringkasan keuangan tahunan — CASH BASIS.
 * Modal/Omset/Profit bulanan & tahunan dihitung dari pembayaran tertagih DI PERIODE TSB,
 * dialokasikan proporsional ke kontrak (modal & omset full).
 * Komisi: tier per total omset realized agen sepanjang tahun.
 */
export const useYearlyFinancialSummary = (year: Date = new Date(), statusFilter: ContractStatusFilter = 'all') => {
  const yearStart = format(startOfYear(year), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(year), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['yearly_financial_summary_cash', yearStart, yearEnd, statusFilter],
    queryFn: async (): Promise<YearlyFinancialSummary> => {
      const [
        { data: agents, error: agentsError },
        { data: contracts, error: contractsError },
        { data: payments, error: paymentsError },
        { data: expenses, error: expensesError },
        { data: unpaidCoupons, error: couponsError },
        { data: tiersData, error: tiersError },
      ] = await Promise.all([
        supabase.from('sales_agents').select('id, name, agent_code'),
        // We need contract metadata to map payments -> contracts
        supabase.from('credit_contracts').select('id, contract_ref, omset, total_loan_amount, sales_agent_id, start_date, status, current_installment_index, tenor_days, created_at, product_type, customer_id, customers(name, phone)'),
        supabase.from('payment_logs').select('amount_paid, payment_date, contract_id').gte('payment_date', yearStart).lte('payment_date', yearEnd),
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

  const tiers = (tiersData || []) as CommissionTier[];

  // Year selector for booked calculations
  const selectedYear = year.getFullYear();

      // Lookups
      const agentLookup = new Map<string, { code: string; name: string }>();
      (agents || []).forEach((a: any) => agentLookup.set(a.id, { code: a.agent_code, name: a.name }));

      const contractMap = new Map<string, any>();
      (contracts || []).forEach((c: any) => contractMap.set(c.id, c));

      // Months
      const months = eachMonthOfInterval({ start: startOfYear(year), end: endOfYear(year) });
      const monthlyData: Map<string, MonthlyBreakdown> = new Map();
      const monthlyContractDetails: Map<string, Map<string, MonthlyContractDetail>> = new Map();
      const monthlyExpenseDetails: Map<string, { description: string; amount: number; category: string | null }[]> = new Map();
      const monthlyAgentOmset: Map<string, Map<string, number>> = new Map(); // monthKey -> agentId -> omset realized

      months.forEach(monthDate => {
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyData.set(monthKey, {
          month: monthKey,
          monthLabel: format(monthDate, 'MMM yyyy', { locale: idLocale }),
          total_modal: 0, total_omset: 0, profit: 0, commission: 0,
          collected: 0, operational: 0, contracts_count: 0,
        });
        monthlyContractDetails.set(monthKey, new Map());
        monthlyExpenseDetails.set(monthKey, []);
        monthlyAgentOmset.set(monthKey, new Map());
      });

      // Totals
      let totalModal = 0;
      let totalOmset = 0;
      let totalCollected = 0;
      let totalExpenses = 0;

      // Untuk track agent yearly totals (cash basis) → buat hitung komisi
      const agentYearlyOmset = new Map<string, number>();
      const agentYearlyModal = new Map<string, number>();
      const agentYearlyContracts = new Map<string, Set<string>>();

      // Also compute booked (contract-basis) totals per agent for the selected year
      // so commissions can "menyesuaikan omset" (use booked omset when present)
      const agentYearlyBookedOmset = new Map<string, number>();
      const agentYearlyBookedModal = new Map<string, number>();
      const agentYearlyBookedContracts = new Map<string, Set<string>>();
      (contracts || []).forEach((contract: any) => {
        const startYear = contract.start_date ? new Date(contract.start_date).getFullYear() : NaN;
        if (startYear !== selectedYear) return;
        const dynamicStatus = calculateContractStatus(contract);
        if (statusFilter !== 'all' && dynamicStatus !== statusFilter) return;
        const agentId = contract.sales_agent_id;
        if (!agentId) return;
        agentYearlyBookedOmset.set(agentId, (agentYearlyBookedOmset.get(agentId) || 0) + Number(contract.total_loan_amount || 0));
        agentYearlyBookedModal.set(agentId, (agentYearlyBookedModal.get(agentId) || 0) + Number(contract.omset || 0));
        const set = agentYearlyBookedContracts.get(agentId) || new Set<string>();
        set.add(contract.id);
        agentYearlyBookedContracts.set(agentId, set);
      });

      // Track allocated paid per contract so we don't exceed omset_full (handle overpayment)
      const allocatedByContract = new Map<string, number>();

      // Process payments -> allocate realized modal/omset per month and per contract
      (payments || []).forEach((p: any) => {
        const contract = contractMap.get(p.contract_id);
        if (!contract) return;
        const monthKey = format(new Date(p.payment_date), 'yyyy-MM');
        const md = monthlyData.get(monthKey);
        if (!md) return;

        const amt = Number(p.amount_paid || 0);
        const omsetFull = Number(contract.total_loan_amount || 0);
        const modalFull = Number(contract.omset || 0);

        // Clamp: don't allocate more realized omset than the contract's full omset
        const alreadyAllocated = allocatedByContract.get(contract.id) || 0;
        const remainingCap = omsetFull > 0 ? Math.max(0, omsetFull - alreadyAllocated) : amt;
        const allocAmt = Math.min(amt, remainingCap);
        allocatedByContract.set(contract.id, alreadyAllocated + allocAmt);

        const ratio = omsetFull > 0 ? allocAmt / omsetFull : 0;
        const omsetRealized = allocAmt;            // pendapatan diakui (clamped)
        const modalRealized = modalFull * ratio;   // modal proporsional
        const profitRealized = omsetRealized - modalRealized;

        // Accumulate totals
        totalModal += modalRealized;
        totalOmset += omsetRealized;
        totalCollected += amt; // uang masuk apa adanya (termasuk overpayment)

        // Monthly accumulations
        md.total_modal += modalRealized;
        md.total_omset += omsetRealized;
        md.profit += profitRealized;
        md.collected += amt;

        // Per-agent per-month (for later commission allocation)
        const agentId = contract.sales_agent_id;
        if (agentId) {
          const agentMonth = monthlyAgentOmset.get(monthKey)!;
          agentMonth.set(agentId, (agentMonth.get(agentId) || 0) + omsetRealized);

          agentYearlyOmset.set(agentId, (agentYearlyOmset.get(agentId) || 0) + omsetRealized);
          agentYearlyModal.set(agentId, (agentYearlyModal.get(agentId) || 0) + modalRealized);
          const set = agentYearlyContracts.get(agentId) || new Set<string>();
          set.add(contract.id);
          agentYearlyContracts.set(agentId, set);
        }

        // Contract-level details per month
        const detailMap = monthlyContractDetails.get(monthKey)!;
        const existing = detailMap.get(contract.id);
        if (existing) {
          existing.modal += modalRealized;
          existing.omset += omsetRealized;
          existing.net_profit = existing.omset - existing.modal;
        } else {
          const agentInfo = agentId ? agentLookup.get(agentId) : null;
          detailMap.set(contract.id, {
            agent_code: agentInfo?.code || '-',
            customer_name: contract.customers?.name || 'N/A',
            product_type: contract.product_type || '-',
            modal: modalRealized,
            omset: omsetRealized,
            commission: 0,
            net_profit: profitRealized,
            start_date: contract.start_date,
            contract_ref: contract.contract_ref || (contract.id || '').toString(),
          });
        }
      });

      // Hitung komisi per bulan per agen berdasarkan omset bulan tersebut (rekap tiap tanggal 1)
      // Komisi tahunan agen = jumlah komisi tiap bulan (12 bulan atau rentang bulan yang dihitung)
      let totalCommission = 0;
      const agentYearlyCommission = new Map<string, number>();
      const agentMonthlyCommission = new Map<string, Map<string, number>>(); // agentId -> monthKey -> commission

      months.forEach((monthDate) => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const agentMonth = monthlyAgentOmset.get(monthKey)!;
        // compute commission for each agent for this month based on that month's omset
        agentMonth.forEach((omsetMonth, agentId) => {
          const commissionPct = omsetMonth > 0 ? calculateTieredCommission(omsetMonth, tiers) : 0;
          const commissionForMonth = (omsetMonth * commissionPct) / 100;
          if (!agentMonthlyCommission.has(agentId)) agentMonthlyCommission.set(agentId, new Map());
          agentMonthlyCommission.get(agentId)!.set(monthKey, commissionForMonth);
          // accumulate yearly per-agent
          agentYearlyCommission.set(agentId, (agentYearlyCommission.get(agentId) || 0) + commissionForMonth);
          totalCommission += commissionForMonth;
        });
      });

      // Alokasi komisi ke bulan dan ke kontrak: untuk setiap bulan, md.commission = jumlah komisi semua agen di bulan itu
      months.forEach((monthDate) => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const md = monthlyData.get(monthKey)!;
        let monthCommission = 0;
        // Sum commissions of all agents for this month
        agentMonthlyCommission.forEach((monthMap) => {
          monthCommission += monthMap.get(monthKey) || 0;
        });

        md.commission = monthCommission;

        // Allocate commission to contracts in that month by share of month's omset
        const detailMap = monthlyContractDetails.get(monthKey)!;
        if (md.total_omset > 0) {
          detailMap.forEach((d) => {
            const share = d.omset / md.total_omset;
            d.commission = monthCommission * share;
            d.net_profit = (d.omset - d.modal) - d.commission;
          });
        }
        md.contracts_count = detailMap.size;
      });

      // Process expenses by month
      (expenses || []).forEach((exp: any) => {
        const monthKey = format(new Date(exp.expense_date), 'yyyy-MM');
        const amount = Number(exp.amount || 0);
        totalExpenses += amount;
        const md = monthlyData.get(monthKey);
        if (md) md.operational += amount;
        const list = monthlyExpenseDetails.get(monthKey);
        if (list) list.push({ description: exp.description, amount, category: exp.category || null });
      });

      // Status counts (berdasarkan kontrak yang relevan dgn tahun ini)
      let completedCount = 0, activeCount = 0, lancarCount = 0, kurangLancarCount = 0, macetCount = 0;
  let totalContractsCount = 0;

      (contracts || []).forEach((contract: any) => {
        const startYear = new Date(contract.start_date).getFullYear();
        if (startYear > selectedYear) return;
        const dynamicStatus = calculateContractStatus(contract);
        if (statusFilter !== 'all' && dynamicStatus !== statusFilter) return;
        // Hanya hitung kontrak yang start_date di tahun ini untuk count tahunan
        if (startYear !== selectedYear) return;
        totalContractsCount++;
        switch (dynamicStatus) {
          case 'completed': completedCount++; break;
          case 'lancar': lancarCount++; activeCount++; break;
          case 'kurang_lancar': kurangLancarCount++; activeCount++; break;
          case 'macet': macetCount++; activeCount++; break;
        }
      });

      const totalProfit = totalOmset - totalModal;
      const totalToCollect = (unpaidCoupons || []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
      const netProfit = totalProfit - totalCommission - totalExpenses;
      const netProfitPct = totalOmset > 0 ? (netProfit / totalOmset) * 100 : 0;
      const profitMargin = totalOmset > 0 ? (totalProfit / totalOmset) * 100 : 0;
      const expectedTotal = totalToCollect + totalCollected;
      const collectionRate = expectedTotal > 0 ? (totalCollected / expectedTotal) * 100 : 0;

      // Agent results
      const agentResults: AgentYearlyPerformance[] = (agents || []).map((agent: any) => {
        const total_omset = agentYearlyOmset.get(agent.id) || 0;
        const total_modal = agentYearlyModal.get(agent.id) || 0;
        const total_commission = agentYearlyCommission.get(agent.id) || 0;
        // Commission percentage should be derived from the commission base (booked if present)
        const bookedBase = agentYearlyBookedOmset.get(agent.id) || 0;
        const commissionBase = bookedBase > 0 ? bookedBase : total_omset;
        const commissionPct = commissionBase > 0 ? calculateTieredCommission(commissionBase, tiers) : 0;
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_modal,
          total_omset,
          profit: total_omset - total_modal,
          total_commission,
          contracts_count: agentYearlyContracts.get(agent.id)?.size || 0,
        };
      }).filter(a => a.contracts_count > 0).sort((a, b) => b.total_omset - a.total_omset);

      // Monthly details
      const monthlyDetails: MonthlyDetailData[] = months.map(monthDate => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const md = monthlyData.get(monthKey)!;
        const detailMap = monthlyContractDetails.get(monthKey)!;
        return {
          monthKey,
          monthLabel: md.monthLabel,
          contracts: Array.from(detailMap.values()),
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
