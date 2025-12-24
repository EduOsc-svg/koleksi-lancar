import { formatRupiah, formatDate } from "@/lib/format";

interface CouponData {
  contractRef: string;
  noFaktur: string;
  customerName: string;
  customerAddress: string;
  dueDate: string;
  installmentNumber: number;
  installmentAmount: number;
}

interface PrintableCouponMiniProps {
  data: CouponData;
}

// Komponen voucher mini untuk A4 landscape dengan absolute positioning
function PrintableCouponMini({ data }: PrintableCouponMiniProps) {
  // Don't render empty voucher dengan data kosong
  if (!data.contractRef && !data.noFaktur && !data.customerName) {
    return <div className="voucher"></div>;
  }

  return (
    <div className="voucher">
      <span className="data-faktur">{data.noFaktur}</span>
      <span className="data-nama">{data.customerName}</span>
      <span className="data-alamat">{data.customerAddress || "-"}</span>
      <span className="data-jatuh-tempo">{data.dueDate}</span>
      <span className="data-angsuran-ke">{data.installmentNumber}</span>
      <span className="data-besar-angsuran">{data.installmentAmount.toLocaleString("id-ID")}</span>
      <span className="data-kantor">CV MAHKOTA JAYA ELEKTRONIK</span>
    </div>
  );
}

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
      routes?: {
        code: string;
      } | null;
      sales_agents?: {
        agent_code: string;
        name: string;
      } | null;
    } | null;
  }>;
}

// TODO: TEMPORARY SINGLE COUPON MODE FOR POSITIONING
// When positioning is done, change back to:
// - couponsPerPage = 9
// - Remove Math.min(contracts.length, 1) limit
// - Uncomment the fill empty slots code
// - Change CSS import back to print-a4-landscape.css

export function PrintA4LandscapeCoupons({ contracts }: PrintA4LandscapeCouponsProps) {
  const today = new Date();
  const dueDate = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Group contracts into pages of 1 (TEMPORARY FOR POSITIONING)
  const pages: Array<Array<CouponData>> = [];
  const couponsPerPage = 1; // Changed from 9 to 1 for positioning adjustment
  
  for (let i = 0; i < Math.min(contracts.length, 1); i += couponsPerPage) { // Only take first contract
    const pageContracts = contracts.slice(i, i + couponsPerPage);
    const pageCoupons: Array<CouponData> = pageContracts.map((contract) => {
      // Generate No. Faktur: [Tenor][Kode Sales][Nama Sales]
      const tenor = contract.tenor_days || 0;
      const agentCode = contract.customers?.sales_agents?.agent_code || "X";
      const agentName = contract.customers?.sales_agents?.name || "X";
      const installmentNumber = contract.current_installment_index + 1;
      const noFaktur = `${tenor}/${agentCode}/${agentName}`;

      return {
        contractRef: contract.contract_ref,
        noFaktur,
        customerName: contract.customers?.name || "-",
        customerAddress: contract.customers?.address || "-",
        dueDate,
        installmentNumber,
        installmentAmount: contract.daily_installment_amount,
      };
    });

    // No need to fill remaining slots for single coupon mode
    // while (pageCoupons.length < couponsPerPage) {
    //   pageCoupons.push({
    //     contractRef: "",
    //     noFaktur: "",
    //     customerName: "",
    //     customerAddress: "",
    //     dueDate: "",
    //     installmentNumber: 0,
    //     installmentAmount: 0,
    //   });
    // }

    pages.push(pageCoupons);
  }

  return (
    <div className="print-a4-landscape-container">
      {pages.map((pageCoupons, pageIndex) => (
        <div key={pageIndex} className="page">
          {pageCoupons.map((couponData, couponIndex) => (
            <PrintableCouponMini
              key={`${pageIndex}-${couponIndex}`}
              data={couponData}
            />
          ))}
        </div>
      ))}
    </div>
  );
}