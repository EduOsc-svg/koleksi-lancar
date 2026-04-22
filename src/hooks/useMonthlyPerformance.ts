import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateTieredCommission, CommissionTier } from './useCommissionTiers';
import { startOfMonth, endOfMonth, format, startOfYear, endOfYear } from 'date-fns';
import { realizeContract, sumPaymentsByContract } from '@/lib/cashBasisCalc';

export interface MonthlyPerformanceData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;       // realized (cash basis)
  total_modal: number;       // realized (cash basis)
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
  total_collected?: number;
  total_commission: number;
  profit_margin: number;
  agents: MonthlyPerformanceData[];
}

export interface YearlyTargetData {
  total_to_collect: number;
  total_collected: number;
  collection_rate: number;
}

/**
 * Performa bulanan — CASH BASIS.
 * Modal/Omset/Profit dihitung proporsional dari pembayaran yang masuk DI BULAN INI,
 * untuk semua kontrak (tidak terbatas tanggal kontrak).
 * Komisi: tier diterapkan ke total omset realized per agen.
 */
export const useMonthlyPerformance = (month: Date = new Date()) => {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['monthly_performance_cash', monthStart, monthEnd],
    queryFn: async (): Promise<MonthlyPerformanceSummary> => {
      const [
        { data: agents, error: agentsError },
        { data: contracts, error: contractsError },
        { data: paymentsThisMonth, error: paymentsError },
        { data: tiersData, error: tiersError },
      ] = await Promise.all([
        supabase.from('sales_agents').select('id, name, agent_code').order('name'),
        supabase.from('credit_contracts').select('id, omset, total_loan_amount, sales_agent_id'),
        supabase
          .from('payment_logs')
          .select('amount_paid, payment_date, contract_id')
          .gte('payment_date', monthStart)
          .lte('payment_date', monthEnd),
        supabase.from('commission_tiers').select('*').order('min_amount', { ascending: true }),
      ]);

      if (agentsError) throw agentsError;
      if (contractsError) throw contractsError;
      if (paymentsError) throw paymentsError;
      if (tiersError) throw tiersError;

      const tiers: CommissionTier[] = (tiersData || []) as CommissionTier[];

      // Sum pembayaran per kontrak (untuk bulan ini saja)
      const paidByContract = sumPaymentsByContract(paymentsThisMonth || []);

      // Map kontrak -> agent
      const contractAgentMap = new Map<string, string>();
      const contractFinanceMap = new Map<string, { modal_full: number; omset_full: number }>();
      (contracts || []).forEach((c: any) => {
        if (c.sales_agent_id) contractAgentMap.set(c.id, c.sales_agent_id);
        contractFinanceMap.set(c.id, {
          modal_full: Number(c.omset || 0),
          omset_full: Number(c.total_loan_amount || 0),
        });
      });

      // Aggregate realized per agen + jumlah kontrak yang ada pembayaran bulan ini
      const agentDataMap = new Map<string, {
        total_omset: number;
        total_modal: number;
        total_collected: number;
        contract_ids: Set<string>;
      }>();

      paidByContract.forEach((paidThisMonth, contractId) => {
        const agentId = contractAgentMap.get(contractId);
        if (!agentId) return;
        const fin = contractFinanceMap.get(contractId);
        if (!fin) return;

        const realized = realizeContract({
          contract_id: contractId,
          modal_full: fin.modal_full,
          omset_full: fin.omset_full,
          total_paid: paidThisMonth,
        });

        const existing = agentDataMap.get(agentId) || {
          total_omset: 0,
          total_modal: 0,
          total_collected: 0,
          contract_ids: new Set<string>(),
        };
        existing.total_omset += realized.omset_realized;
        existing.total_modal += realized.modal_realized;
        existing.total_collected += paidThisMonth;
        existing.contract_ids.add(contractId);
        agentDataMap.set(agentId, existing);
      });

      const agentResults: MonthlyPerformanceData[] = (agents || []).map((agent) => {
        const data = agentDataMap.get(agent.id);
        const total_omset = data?.total_omset || 0;
        const total_modal = data?.total_modal || 0;
        const total_collected = data?.total_collected || 0;
        const total_contracts = data?.contract_ids.size || 0;

        const commissionPct = total_omset > 0 ? calculateTieredCommission(total_omset, tiers) : 0;
        const totalCommission = (total_omset * commissionPct) / 100;
        const profit = total_omset - total_modal;
        const profitMargin = total_omset > 0 ? (profit / total_omset) * 100 : 0;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset,
          total_modal,
          total_contracts,
          total_commission: totalCommission,
          total_to_collect: 0,
          total_collected,
          profit,
          profit_margin: profitMargin,
        };
      }).filter(a => a.total_contracts > 0 || a.total_collected > 0);

      const total_modal = agentResults.reduce((s, a) => s + a.total_modal, 0);
      const total_omset = agentResults.reduce((s, a) => s + a.total_omset, 0);
      const total_profit = agentResults.reduce((s, a) => s + a.profit, 0);
      const total_commission = agentResults.reduce((s, a) => s + a.total_commission, 0);
      const total_collected = agentResults.reduce((s, a) => s + a.total_collected, 0);
      const profit_margin = total_omset > 0 ? (total_profit / total_omset) * 100 : 0;

      return {
        total_modal,
        total_omset,
        total_profit,
        total_commission,
        total_collected,
        profit_margin,
        agents: agentResults.sort((a, b) => b.profit - a.profit),
      };
    },
  });
};

// Target penagihan tahunan (tetap)
export const useYearlyTarget = (year: Date = new Date()) => {
  const yearStart = format(startOfYear(year), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(year), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['yearly_target', yearStart, yearEnd],
    queryFn: async (): Promise<YearlyTargetData> => {
      const { data: unpaidCoupons, error: couponsError } = await supabase
        .from('installment_coupons')
        .select('amount, due_date')
        .eq('status', 'unpaid')
        .gte('due_date', yearStart)
        .lte('due_date', yearEnd);
      if (couponsError) throw couponsError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payment_logs')
        .select('amount_paid, payment_date')
        .gte('payment_date', yearStart)
        .lte('payment_date', yearEnd);
      if (paymentsError) throw paymentsError;

      const total_to_collect = (unpaidCoupons || []).reduce((s, c: any) => s + Number(c.amount || 0), 0);
      const total_collected = (payments || []).reduce((s, p: any) => s + Number(p.amount_paid || 0), 0);
      const expectedTotal = total_to_collect + total_collected;
      const collection_rate = expectedTotal > 0 ? (total_collected / expectedTotal) * 100 : 0;

      return { total_to_collect, total_collected, collection_rate };
    },
  });
};
