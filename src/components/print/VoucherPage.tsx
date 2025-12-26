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
    customer_code?: string;
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
  couponsPerPage = 9, 
  totalCoupons 
}) => {
  const { data: holidays } = useHolidays();

  // Calculate total coupons based on tenor if not provided
  const calculateTotalCoupons = (): number => {
    if (totalCoupons !== undefined) {
      return totalCoupons; // Use provided value
    }

    if (contracts.length === 0) {
      return 100; // Default fallback
    }

    if (contracts.length === 1) {
      // Single customer: use their tenor
      return contracts[0].tenor_days || 100;
    } else {
      // Multiple customers: use the maximum tenor among them
      const maxTenor = Math.max(...contracts.map(contract => contract.tenor_days || 100));
      return maxTenor;
    }
  };

  const actualTotalCoupons = calculateTotalCoupons();

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
    
    // Sort contracts by customer code alphabetically/numerically
    const sortedContracts = [...contracts].sort((a, b) => {
      const codeA = a.customers?.customer_code || "ZZZ";
      const codeB = b.customers?.customer_code || "ZZZ";
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });
    
    // Generate vouchers for each contract up to their individual tenor
    sortedContracts.forEach(contract => {
      const contractTenor = contract.tenor_days || 100;
      const currentInstallment = contract.current_installment_index || 0;
      
      // Generate coupons for remaining installments in this contract
      for (let i = currentInstallment + 1; i <= contractTenor; i++) {
        // Generate No. Faktur: [Tenor]/[Kode Sales]/[Kode Konsumen]
        const tenor = contract.tenor_days || 0;
        const agentCode = contract.customers?.sales_agents?.agent_code || "XXX";
        const customerCode = contract.customers?.customer_code || "XXX";
        const installmentNumber = i;
        const noFaktur = `${tenor}/${agentCode}/${customerCode}`;

        // Calculate due date for this specific coupon
        // Each coupon should be due on the next business day after the previous one
        const daysFromStart = installmentNumber - 1; // 0-based for calculation
        const dueDate = addBusinessDays(today, daysFromStart);
        const dueDateFormatted = formatIndonesianDate(dueDate);

        // Calculate remaining tenor days
        const remainingTenorDays = tenor - (installmentNumber - 1);

        allVouchers.push({
          contractRef: contract.contract_ref,
          noFaktur,
          customerName: contract.customers?.name || "-",
          customerCode: contract.customers?.customer_code || "XXX",
          customerAddress: contract.customers?.address || "-",
          dueDate: dueDateFormatted,
          installmentNumber,
          installmentAmount: contract.daily_installment_amount,
          remainingTenorDays, // Add remaining tenor days
        });
      }
    });
    
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
          customerCode: "",
          customerAddress: "",
          dueDate: "",
          installmentNumber: 0,
          installmentAmount: 0,
          remainingTenorDays: 0,
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
            {pageVouchers.map((voucher, voucherIndex) => {
              // Hitung index global voucher (0-99 untuk 100 voucher)
              const globalVoucherIndex = pageIndex * couponsPerPage + voucherIndex;
              
              return (
                <VoucherCard
                  key={`${pageIndex}-${voucherIndex}`}
                  data={voucher}
                  isEmpty={!voucher.contractRef && !voucher.noFaktur && !voucher.customerName}
                  voucherIndex={globalVoucherIndex}
                  totalVouchers={voucherData.length}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VoucherPage;