import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommissionPayment {
  id: string;
  sales_agent_id: string;
  contract_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface CommissionPaymentWithDetails extends CommissionPayment {
  contract_ref?: string;
  customer_name?: string;
}

// Fetch all commission payments for a sales agent
export const useCommissionPayments = (salesAgentId: string | null) => {
  return useQuery({
    queryKey: ['commission_payments', salesAgentId],
    queryFn: async () => {
      if (!salesAgentId) return [];

      const { data, error } = await supabase
        .from('commission_payments')
        .select(`
          *,
          credit_contracts!inner(
            contract_ref,
            customers(name)
          )
        `)
        .eq('sales_agent_id', salesAgentId)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((payment: any) => ({
        ...payment,
        contract_ref: payment.credit_contracts?.contract_ref,
        customer_name: payment.credit_contracts?.customers?.name,
      })) as CommissionPaymentWithDetails[];
    },
    enabled: !!salesAgentId,
  });
};

// Fetch unpaid commissions (contracts without commission payment)
export const useUnpaidCommissions = (salesAgentId: string | null) => {
  return useQuery({
    queryKey: ['unpaid_commissions', salesAgentId],
    queryFn: async () => {
      if (!salesAgentId) return [];

      // Get all contracts for this agent
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select(`
          id,
          contract_ref,
          total_loan_amount,
          omset,
          customers(name)
        `)
        .eq('sales_agent_id', salesAgentId);

      if (contractsError) throw contractsError;

      // Get all paid commissions for this agent
      const { data: paidCommissions, error: commissionsError } = await supabase
        .from('commission_payments')
        .select('contract_id')
        .eq('sales_agent_id', salesAgentId);

      if (commissionsError) throw commissionsError;

      const paidContractIds = new Set((paidCommissions || []).map(c => c.contract_id));

      // Get agent's commission percentage
      const { data: agent, error: agentError } = await supabase
        .from('sales_agents')
        .select('commission_percentage')
        .eq('id', salesAgentId)
        .single();

      if (agentError) throw agentError;

      const commissionPct = agent?.commission_percentage || 0;

      // Filter unpaid and calculate commission
      return (contracts || [])
        .filter(c => !paidContractIds.has(c.id))
        .map((contract: any) => {
          const omset = Number(contract.total_loan_amount || 0);
          const commission = (omset * commissionPct) / 100;
          
          return {
            contract_id: contract.id,
            contract_ref: contract.contract_ref,
            customer_name: contract.customers?.name || '-',
            omset,
            commission,
          };
        });
    },
    enabled: !!salesAgentId,
  });
};

// Create commission payment
export const useCreateCommissionPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sales_agent_id: string;
      contract_id: string;
      amount: number;
      payment_date?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('commission_payments')
        .insert({
          sales_agent_id: data.sales_agent_id,
          contract_id: data.contract_id,
          amount: data.amount,
          payment_date: data.payment_date || new Date().toISOString().split('T')[0],
          notes: data.notes || null,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commission_payments', variables.sales_agent_id] });
      queryClient.invalidateQueries({ queryKey: ['unpaid_commissions', variables.sales_agent_id] });
      queryClient.invalidateQueries({ queryKey: ['agent_omset'] });
      queryClient.invalidateQueries({ queryKey: ['agent_performance'] });
    },
  });
};

// Delete commission payment
export const useDeleteCommissionPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, salesAgentId }: { id: string; salesAgentId: string }) => {
      const { error } = await supabase
        .from('commission_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { salesAgentId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['commission_payments', result.salesAgentId] });
      queryClient.invalidateQueries({ queryKey: ['unpaid_commissions', result.salesAgentId] });
      queryClient.invalidateQueries({ queryKey: ['agent_omset'] });
      queryClient.invalidateQueries({ queryKey: ['agent_performance'] });
    },
  });
};

// Get commission summary for a sales agent
export const useCommissionSummary = (salesAgentId: string | null) => {
  return useQuery({
    queryKey: ['commission_summary', salesAgentId],
    queryFn: async () => {
      if (!salesAgentId) return { totalPaid: 0, totalUnpaid: 0, totalContracts: 0, paidContracts: 0 };

      // Get agent info
      const { data: agent, error: agentError } = await supabase
        .from('sales_agents')
        .select('commission_percentage')
        .eq('id', salesAgentId)
        .single();

      if (agentError) throw agentError;

      const commissionPct = agent?.commission_percentage || 0;

      // Get all contracts for this agent
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select('id, total_loan_amount')
        .eq('sales_agent_id', salesAgentId);

      if (contractsError) throw contractsError;

      // Get paid commissions
      const { data: paidCommissions, error: commissionsError } = await supabase
        .from('commission_payments')
        .select('contract_id, amount')
        .eq('sales_agent_id', salesAgentId);

      if (commissionsError) throw commissionsError;

      const paidContractIds = new Set((paidCommissions || []).map(c => c.contract_id));
      const totalPaid = (paidCommissions || []).reduce((sum, c) => sum + Number(c.amount), 0);

      // Calculate total expected commission
      const totalExpected = (contracts || []).reduce((sum, c) => {
        const omset = Number(c.total_loan_amount || 0);
        return sum + (omset * commissionPct) / 100;
      }, 0);

      return {
        totalPaid,
        totalUnpaid: totalExpected - totalPaid,
        totalContracts: (contracts || []).length,
        paidContracts: paidContractIds.size,
      };
    },
    enabled: !!salesAgentId,
  });
};
