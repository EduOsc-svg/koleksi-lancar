import React from 'react';
import VoucherCard, { VoucherData } from './VoucherCard';

interface ContractData {
  id: string;
  contract_ref: string;
  current_installment_index: number;
  daily_installment_amount: number;
  tenor_days: number;
  customers?: {
    name: string;
    address?: string | null;
    routes?: {
      code: string;
    } | null;
    sales_agents?: {
      agent_code: string;
      name: string;
    } | null;
  } | null;
}

interface VoucherPageProps {
  contracts: ContractData[];
  couponsPerPage?: number;
  totalCoupons?: number;
}

const VoucherPage: React.FC<VoucherPageProps> = ({ 
  contracts, 
  couponsPerPage = 12, 
  totalCoupons = 100 
}) => {
  // Generate current date for due date
  const today = new Date();
  const dueDate = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Create array of vouchers (repeat contracts if needed)
  const generateVoucherData = (): VoucherData[] => {
    const allVouchers: VoucherData[] = [];
    
    for (let i = 0; i < totalCoupons; i++) {
      const contractIndex = i % contracts.length; // Loop through available contracts
      const contract = contracts[contractIndex];
      
      if (contract) {
        // Generate No. Faktur: [Tenor]/[Kode Sales]/[Nama Sales]
        const tenor = contract.tenor_days || 0;
        const agentCode = contract.customers?.sales_agents?.agent_code || "X";
        const agentName = contract.customers?.sales_agents?.name || "X";
        const installmentNumber = (contract.current_installment_index + 1) + Math.floor(i / contracts.length);
        const noFaktur = `${tenor}/${agentCode}/${agentName}`;

        allVouchers.push({
          contractRef: contract.contract_ref,
          noFaktur,
          customerName: contract.customers?.name || "-",
          customerAddress: contract.customers?.address || "-",
          dueDate,
          installmentNumber,
          installmentAmount: contract.daily_installment_amount,
        });
      }
    }
    
    return allVouchers;
  };

  // Group vouchers into pages
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
    <div className="voucher-print-container">
      {pages.map((pageVouchers, pageIndex) => (
        <div key={`page-${pageIndex}`} className="voucher-page">
          <div className="voucher-grid">
            {pageVouchers.map((voucher, voucherIndex) => (
              <VoucherCard
                key={`${pageIndex}-${voucherIndex}`}
                data={voucher}
                isEmpty={!voucher.contractRef && !voucher.noFaktur && !voucher.customerName}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VoucherPage;