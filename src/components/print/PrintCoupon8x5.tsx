import React from 'react';
import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import { createPortal } from "react-dom";

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
      /* =========================================
         1. GLOBAL & RESET
         ========================================= */
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
      }

      body { 
        font-family: 'Times New Roman', Times, serif; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }

      /* =========================================
         2. MODE PREVIEW (LAYAR)
         ========================================= */
      @media screen {
        body {
          background-color: #525659;
          display: flex;
          justify-content: center;
          padding: 40px;
        }
        .print-coupon-wrapper {
          width: 297mm;
          height: 210mm;
          background: white;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
          padding: 10mm;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .coupon-card { 
          border: 1px dashed #ccc; 
        }
      }

      /* =========================================
         3. MODE CETAK (PRINT)
         ========================================= */
      @media print {
        @page { 
          size: A4 landscape; 
          margin: 0; 
        }
        body { 
          margin: 0; 
          background: white; 
        }
        
        .print-coupon-wrapper {
          width: 297mm;
          height: 209mm;
          padding: 10mm;
          margin: 0 auto;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .print-coupon-wrapper:last-child { 
          page-break-after: avoid; 
        }
        .coupon-card { 
          border: none;
          page-break-inside: avoid; 
        }
        .coupon-grid {
          page-break-inside: avoid;
        }
      }

      /* =========================================
         4. GRID LAYOUT (3 x 3)
         ========================================= */
      .coupon-grid {
        display: grid;
        grid-template-columns: repeat(3, 93mm);
        grid-template-rows: repeat(3, 63mm);
        gap: 2mm; 
        justify-content: center;
        align-content: center;
      }

      /* =========================================
         5. STYLE KARTU VOUCHER
         ========================================= */
      .coupon-card {
        width: 93mm;
        height: 63mm;
        position: relative;
        background-image: url('/Background WM SME.png'); 
        background-size: cover;
        background-position: center;
        overflow: visible;
      }

      /* GARIS POTONG (CUT LINES) */
      .coupon-card::after {
        content: ''; 
        position: absolute; 
        top: 0; 
        right: -1.5mm; 
        width: 0; 
        height: 100%;
        border-right: 1px dashed #999; 
        z-index: 10;
      }
      .coupon-card::before {
        content: ''; 
        position: absolute; 
        left: 0; 
        bottom: -1.5mm; 
        width: 100%; 
        height: 0;
        border-bottom: 1px dashed #999; 
        z-index: 10;
      }
      .coupon-card:nth-child(3n)::after { 
        display: none; 
      }
      .coupon-card:nth-child(n+7)::before { 
        display: none; 
      }

      /* =========================================
         6. POSISI DATA
         ========================================= */
      .coupon-data {
        position: absolute;
        font-size: 11pt;
        line-height: 2;
        color: #000;
        z-index: 5;
        white-space: nowrap;
      }

      /* Alignment Label (Agar titik dua lurus) */
      .coupon-data span.label { 
        display: inline-block; 
        width: 95px; 
        font-weight: normal; 
      }

      .coupon-data span.value {
        font-weight: normal;
      }

      /* --- KOORDINAT POSISI (PIXEL) --- */

      /* Judul Voucher (Merah & Underline) */
      .pos-judul {
        width: 100%;
        text-align: center;
        top: 65px;
        color: red;
        font-weight: bold;
        text-decoration: underline;
        font-size: 11pt;
      }

      /* Area Kiri (Data Utama) */
      .pos-faktur     { left: 15px; top: 95px; }
      .pos-nama       { left: 15px; top: 110px; }
      .pos-kode-kontrak { right: 15px; top: 110px; font-size: 13pt; font-weight: bold; }
      .pos-alamat     { left: 15px; top: 125px; max-width: 230px; overflow: hidden; text-overflow: ellipsis; }
      .pos-jatuhtempo { left: 15px; top: 140px; }
      .pos-angsuran   { left: 15px; top: 155px; }
      
      /* Angka angsuran yang center - posisi terpisah */
      .pos-angka-center {
        position: absolute;
        left: 50%;
        top: 155px;
        transform: translateX(-50%);
        font-size: 11pt;
        font-weight: bold;
        color: #000;
        z-index: 6;
      }

      /* Area Kanan (Besar Angsuran) */
      .pos-lbl-besar-angsuran {
        right: 10px;
        top: 160px;
        font-size: 11pt;
        font-weight: normal;
        text-decoration: underline;
        color: red;
      }

      /* Nominal Rupiah */
      .pos-val-besar-angsuran {
        right: 10px;
        top: 182px;
        text-align: right;
        font-size: 11pt;
        color: red;
      }

      /* Footer (Kantor) */
      .pos-kantor {
        width: 100%;
        text-align: center;
        bottom: 5px; 
        font-size: 11pt;
        font-weight: normal;
        color: red;
      }

      /* =========================================
         7. URGENT COUPON STYLES (10 HARI TERAKHIR)
         ========================================= */
      .coupon-urgent .coupon-data {
        color: red !important;
      }
      
      .coupon-urgent .pos-judul {
        color: red !important;
      }
      
      .coupon-urgent .pos-angka-center {
        color: red !important;
        font-weight: bold;
      }

      .coupon-urgent .pos-kode-kontrak {
        color: red !important;
        font-weight: bold;
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

  // Check if coupon is in last 10 days of tenor
  const isUrgentCoupon = (coupon: InstallmentCoupon, tenor: number) => {
    const installmentIndex = coupon.installment_index;
    const remainingDays = tenor - installmentIndex;
    return remainingDays <= 10;
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
    <>
      {couponPages.map((pagesCoupons, pageIndex) => (
        <div key={pageIndex} className="print-coupon-wrapper">
          <div className="coupon-grid">
            {Array.from({ length: 9 }, (_, index) => {
              const coupon = pagesCoupons[index];
              
              if (!coupon) {
                return <div key={`empty-${index}`} className="coupon-card" style={{ visibility: 'hidden' }}></div>;
              }

              // Check if this coupon is urgent (last 10 days)
              const isUrgent = isUrgentCoupon(coupon, contract.tenor_days);
              
            return (
              <div key={coupon.id} className={`coupon-card ${isUrgent ? 'coupon-urgent' : ''}`}>
                {/* Judul Voucher */}
                <div className="coupon-data pos-judul">VOUCHER ANGSURAN</div>

                {/* NO.Faktur */}
                <div className="coupon-data pos-faktur">
                  <span className="label">NO.Faktur</span><span className="value">: {truncateText(noFaktur, 20)}</span>
                </div>

                {/* Nama */}
                <div className="coupon-data pos-nama">
                  <span className="label">Nama</span><span className="value">: {truncateText(contract.customers?.name || "-", 25)}</span>
                </div>

                {/* Kode Kontrak - di pojok kanan baris nama */}
                <div className="coupon-data pos-kode-kontrak">
                  {contract.contract_ref}
                </div>

                {/* Alamat */}
                <div className="coupon-data pos-alamat">
                  <span className="label">Alamat</span><span className="value">: {truncateText(displayAddress, 28)}</span>
                </div>

                {/* Jatuh Tempo */}
                <div className="coupon-data pos-jatuhtempo">
                  <span className="label">Jatuh Tempo</span><span className="value">: {formatDate(coupon.due_date)}</span>
                </div>

                {/* Angsuran Ke- */}
                <div className="coupon-data pos-angsuran">
                  <span className="label">Angsuran Ke-</span><span className="value">:</span>
                </div>
                
                {/* Angka Angsuran - Center */}
                <div className="coupon-data pos-angka-center">
                  {coupon.installment_index}
                </div>

                {/* Besar Angsuran - Label */}
                <div className="coupon-data pos-lbl-besar-angsuran">Besar Angsuran</div>

                {/* Besar Angsuran - Value */}
                <div className="coupon-data pos-val-besar-angsuran">Rp {formatAmount(coupon.amount)}</div>

                {/* Footer Kantor */}
                <div className="coupon-data pos-kantor">KANTOR / 0852 5882 5882</div>
              </div>
            );
          })}
          </div>
        </div>
      ))}
    </>
  );

  // Render into body for proper print isolation
  return createPortal(printContent, document.body);
}