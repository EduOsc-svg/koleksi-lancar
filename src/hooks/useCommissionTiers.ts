import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommissionTier {
  id: string;
  min_amount: number;
  max_amount: number | null;
  percentage: number;
  created_at: string;
}

// Yearly bonus percentage (hardcoded as per business rule)
export const YEARLY_BONUS_PERCENTAGE = 0.8;

// Fetch all commission tiers
export const useCommissionTiers = () => {
  return useQuery({
    queryKey: ['commission_tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('min_amount', { ascending: true });

      if (error) throw error;
      return data as CommissionTier[];
    },
  });
};

// Calculate commission percentage based on contract amount using tiers
export const calculateTieredCommission = (
  contractAmount: number,
  tiers: CommissionTier[]
): number => {
  if (!tiers || tiers.length === 0) return 5; // Default 5% if no tiers

  // Find the tier that matches the contract amount
  for (const tier of tiers) {
    const min = Number(tier.min_amount);
    const max = tier.max_amount !== null ? Number(tier.max_amount) : Infinity;
    
    if (contractAmount >= min && contractAmount <= max) {
      return Number(tier.percentage);
    }
  }

  // If no tier matches, use the highest tier (last one with null max)
  const highestTier = tiers.find(t => t.max_amount === null);
  return highestTier ? Number(highestTier.percentage) : 5;
};

// Calculate commission amount for a single contract
export const calculateCommissionAmount = (
  contractAmount: number,
  tiers: CommissionTier[],
  useTiered: boolean = true,
  fixedPercentage: number = 0
): { percentage: number; amount: number } => {
  const percentage = useTiered 
    ? calculateTieredCommission(contractAmount, tiers)
    : fixedPercentage;
  
  const amount = (contractAmount * percentage) / 100;
  
  return { percentage, amount };
};

// Calculate yearly bonus for an agent
export const calculateYearlyBonus = (totalYearlyOmset: number): number => {
  return (totalYearlyOmset * YEARLY_BONUS_PERCENTAGE) / 100;
};
