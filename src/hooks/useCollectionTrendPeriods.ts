import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TrendPeriod = 'daily' | 'monthly' | 'yearly';

export interface TrendDataPoint {
  label: string;
  date: string;
  amount: number;
}

// Daily trend (existing logic, enhanced)
export const useDailyCollectionTrend = (days: number = 30) => {
  return useQuery({
    queryKey: ['collection_trend_daily', days],
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
      const result: TrendDataPoint[] = [];
      const currentDate = new Date(startDateStr);
      const today = new Date();
      
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        result.push({
          label: `${currentDate.getDate()}/${currentDate.getMonth() + 1}`,
          date: dateStr,
          amount: grouped[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    },
  });
};

// Monthly trend (last N months)
export const useMonthlyCollectionTrend = (months: number = 12) => {
  return useQuery({
    queryKey: ['collection_trend_monthly', months],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('payment_logs')
        .select('payment_date, amount_paid')
        .gte('payment_date', startDateStr)
        .order('payment_date', { ascending: true });

      if (error) throw error;

      // Group by year-month
      const grouped = (data || []).reduce<Record<string, number>>((acc, payment) => {
        const date = new Date(payment.payment_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[key] = (acc[key] || 0) + Number(payment.amount_paid);
        return acc;
      }, {});

      // Generate all months in range
      const result: TrendDataPoint[] = [];
      const currentDate = new Date(startDate);
      const today = new Date();
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      while (currentDate <= today) {
        const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        result.push({
          label: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear().toString().slice(-2)}`,
          date: key,
          amount: grouped[key] || 0,
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return result;
    },
  });
};

// Yearly trend (last N years)
export const useYearlyCollectionTrend = (years: number = 5) => {
  return useQuery({
    queryKey: ['collection_trend_yearly', years],
    queryFn: async () => {
      const startYear = new Date().getFullYear() - years + 1;
      const startDateStr = `${startYear}-01-01`;

      const { data, error } = await supabase
        .from('payment_logs')
        .select('payment_date, amount_paid')
        .gte('payment_date', startDateStr)
        .order('payment_date', { ascending: true });

      if (error) throw error;

      // Group by year
      const grouped = (data || []).reduce<Record<string, number>>((acc, payment) => {
        const year = new Date(payment.payment_date).getFullYear().toString();
        acc[year] = (acc[year] || 0) + Number(payment.amount_paid);
        return acc;
      }, {});

      // Generate all years in range
      const result: TrendDataPoint[] = [];
      const currentYear = new Date().getFullYear();
      
      for (let year = startYear; year <= currentYear; year++) {
        const yearStr = year.toString();
        result.push({
          label: yearStr,
          date: yearStr,
          amount: grouped[yearStr] || 0,
        });
      }

      return result;
    },
  });
};
