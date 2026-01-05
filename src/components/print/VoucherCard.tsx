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
  remainingTenorDays?: number;
}

interface VoucherCardProps {
  data?: VoucherData;
  isEmpty?: boolean;
  voucherIndex?: number;
  totalVouchers?: number;
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

  return (
    <div className="voucher-card">
      {/* Background akan di-handle oleh CSS background-image untuk print */}
      
      {/* Judul Voucher */}
      <div className="field-item judul-voucer">VOUCER ANGSURAN</div>

      {/* Data Fields - Positioning berdasarkan backup file */}
      <div className="field-item nilai-field row-1">{data.noFaktur}</div>
      <div className="field-item nilai-field row-2">{data.customerName}</div>
      <div className="field-item nilai-field row-3">{data.customerAddress}</div>
      <div className="field-item nilai-field row-4">{data.dueDate}</div>
      <div className="field-item nilai-field row-5">{data.installmentNumber}</div>

      {/* Nilai Angsuran */}
      <div className="field-item nilai-angsuran">{data.installmentAmount.toLocaleString('id-ID')}</div>

      {/* Info Kantor */}
      <div className="field-item label-kantor">KANTOR/ 0852 5882 5882</div>
    </div>
  );
};

export default VoucherCard;
export type { VoucherData };
