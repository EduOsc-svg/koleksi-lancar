import React from 'react';
import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import { createPortal } from "react-dom";
import "@/styles/print-coupon-8x5.css";

interface ContractInfo {
  contract_ref: string;
  tenor_days: number;
  daily_installment_amount: number;
  customers: {
    name: string;
    address: string | null;
    business_address?: string | null;
    customer_code?: string | null;
    sales_agents?: { name: string; agent_code: string } | null;
  } | null;
}

interface PrintCoupon8x5Props {
  coupons: InstallmentCoupon[];
  contract: ContractInfo;
}

export function PrintCoupon8x5({ coupons, contract }: PrintCoupon8x5Props) {
  // Inject custom print styles untuk memaksa A4 landscape
  React.useEffect(() => {
    const printStyles = `
      @media print {
        @page { size: A4 landscape; margin: 0; }
        body { margin: 0; padding: 0; width: 297mm; height: 210mm; }
        html { width: 297mm; height: 210mm; }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    styleElement.setAttribute('data-print-styles', 'true');
    document.head.appendChild(styleElement);
    
    return () => {
      // Cleanup on unmount
      const existingStyles = document.querySelectorAll('[data-print-styles="true"]');
      existingStyles.forEach(el => el.remove());
    };
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("id-ID");
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Generate No. Faktur format: TENOR/KODE_SALES/KODE_KONSUMEN
  const noFaktur = `${contract.tenor_days}/${contract.customers?.sales_agents?.agent_code || "-"}/${contract.customers?.customer_code || "-"}`;

  // Determine display address (prioritize business_address, fallback to address)
  const displayAddress = contract.customers?.business_address || contract.customers?.address || "-";

  // Group coupons into pages of 9 (3x3 grid)
  const groupCouponsIntoPages = (coupons: InstallmentCoupon[], couponsPerPage: number = 9) => {
    const pages: InstallmentCoupon[][] = [];
    for (let i = 0; i < coupons.length; i += couponsPerPage) {
      pages.push(coupons.slice(i, i + couponsPerPage));
    }
    return pages;
  };

  const couponPages = groupCouponsIntoPages(coupons);

  console.log(`Printing ${coupons.length} coupons across ${couponPages.length} pages`);

  // Use portal to render directly into body for proper print isolation
  const printContent = (
    <div className="print-coupon-wrapper">
      {couponPages.map((pageCoupons, pageIndex) => (
        <div key={`page-${pageIndex}`} className="print-coupon-8x5-container">
          <div className="coupon-8x5-grid">
            {/* Fill empty slots to maintain grid structure */}
            {Array.from({ length: 9 }, (_, index) => {
              const coupon = pageCoupons[index];
              if (!coupon) {
                return <div key={`empty-${index}`} className="coupon-8x5-card" style={{ visibility: 'hidden' }}></div>;
              }
              
              return (
                <div
                  key={coupon.id}
                  className="coupon-8x5-card"
                >
                  {/* Header - Company Info (Static) */}
                  <div className="coupon-8x5-data coupon-8x5-header">
                    CV MAHKOTA JAYA ELEKTRONIK
                    <br />
                    <span style={{ fontSize: '12pt', color: '#0066CC' }}>
                      Jangan dibayar tanpa bukti kupon kami tidak bertanggung jawab
                    </span>
                  </div>
                  
                  {/* Title */}
                  <div className="coupon-8x5-data coupon-8x5-title">
                    VOUCER ANGSURAN
                  </div>

                  {/* NO.Faktur dengan label */}
                  <div className="coupon-8x5-data coupon-8x5-faktur">
                    NO.Faktur: {truncateText(noFaktur, 20)}
                  </div>

                  {/* Nama - Posisi bawah No.Faktur */}
                  <div className="coupon-8x5-data coupon-8x5-nama">
                    Nama: {truncateText(contract.customers?.name || "-", 25)}
                  </div>

                  {/* Alamat Usaha - Posisi bawah Nama */}
                  <div className="coupon-8x5-data coupon-8x5-alamat">
                    Alamat: {truncateText(displayAddress, 28)}
                  </div>

                  {/* Jatuh Tempo - Posisi bawah Alamat */}
                  <div className="coupon-8x5-data coupon-8x5-jatuhtempo">
                    Jatuh Tempo: {formatDate(coupon.due_date)}
                  </div>

                  {/* Angsuran Ke- */}
                  <div className="coupon-8x5-data coupon-8x5-angsuran-ke">
                    Angsuran Ke-: {coupon.installment_index}
                  </div>

                  {/* Nominal Angsuran - Bagian kanan */}
                  <div className="coupon-8x5-data coupon-8x5-nominal">
                    Rp. {formatAmount(coupon.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Render into body for proper print isolation
  return createPortal(printContent, document.body);
}