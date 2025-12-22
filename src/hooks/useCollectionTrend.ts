import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyTrend {
  date: string;
  amount: number;
}

export const useCollectionTrend = (days: number = 30) => {
  return useQuery({
    queryKey: ['collection_trend', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('payment_logs')
        .select('payment_date, amount_paid')
        .gte('payment_date', startDateStr)
        .order('payment_date', { ascending: true });

      if (error) throw error;

      // Group by date and sum amounts
      const grouped = (data || []).reduce<Record<string, number>>((acc, payment) => {
        const date = payment.payment_date;
        acc[date] = (acc[date] || 0) + Number(payment.amount_paid);
        return acc;
      }, {});

      // Generate all dates in range for continuous line
      const result: DailyTrend[] = [];
      const currentDate = new Date(startDateStr);
      const today = new Date();
      
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          amount: grouped[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    },
  });
};
