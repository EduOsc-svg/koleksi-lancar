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
      {/* Background Image */}
      <img 
        src="/Background with WM.png" 
        alt="" 
        className="voucher-bg"
      />
      
      {/* Row 1: NO.Faktur */}
      <span className="field-item label-kiri row-1">NO.Faktur</span>
      <span className="field-item titik-dua row-1">:</span>
      <span className="field-item nilai-field row-1">{data.noFaktur}</span>
      
      {/* Row 2: Nama */}
      <span className="field-item label-kiri row-2">Nama</span>
      <span className="field-item titik-dua row-2">:</span>
      <span className="field-item nilai-field row-2">{data.customerName}</span>
      
      {/* Row 3: Alamat */}
      <span className="field-item label-kiri row-3">Alamat</span>
      <span className="field-item titik-dua row-3">:</span>
      <span className="field-item nilai-field row-3">{data.customerAddress || "-"}</span>
      
      {/* Row 4: Jatuh Tempo */}
      <span className="field-item label-kiri row-4">Jatuh Tempo</span>
      <span className="field-item titik-dua row-4">:</span>
      <span className="field-item nilai-field row-4">{data.dueDate}</span>
      
      {/* Row 5: Angsuran Ke- */}
      <span className="field-item label-kiri row-5">Angsuran Ke-</span>
      <span className="field-item titik-dua row-5">:</span>
      <span className="field-item nilai-field row-5">{data.installmentNumber}</span>
      
      {/* Besar Angsuran Section */}
      <span className="field-item label-besar-angsuran">Besar Angsuran</span>
      <span className="field-item label-rp">Rp.</span>
      <span className="field-item nilai-angsuran">{data.installmentAmount.toLocaleString("id-ID")}</span>
      <div className="garis-input-rp"></div>
      
      {/* Info Kantor */}
      <span className="field-item label-kantor">Kantor: 0852 5882 5882</span>
    </div>
  );
};

export default VoucherCard;
export type { VoucherData };
