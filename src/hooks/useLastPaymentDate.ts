import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLastPaymentDate = (contractId: string | null) => {
  return useQuery({
    queryKey: ['last_payment_date', contractId],
    queryFn: async () => {
      if (!contractId) return null;
      
      const { data, error } = await supabase
        .from('payment_logs')
        .select('payment_date')
        .eq('contract_id', contractId)
        .order('payment_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data?.payment_date || null;
    },
    enabled: !!contractId,
  });
};

// Fetch next unpaid coupon due date for a contract
export const useNextCouponDueDate = (contractId: string | null, nextInstallmentIndex: number) => {
  return useQuery({
    queryKey: ['next_coupon_due_date', contractId, nextInstallmentIndex],
    queryFn: async () => {
      if (!contractId) return null;
      
      const { data, error } = await supabase
        .from('installment_coupons')
        .select('due_date, installment_index')
        .eq('contract_id', contractId)
        .eq('installment_index', nextInstallmentIndex)
        .maybeSingle();
      
      if (error) throw error;
      return data?.due_date || null;
    },
    enabled: !!contractId && nextInstallmentIndex > 0,
  });
};

export const calculateLateNote = (lastPaymentDate: string | null, currentPaymentDate: string): string | null => {
  if (!lastPaymentDate) return null;
  
  const last = new Date(lastPaymentDate);
  const current = new Date(currentPaymentDate);
  
  // Calculate difference in days
  const diffTime = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // If more than 1 day gap, generate late note
  if (diffDays > 1) {
    const gapDays = diffDays - 1;
    return `Gap: ${gapDays} hari sejak pembayaran terakhir`;
  }
  
  return null;
};

// Calculate late note based on due date vs payment date
export const calculateLateNoteFromDueDate = (
  dueDate: string | null, 
  paymentDate: string
): { isLate: boolean; lateDays: number; note: string | null; dueDate: string | null } => {
  if (!dueDate) return { isLate: false, lateDays: 0, note: null, dueDate: null };
  
  const due = new Date(dueDate);
  const payment = new Date(paymentDate);
  
  // Calculate difference in days
  const diffTime = payment.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    const formattedDueDate = new Date(dueDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const formattedPaymentDate = new Date(paymentDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    return {
      isLate: true,
      lateDays: diffDays,
      note: `Terlambat ${diffDays} hari (Jatuh tempo: ${formattedDueDate}, Dibayar: ${formattedPaymentDate})`,
      dueDate: dueDate
    };
  }
  
  return { isLate: false, lateDays: 0, note: null, dueDate };
};
