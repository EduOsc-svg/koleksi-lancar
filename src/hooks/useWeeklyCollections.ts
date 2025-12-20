import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DailyCollection {
  day: string;
  collected: number;
  target: number;
}

export const useWeeklyCollections = () => {
  return useQuery({
    queryKey: ['weekly-collections'],
    queryFn: async () => {
      const today = new Date();
      const weekAgo = subDays(today, 6);
      
      // Fetch payments for the last 7 days
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_logs')
        .select('payment_date, amount_paid')
        .gte('payment_date', format(weekAgo, 'yyyy-MM-dd'))
        .lte('payment_date', format(today, 'yyyy-MM-dd'));
      
      if (paymentsError) throw paymentsError;
      
      // Fetch active contracts for target calculation
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select('daily_installment_amount')
        .eq('status', 'active');
      
      if (contractsError) throw contractsError;
      
      // Calculate daily target (sum of all active contract daily installments)
      const dailyTarget = contracts?.reduce((sum, c) => sum + Number(c.daily_installment_amount), 0) ?? 0;
      
      // Group payments by date
      const paymentsByDate: Record<string, number> = {};
      payments?.forEach(p => {
        const date = p.payment_date;
        paymentsByDate[date] = (paymentsByDate[date] || 0) + Number(p.amount_paid);
      });
      
      // Build chart data for last 7 days
      const chartData: DailyCollection[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'EEE');
        
        chartData.push({
          day: dayName,
          collected: paymentsByDate[dateStr] || 0,
          target: dailyTarget,
        });
      }
      
      return chartData;
    },
  });
};

export const useOverdueContracts = () => {
  return useQuery({
    queryKey: ['overdue-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_contracts')
        .select('id, current_installment_index, created_at, tenor_days')
        .eq('status', 'active');
      
      if (error) throw error;
      
      const today = new Date();
      let overdueCount = 0;
      
      data?.forEach(contract => {
        const createdAt = new Date(contract.created_at);
        const daysSinceCreation = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const expectedInstallments = Math.min(daysSinceCreation, contract.tenor_days);
        
        if (contract.current_installment_index < expectedInstallments) {
          overdueCount++;
        }
      });
      
      return overdueCount;
    },
  });
};
