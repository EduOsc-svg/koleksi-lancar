import React from 'react';
import VoucherCard, { VoucherData } from './VoucherCard';

interface CouponData {
  id: string;
  installment_index: number;
  due_date: string;
  amount: number;
  status: string;
}

interface ContractData {
  id: string;
  contract_ref: string;
  current_installment_index: number;
  daily_installment_amount: number;
  tenor_days: number;
  customers?: {
    name: string;
    address?: string | null;
    customer_code?: string | null;
    sales_agents?: {
      agent_code: string;
      name: string;
    } | null;
  } | null;
}

interface VoucherPageProps {
  contracts: ContractData[];
  coupons?: CouponData[];
  couponsPerPage?: number;
}

const VoucherPage: React.FC<VoucherPageProps> = ({ 
  contracts, 
  coupons,
  couponsPerPage = 9 
}) => {
  // Get the first contract (for single contract printing)
  const contract = contracts[0];

  // Generate voucher data from actual coupons
  const generateVoucherData = (): VoucherData[] => {
    if (!contract) return [];

    // If coupons are provided, use actual coupon data
    if (coupons && coupons.length > 0) {
      return coupons.map((coupon) => {
        const tenor = contract.tenor_days || 0;
        const agentCode = contract.customers?.sales_agents?.agent_code || "-";
        const customerCode = contract.customers?.customer_code || "-";
        const noFaktur = `${tenor}/${agentCode}/${customerCode}`;

        // Format due date
        const dueDate = new Date(coupon.due_date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return {
          contractRef: contract.contract_ref,
          noFaktur,
          customerName: contract.customers?.name || "-",
          customerAddress: contract.customers?.address || "-",
          dueDate,
          installmentNumber: coupon.installment_index,
          installmentAmount: coupon.amount,
        };
      });
    }

    // Fallback: generate based on tenor_days (for backward compatibility)
    const allVouchers: VoucherData[] = [];
    const today = new Date();
    const dueDate = today.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    for (let i = 0; i < contract.tenor_days; i++) {
      const tenor = contract.tenor_days || 0;
      const agentCode = contract.customers?.sales_agents?.agent_code || "-";
      const customerCode = contract.customers?.customer_code || "-";
      const noFaktur = `${tenor}/${agentCode}/${customerCode}`;

      allVouchers.push({
        contractRef: contract.contract_ref,
        noFaktur,
        customerName: contract.customers?.name || "-",
        customerAddress: contract.customers?.address || "-",
        dueDate,
        installmentNumber: i + 1,
        installmentAmount: contract.daily_installment_amount,
      });
    }

    return allVouchers;
  };

  // Group vouchers into pages (9 per page for 3x3 grid)
  const groupIntoPages = (vouchers: VoucherData[]): VoucherData[][] => {
    const pages: VoucherData[][] = [];
    
    for (let i = 0; i < vouchers.length; i += couponsPerPage) {
      const pageVouchers = vouchers.slice(i, i + couponsPerPage);
      
      // Fill remaining slots with empty vouchers if needed (last page)
      while (pageVouchers.length < couponsPerPage) {
        pageVouchers.push({
          contractRef: "",
          noFaktur: "",
          customerName: "",
          customerAddress: "",
          dueDate: "",
          installmentNumber: 0,
          installmentAmount: 0,
        });
      }

      pages.push(pageVouchers);
    }
    
    return pages;
  };

  const voucherData = generateVoucherData();
  const pages = groupIntoPages(voucherData);

  return (
    <div className="print-a4-landscape-container">
      {pages.map((pageVouchers, pageIndex) => (
        <div key={`page-${pageIndex}`} className="page">
          {pageVouchers.map((voucher, voucherIndex) => (
            <VoucherCard
              key={`${pageIndex}-${voucherIndex}`}
              data={voucher}
              isEmpty={!voucher.contractRef && !voucher.noFaktur && !voucher.customerName}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default VoucherPage;
