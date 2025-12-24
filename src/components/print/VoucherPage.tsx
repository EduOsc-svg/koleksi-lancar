import React from 'react';
import VoucherCard, { VoucherData } from './VoucherCard';
import { useHolidays } from '@/hooks/useHolidays';

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
  const { data: holidays } = useHolidays();

  // Function to check if a date is a holiday
  const isHoliday = (date: Date): boolean => {
    if (!holidays) return false;
    
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    return holidays.some(holiday => {
      // Check specific date holidays
      if (holiday.holiday_type === 'specific_date' && holiday.holiday_date) {
        return holiday.holiday_date === dateStr;
      }
      
      // Check recurring weekday holidays
      if (holiday.holiday_type === 'recurring_weekday' && holiday.day_of_week !== null) {
        return holiday.day_of_week === dayOfWeek;
      }
      
      return false;
    });
  };

  // Function to calculate due date by adding business days (skipping holidays)
  const addBusinessDays = (startDate: Date, daysToAdd: number): Date => {
    const result = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < daysToAdd) {
      result.setDate(result.getDate() + 1);
      
      // Skip holidays
      if (!isHoliday(result)) {
        daysAdded++;
      }
    }
    
    return result;
  };

  // Function to format date to Indonesian format
  const formatIndonesianDate = (date: Date): string => {
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Create array of vouchers (repeat contracts if needed)
  const generateVoucherData = (): VoucherData[] => {
    const allVouchers: VoucherData[] = [];
    const today = new Date();
    
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

        // Calculate due date for this specific coupon
        // Each coupon should be due on the next business day after the previous one
        const daysFromStart = installmentNumber - 1; // 0-based for calculation
        const dueDate = addBusinessDays(today, daysFromStart);
        const dueDateFormatted = formatIndonesianDate(dueDate);

        allVouchers.push({
          contractRef: contract.contract_ref,
          noFaktur,
          customerName: contract.customers?.name || "-",
          customerAddress: contract.customers?.address || "-",
          dueDate: dueDateFormatted,
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