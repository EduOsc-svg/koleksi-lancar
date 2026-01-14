import React from 'react';
import VoucherPage from './VoucherPage';

interface PrintA4LandscapeCouponsProps {
  contracts: Array<{
    id: string;
    contract_ref: string;
    current_installment_index: number;
    daily_installment_amount: number;
    tenor_days: number;
    customers?: {
      name: string;
      address?: string | null;
      sales_agents?: {
        agent_code: string;
        name: string;
      } | null;
    } | null;
  }>;
}

// REFACTORED: Menggunakan arsitektur komponen yang lebih clean
// VoucherCard: Komponen kecil untuk satu voucher
// VoucherPage: Komponen utama untuk grid dan looping data
// CSS Module: Styling terpisah dan terorganisir

export function PrintA4LandscapeCoupons({ contracts }: PrintA4LandscapeCouponsProps) {
  return (
    <VoucherPage 
      contracts={contracts}
      couponsPerPage={12}
      totalCoupons={100}
    />
  );
}