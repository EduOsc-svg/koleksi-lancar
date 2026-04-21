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
        { data: paymentsThisYear, error: paymentsError },
        { data: expenses, error: expensesError },
        { data: unpaidCoupons, error: couponsError },
        { data: tiersData, error: tiersError },
      ] = await Promise.all([
<<<<<<< HEAD
        supabase.from('sales_agents').select('id, name, agent_code, commission_percentage, use_tiered_commission').order('name'),
        // Get contracts started in this year
        supabase.from('credit_contracts').select('id, contract_ref, omset, total_loan_amount, sales_agent_id, start_date, status, current_installment_index, tenor_days, created_at, product_type, customer_id, customers(name)')
          .gte('start_date', yearStart)
          .lte('start_date', yearEnd),
        supabase.from('payment_logs').select('amount_paid, payment_date, contract_id, credit_contracts!inner(sales_agent_id)').gte('payment_date', yearStart).lte('payment_date', yearEnd),
=======
        supabase.from('sales_agents').select('id, name, agent_code'),
        // Ambil SEMUA kontrak (cash basis tidak terbatas tanggal kontrak; yang penting
        // pembayaran masuk di tahun ini). Tapi untuk count & status, kita filter
        // kontrak yang start_date <= yearEnd.
        supabase.from('credit_contracts').select('id, omset, total_loan_amount, sales_agent_id, start_date, status, current_installment_index, tenor_days, created_at, product_type, customer_id, customers(name)'),
        supabase.from('payment_logs').select('amount_paid, payment_date, contract_id').gte('payment_date', yearStart).lte('payment_date', yearEnd),
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
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

<<<<<<< HEAD
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
=======
      const tiers = (tiersData || []) as CommissionTier[];
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3

      // Lookups
      const agentLookup = new Map<string, { code: string; name: string }>();
      (agents || []).forEach(a => agentLookup.set(a.id, { code: a.agent_code, name: a.name }));

      const contractMap = new Map<string, any>();
      (contracts || []).forEach((c: any) => contractMap.set(c.id, c));

      // Months
      const months = eachMonthOfInterval({ start: startOfYear(year), end: endOfYear(year) });
<<<<<<< HEAD
  const monthlyData: Map<string, MonthlyBreakdown> = new Map();
  const monthlyContractDetails: Map<string, MonthlyContractDetail[]> = new Map();
  const monthlyExpenseDetails: Map<string, { description: string; amount: number; category: string | null }[]> = new Map();
  // track per-month, per-agent collected totals (based on actual payments)
  const monthlyAgentTotals: Map<string, Record<string, number>> = new Map();
  // payments by month and contract (used to populate contract-level collected amounts)
  const paymentsByMonthContract: Map<string, Record<string, number>> = new Map();
  // aggregate per-agent for whole year based on payments
  const agentTotalsYear: Map<string, number> = new Map();
      
=======
      const monthlyData: Map<string, MonthlyBreakdown> = new Map();
      const monthlyContractDetails: Map<string, Map<string, MonthlyContractDetail>> = new Map();
      const monthlyExpenseDetails: Map<string, { description: string; amount: number; category: string | null }[]> = new Map();
      const monthlyAgentOmset: Map<string, Map<string, number>> = new Map(); // monthKey -> agentId -> omset realized

>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
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

      // Process pembayaran -> alokasi modal/omset realized per bulan
      let totalModal = 0;
      let totalOmset = 0;
      let totalCollected = 0;

      // Untuk track agent yearly totals (cash basis) → buat hitung komisi
      const agentYearlyOmset = new Map<string, number>();
      const agentYearlyModal = new Map<string, number>();
      const agentYearlyContracts = new Map<string, Set<string>>();

<<<<<<< HEAD
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
=======
      (paymentsThisYear || []).forEach((p: any) => {
        const contract = contractMap.get(p.contract_id);
        if (!contract) return;
        const monthKey = format(new Date(p.payment_date), 'yyyy-MM');
        const md = monthlyData.get(monthKey);
        if (!md) return;

        const amt = Number(p.amount_paid || 0);
        const omsetFull = Number(contract.total_loan_amount || 0);
        const modalFull = Number(contract.omset || 0);

        // Realisasi proporsional dari amt thd omsetFull
        const ratio = omsetFull > 0 ? amt / omsetFull : 0;
        const omsetRealized = amt; // by definition
        const modalRealized = modalFull * ratio;
        const profitRealized = omsetRealized - modalRealized;

        // Akumulasi totals
        totalModal += modalRealized;
        totalOmset += omsetRealized;
        totalCollected += amt;

        // Bulanan
        md.total_modal += modalRealized;
        md.total_omset += omsetRealized;
        md.profit += profitRealized;
        md.collected += amt;

        // Per-agent per-month omset (untuk hitung komisi nanti — meski komisi pakai yearly tier)
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

        // Detail kontrak per bulan (akumulasi modal/omset realized)
        const detailMap = monthlyContractDetails.get(monthKey)!;
        const existing = detailMap.get(contract.id);
        if (existing) {
          existing.modal += modalRealized;
          existing.omset += omsetRealized;
          existing.net_profit = existing.omset - existing.modal; // sementara, alokasi komisi nanti
        } else {
          const agentInfo = agentId ? agentLookup.get(agentId) : null;
          detailMap.set(contract.id, {
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
            agent_code: agentInfo?.code || '-',
            customer_name: contract.customers?.name || 'N/A',
            product_type: contract.product_type || '-',
<<<<<<< HEAD
            modal,
            omset: 0,
            commission: 0, // placeholder, will be filled after monthly totals known
            net_profit: 0, // will adjust after collected & commission allocation
=======
            modal: modalRealized,
            omset: omsetRealized,
            commission: 0,
            net_profit: profitRealized,
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
            start_date: contract.start_date,
            contract_ref: (contract as any).contract_ref || (contract.id || '').toString(),
          });
        }
      });

<<<<<<< HEAD
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
=======
      // Hitung komisi PER AGEN untuk SETAHUN (tier diterapkan ke omset tahunan agen)
      // → ini agar konsisten dengan kebijakan "Per total omset agen".
      // Total komisi tahunan = sum(agent_commission)
      // Komisi per bulan dialokasikan proporsional thd omset bulan agen tsb.
      let totalCommission = 0;
      const agentYearlyCommission = new Map<string, number>(); // agentId -> total komisi tahunan
      agentYearlyOmset.forEach((omsetTotal, agentId) => {
        const pct = omsetTotal > 0 ? calculateTieredCommission(omsetTotal, tiers) : 0;
        const commission = (omsetTotal * pct) / 100;
        agentYearlyCommission.set(agentId, commission);
        totalCommission += commission;
      });

      // Alokasi komisi ke bulan: untuk setiap agen, distribusi komisi tahunannya
      // proporsional dengan omset agen di tiap bulan.
      months.forEach((monthDate) => {
        const monthKey = format(monthDate, 'yyyy-MM');
        const md = monthlyData.get(monthKey)!;
        const agentMonth = monthlyAgentOmset.get(monthKey)!;
        let monthCommission = 0;

        agentMonth.forEach((omsetMonth, agentId) => {
          const yearlyOmset = agentYearlyOmset.get(agentId) || 0;
          const yearlyCommission = agentYearlyCommission.get(agentId) || 0;
          if (yearlyOmset > 0) {
            monthCommission += yearlyCommission * (omsetMonth / yearlyOmset);
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
          }
        });

        md.commission = monthCommission;

<<<<<<< HEAD
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
=======
        // Alokasi komisi ke kontrak proporsional thd omset realized bulan tsb
        const detailMap = monthlyContractDetails.get(monthKey)!;
        if (md.total_omset > 0) {
          detailMap.forEach((d) => {
            const share = d.omset / md.total_omset;
            d.commission = monthCommission * share;
            d.net_profit = (d.omset - d.modal) - d.commission;
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
          });
        }
        md.contracts_count = detailMap.size;
      });

<<<<<<< HEAD
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
=======
      // Process expenses
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
      let totalExpenses = 0;
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
      const selectedYear = year.getFullYear();

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
      const totalToCollect = (unpaidCoupons || []).reduce((s, c: any) => s + Number(c.amount || 0), 0);
      const netProfit = totalProfit - totalCommission - totalExpenses;
      const netProfitPct = totalOmset > 0 ? (netProfit / totalOmset) * 100 : 0;
      const profitMargin = totalOmset > 0 ? (totalProfit / totalOmset) * 100 : 0;
      const expectedTotal = totalToCollect + totalCollected;
      const collectionRate = expectedTotal > 0 ? (totalCollected / expectedTotal) * 100 : 0;

<<<<<<< HEAD
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

=======
      // Agent results (cash basis tahunan)
      const agentResults: AgentYearlyPerformance[] = (agents || []).map((agent) => {
        const total_omset = agentYearlyOmset.get(agent.id) || 0;
        const total_modal = agentYearlyModal.get(agent.id) || 0;
        const total_commission = agentYearlyCommission.get(agent.id) || 0;
        const commissionPct = total_omset > 0 ? calculateTieredCommission(total_omset, tiers) : 0;
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
<<<<<<< HEAD
          total_modal: existing.total_modal,
          total_omset: collectedOmset,
          profit,
          total_commission: computedAgentCommission,
          contracts_count: existing.contracts_count,
=======
          total_modal,
          total_omset,
          profit: total_omset - total_modal,
          total_commission,
          contracts_count: agentYearlyContracts.get(agent.id)?.size || 0,
>>>>>>> b567df8e13c17afe039b5e9e2933b5f33c6c4db3
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
