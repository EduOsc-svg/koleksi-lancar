import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateTieredCommission, CommissionTier } from './useCommissionTiers';
import { realizeContract, sumPaymentsByContract } from '@/lib/cashBasisCalc';

export interface AgentOmsetData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;      // realized (cash basis lifetime)
  total_modal: number;      // realized (cash basis lifetime)
  total_contracts: number;  // jumlah kontrak yg pernah ada pembayaran
  // Booked (contract-basis) totals
  booked_total_omset?: number; // sum total_loan_amount for agent's contracts
  booked_total_modal?: number; // sum omset (modal) for agent's contracts
  booked_contracts_count?: number;
  profit: number;
  total_commission: number;
}

/**
 * Lifetime omset/modal/profit per agen — CASH BASIS.
 * Hanya menghitung porsi yang sudah benar-benar tertagih.
 * Komisi: tier per total omset agen.
 */
export const useAgentOmset = () => {
  return useQuery({
    queryKey: ['agent_omset_cash'],
    queryFn: async () => {
      const [
        { data: agents, error: agentsError },
        { data: contracts, error: contractsError },
        { data: payments, error: paymentsError },
        { data: tiersData },
      ] = await Promise.all([
        supabase.from('sales_agents').select('id, name, agent_code').order('name'),
        supabase.from('credit_contracts').select('id, omset, total_loan_amount, sales_agent_id'),
        supabase.from('payment_logs').select('amount_paid, contract_id'),
        supabase.from('commission_tiers').select('*').order('min_amount', { ascending: true }),
      ]);

      if (agentsError) throw agentsError;
      if (contractsError) throw contractsError;
      if (paymentsError) throw paymentsError;

      const tiers: CommissionTier[] = (tiersData || []) as CommissionTier[];
      const paidByContract = sumPaymentsByContract(payments || []);

      // Aggregate per agent
      const agentMap = new Map<string, { total_omset: number; total_modal: number; contract_ids: Set<string> }>();

      // Also compute booked totals per agent (contract-basis)
      const bookedMap = new Map<string, { booked_omset: number; booked_modal: number; booked_contracts: number }>();

      (contracts || []).forEach((c: any) => {
        const agentId = c.sales_agent_id;
        if (!agentId) return;
        const existingBooked = bookedMap.get(agentId) || { booked_omset: 0, booked_modal: 0, booked_contracts: 0 };
        existingBooked.booked_omset += Number(c.total_loan_amount || 0);
        existingBooked.booked_modal += Number(c.omset || 0);
        existingBooked.booked_contracts += 1;
        bookedMap.set(agentId, existingBooked);
      });

      (contracts || []).forEach((c: any) => {
        const agentId = c.sales_agent_id;
        if (!agentId) return;
        const totalPaid = paidByContract.get(c.id) || 0;
        if (totalPaid <= 0) return; // cash basis: skip kontrak tanpa pembayaran

        const realized = realizeContract({
          contract_id: c.id,
          modal_full: Number(c.omset || 0),
          omset_full: Number(c.total_loan_amount || 0),
          total_paid: totalPaid,
        });

        const existing = agentMap.get(agentId) || { total_omset: 0, total_modal: 0, contract_ids: new Set<string>() };
        existing.total_omset += realized.omset_realized;
        existing.total_modal += realized.modal_realized;
        existing.contract_ids.add(c.id);
        agentMap.set(agentId, existing);
      });

      const result: AgentOmsetData[] = (agents || []).map((agent) => {
        const data = agentMap.get(agent.id);
    const total_omset = data?.total_omset || 0;
    const total_modal = data?.total_modal || 0;
    const booked = bookedMap.get(agent.id) || { booked_omset: 0, booked_modal: 0, booked_contracts: 0 };

    // Determine base omset for commission calculation:
    // If the agent has booked (contract-basis) omset, use that as the commission base
    // so that commission "menyesuaikan omset" (follows the displayed omset). Otherwise fall back to realized (cash-basis) omset.
    const commissionBase = (booked.booked_omset && booked.booked_omset > 0) ? booked.booked_omset : total_omset;
    const commissionPct = commissionBase > 0 ? calculateTieredCommission(commissionBase, tiers) : 0;
    const profit = total_omset - total_modal;
    const totalCommission = (commissionBase * commissionPct) / 100;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset,
          total_modal,
          total_contracts: data?.contract_ids.size || 0,
          booked_total_omset: booked.booked_omset,
          booked_total_modal: booked.booked_modal,
          booked_contracts_count: booked.booked_contracts,
          profit,
          total_commission: totalCommission,
        };
      });

      return result;
    },
  });
};
