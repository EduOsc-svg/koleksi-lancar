import React from 'react';

interface VoucherData {
  contractRef: string;
  noFaktur: string;
  customerName: string;
  customerCode: string;
  customerAddress: string;
  dueDate: string;
  installmentNumber: number;
  installmentAmount: number;
  remainingTenorDays?: number; // Add remaining tenor days
}

interface VoucherCardProps {
  data?: VoucherData;
  isEmpty?: boolean;
  voucherIndex?: number;  // Urutan voucher (0-99 untuk 100 voucher)
  totalVouchers?: number; // Total voucher yang dicetak
}

const VoucherCard: React.FC<VoucherCardProps> = ({ 
  data, 
  isEmpty = false, 
  voucherIndex = 0, 
  totalVouchers = 100 
}) => {
  // Render empty card if no data or isEmpty flag is true
  if (isEmpty || !data) {
    return <div className="voucher-card voucher-empty"></div>;
  }

  // Logika baru: Background merah jika sisa tenor <= 10 hari
  const isUrgentTenor = data.remainingTenorDays !== undefined && data.remainingTenorDays <= 10;
  const voucherClass = isUrgentTenor ? "voucher-card voucher-urgent" : "voucher-card voucher-normal";

  return (
    <div className={voucherClass}>
      <div className="voucher-field voucher-title">Voucher Angsuran - {data.contractRef}</div>
      <div className="voucher-field no-faktur">{data.noFaktur}</div>
      <div className="voucher-field customer-name">{data.customerName}</div>
      <div className="voucher-field customer-address">{data.customerAddress}</div>
      <div className="voucher-field due-date">{data.dueDate}</div>
      <div className="voucher-field installment-number">{data.installmentNumber}</div>
      <div className="voucher-field installment-amount">{data.installmentAmount.toLocaleString('id-ID')}</div>
      <div className="voucher-field company-info">0852 5882 5882</div>
    </div>
  );
};

export default VoucherCard;
export type { VoucherData };
