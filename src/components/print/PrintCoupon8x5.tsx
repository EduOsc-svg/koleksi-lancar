import React from 'react';
import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import "@/styles/print-coupon-8x5.css";

interface ContractInfo {
  contract_ref: string;
  tenor_days: number;
  daily_installment_amount: number;
  customers: {
    name: string;
    address: string | null;
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

  // Generate No. Faktur format: tenor/agent_code/agent_name
  const noFaktur = `${contract.tenor_days}/${contract.customers?.sales_agents?.agent_code || "-"}/${contract.customers?.sales_agents?.name || "-"}`;

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

  return (
    <>
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
                  
                  
                  {/* Title */}
                  <div className="coupon-8x5-data coupon-8x5-title">
                    VOUCER ANGSURAN
                  </div>

                  {/* NO.Faktur dengan label */}
                  <div className="coupon-8x5-data coupon-8x5-faktur">
                    <span style={{ color: '#CC0000' }}>NO.Faktur:</span> {truncateText(noFaktur, 20)}
                  </div>

                  {/* Nama dengan label */}
                  <div className="coupon-8x5-data coupon-8x5-nama">
                    <span style={{ color: '#CC0000' }}>Nama:</span> {truncateText(contract.customers?.name || "-", 25)}
                  </div>

                  {/* Alamat dengan label */}
                  <div className="coupon-8x5-data coupon-8x5-alamat">
                    <span style={{ color: '#CC0000' }}>Alamat:</span> {truncateText(contract.customers?.address || "-", 25)}
                  </div>

                  {/* Jatuh Tempo dengan label */}
                  <div className="coupon-8x5-data coupon-8x5-jatuhtempo">
                    <span style={{ color: '#CC0000' }}>Jatuh Tempo:</span> {formatDate(coupon.due_date)}
                  </div>

                  {/* Angsuran Ke dengan label */}
                  <div className="coupon-8x5-data coupon-8x5-angsuran-ke">
                    <span style={{ color: '#CC0000' }}>Angsuran Ke-:</span> {coupon.installment_index}
                  </div>

                  {/* Bagian Kanan - Besar Angsuran */}
                  <div className="coupon-8x5-data coupon-8x5-label-besar">
                    Besar Angsuran
                  </div>
                  
                  <div className="coupon-8x5-data coupon-8x5-rp-label">
                    Rp.
                  </div>

                  {/* Nominal dengan garis bawah */}
                  <div className="coupon-8x5-data coupon-8x5-nominal">
                    {formatAmount(coupon.amount)}
                  </div>

                  {/* Info Kantor */}
                  <div className="coupon-8x5-data coupon-8x5-kantor">
                    KANTOR / 0852 5882 5882
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
