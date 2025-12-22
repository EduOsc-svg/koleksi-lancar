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
