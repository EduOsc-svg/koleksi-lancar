import React from 'react';

interface VoucherData {
  contractRef: string;
  noFaktur: string;
  customerName: string;
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
  // Render empty voucher untuk slot kosong
  if (isEmpty || !data || (!data.contractRef && !data.noFaktur && !data.customerName)) {
    return <div className="voucher voucher-empty"></div>;
  }

  return (
    <div className="voucher">
      <span className="data-faktur">{data.noFaktur}</span>
      <span className="data-nama">{data.customerName}</span>
      <span className="data-alamat">{data.customerAddress || "-"}</span>
      <span className="data-jatuh-tempo">{data.dueDate}</span>
      <span className="data-angsuran-ke">{data.installmentNumber}</span>
      <span className="data-besar-angsuran">{data.installmentAmount.toLocaleString("id-ID")}</span>
      <span className="data-kantor">0852 5882 5882</span>
    </div>
  );
};

export default VoucherCard;
export type { VoucherData };