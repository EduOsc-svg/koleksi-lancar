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
}

interface VoucherCardProps {
  data?: VoucherData;
  isEmpty?: boolean;
}

const VoucherCard: React.FC<VoucherCardProps> = ({ data, isEmpty = false }) => {
  // Render empty card if no data or isEmpty flag is true
  if (isEmpty || !data) {
    return <div className="voucher-card voucher-empty"></div>;
  }

  return (
    <div className="voucher-card">
      <div className="voucher-field no-faktur">{data.noFaktur}</div>
      <div className="voucher-field customer-name">{data.customerName}/{data.customerCode}</div>
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
