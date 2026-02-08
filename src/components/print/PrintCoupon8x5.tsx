import React from 'react';
import { createPortal } from "react-dom";

// Interface definisi tipe data (sesuaikan dengan project Anda)
export interface InstallmentCoupon {
  id: string;
  installment_index: number;
  due_date: string; // atau Date
  amount: number;
  status?: string;
}

interface ContractInfo {
  contract_ref: string;
  tenor_days: number;
  customers: {
    name: string;
    address: string | null;
    business_address?: string | null;
  } | null;
  sales_agents?: { agent_code: string } | null;
}

interface PrintCoupon8x5Props {
  coupons: InstallmentCoupon[];
  contract: ContractInfo;
}

export function PrintCoupon8x5({ coupons, contract }: PrintCoupon8x5Props) {
  // Inject custom print styles saat komponen dimount
  React.useEffect(() => {
    const printStyles = `
      /* =========================================
         1. GLOBAL & RESET
         ========================================= */
      * { margin: 0; padding: 0; box-sizing: border-box; }

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
          padding: 8mm;
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
        body { margin: 0; background: white; }
        
        .print-coupon-wrapper {
          width: 297mm;
          height: 209mm;
          padding: 8mm;
          margin: 0 auto;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .print-coupon-wrapper:last-child { page-break-after: avoid; }
        .coupon-card { border: none !important; page-break-inside: avoid; }
      }

      /* =========================================
         4. GRID LAYOUT (3 x 3)
         ========================================= */
      .coupon-grid {
        display: grid;
        grid-template-columns: repeat(3, 93mm);
        grid-template-rows: repeat(3, 63mm);
        gap: 1mm; 
        justify-content: center;
        align-content: center;
      }

      /* =========================================
         5. STYLE KARTU VOUCHER
         ========================================= */
      .coupon-card {
        width: 90mm;
        height: 60mm;
        position: relative;
        /* Ganti URL ini dengan path lokal project Anda jika perlu, misal: '/Background WM SME2.jpg' */
        background-image: url('https://uploads.onecompiler.io/3zcmc9fyy/448fk8uyf/Background%20WM%20SME2.jpg'); 
        background-size: cover;
        background-position: center;
        overflow: visible;
      }

      /* GARIS POTONG (CUT LINES) */
      .coupon-card::after {
        content: ''; position: absolute; top: 0; right: -2.5mm; width: 0; height: 100%;
        border-right: 2px dashed #000; z-index: 10;
      }
      .coupon-card::before {
        content: ''; position: absolute; left: 0; bottom: -2.5mm; width: 100%; height: 0;
        border-bottom: 2px dashed #000; z-index: 10;
      }
      /* Hide cut lines logic */
      .coupon-card:nth-child(3n)::after { display: none; }
      .coupon-card:nth-child(n+7)::before { display: none; }
      
      /* Extra Cut Lines Logic (Shadows) */
      .coupon-card:nth-child(-n+3) { box-shadow: 0 -2.5mm 0 0 transparent, 0 -2.5mm 0 2px dashed #000; }
      .coupon-card:nth-child(3n+1) { box-shadow: -2.5mm 0 0 0 transparent, -2.5mm 0 0 2px dashed #000; }
      .coupon-card:first-child { box-shadow: 0 -2.5mm 0 0 transparent, 0 -2.5mm 0 2px dashed #000, -2.5mm 0 0 0 transparent, -2.5mm 0 0 2px dashed #000; }

      /* =========================================
         6. POSISI DATA
         ========================================= */
      .coupon-data {
        position: absolute;
        font-size: 11pt;
        line-height: 1.2;
        color: #000;
        z-index: 5;
        white-space: nowrap;
      }

      /* Alignment Label */
      .coupon-data span.label { 
        display: inline-block; 
        width: 95px; 
        font-weight: normal; 
      }
      .coupon-data span.value { font-weight: normal; }

      /* --- KOORDINAT POSISI --- */
      
      /* Judul Voucher */
      .pos-judul {
        width: 100%; text-align: center; top: 70px;
        color: black; text-decoration: underline; font-size: 11pt;
      }

      /* Area Kiri (Loop Data) */
      .pos-faktur       { left: 15px; top: 95px; }  
      
      .pos-nama         { left: 15px; top: 112px; } 
      .pos-kode-kontrak { right: 15px; top: 112px; font-size: 13pt; font-weight: bold; }
      
      .pos-alamat       { left: 15px; top: 129px; max-width: 230px; overflow: hidden; text-overflow: ellipsis; } 
      .pos-jatuhtempo   { left: 15px; top: 146px; } 
      .pos-angsuran     { left: 15px; top: 163px; } 
      
      /* FIELD REKENING */
      .pos-rekening     { left: 15px; top: 181.5px; font-weight: bold; } 

      /* Angka Angsuran Center */
      .pos-angka-center {
        position: absolute; left: 50%; top: 163px; transform: translateX(-50%);
        font-size: 11pt; font-weight: bold; color: red; z-index: 6;
      }

      /* Area Kanan (Besar Angsuran) */
      .pos-lbl-besar-angsuran {
        right: 10px; top: 163px;
        font-size: 11pt; font-weight: normal; text-decoration: underline; color: black;
      }

      /* Nominal Rupiah */
      .pos-val-besar-angsuran {
        right: 10px; top: 181.5px;
        text-align: right; font-size: 11pt; color: red;
      }

      /* Footer */
      .pos-kantor {
        width: 100%; text-align: center; bottom: 3px; 
        font-size: 11pt; font-weight: normal; color: red;
      }

      /* URGENT STYLE (Merah) */
      .coupon-urgent .coupon-data, 
      .coupon-urgent .pos-judul, 
      .coupon-urgent .pos-angka-center, 
      .coupon-urgent .pos-kode-kontrak {
        color: red !important; font-weight: bold;
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    styleElement.setAttribute('data-print-styles', 'true');
    document.head.appendChild(styleElement);
    
    return () => {
      const existingStyles = document.querySelectorAll('[data-print-styles="true"]');
      existingStyles.forEach(el => el.remove());
    };
  }, []);

  // Helper Formatter
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

  // Logic Urgent (10 hari terakhir)
  const isUrgentCoupon = (coupon: InstallmentCoupon, tenor: number) => {
    const installmentIndex = coupon.installment_index;
    const remainingDays = tenor - installmentIndex;
    return remainingDays <= 10;
  };

  // Logic Grouping Halaman (9 per page)
  const groupCouponsIntoPages = (coupons: InstallmentCoupon[], couponsPerPage: number = 9) => {
    const pages: InstallmentCoupon[][] = [];
    for (let i = 0; i < coupons.length; i += couponsPerPage) {
      pages.push(coupons.slice(i, i + couponsPerPage));
    }
    return pages;
  };

  const noFakturBase = `${contract.tenor_days}/${contract.sales_agents?.agent_code || "-"}/${contract.sales_agents?.agent_code || "-"}`;
  const displayAddress = contract.customers?.business_address || contract.customers?.address || "-";
  const couponPages = groupCouponsIntoPages(coupons);

  // Hardcoded Data
  const REKENING_NUMBER = "008201003537567";
  const KANTOR_NUMBER = "0821 8802 0656";

  // Use portal to render directly into body for proper print isolation
  const printContent = (
    <>
      {couponPages.map((pagesCoupons, pageIndex) => (
        <div key={pageIndex} className="print-coupon-wrapper">
          <div className="coupon-grid">
            {Array.from({ length: 9 }, (_, index) => {
              const coupon = pagesCoupons[index];
              
              if (!coupon) {
                // Render kartu kosong agar grid tetap rapi
                return <div key={`empty-${index}`} className="coupon-card" style={{ visibility: 'hidden' }}></div>;
              }

              const isUrgent = isUrgentCoupon(coupon, contract.tenor_days);
              
              return (
                <div key={coupon.id} className={`coupon-card ${isUrgent ? 'coupon-urgent' : ''}`}>
                  
                  <div className="coupon-data pos-judul">VOUCHER ANGSURAN</div>

                  {/* NO.Faktur */}
                  <div className="coupon-data pos-faktur">
                    <span className="label">NO.Faktur</span>
                    <span className="value">: {truncateText(noFakturBase, 20)}</span>
                  </div>

                  {/* Nama */}
                  <div className="coupon-data pos-nama">
                    <span className="label">Nama</span>
                    <span className="value">: {truncateText(contract.customers?.name || "-", 25)}</span>
                  </div>

                  {/* Kode Kontrak (Pojok Kanan Nama) */}
                  <div className="coupon-data pos-kode-kontrak">
                    {contract.contract_ref}
                  </div>

                  {/* Alamat */}
                  <div className="coupon-data pos-alamat">
                    <span className="label">Alamat</span>
                    <span className="value">: {truncateText(displayAddress, 28)}</span>
                  </div>

                  {/* Jatuh Tempo */}
                  <div className="coupon-data pos-jatuhtempo">
                    <span className="label">Jatuh Tempo</span>
                    <span className="value">: {formatDate(coupon.due_date)}</span>
                  </div>

                  {/* Angsuran Ke- (Label) */}
                  <div className="coupon-data pos-angsuran">
                    <span className="label">Angsuran Ke-</span>
                    <span className="value">:</span>
                  </div>
                  
                  {/* Angsuran Ke- (Angka Center) */}
                  <div className="coupon-data pos-angka-center">
                    {coupon.installment_index}
                  </div>

                  {/* No Rekening (NEW) */}
                  <div className="coupon-data pos-rekening">
                    <span className="label">No Rekening</span>
                    <span className="value">: {REKENING_NUMBER}</span>
                  </div>

                  {/* Besar Angsuran (Label) */}
                  <div className="coupon-data pos-lbl-besar-angsuran">Besar Angsuran</div>

                  {/* Besar Angsuran (Value) */}
                  <div className="coupon-data pos-val-besar-angsuran">Rp {formatAmount(coupon.amount)}</div>

                  {/* Footer Kantor (UPDATED) */}
                  <div className="coupon-data pos-kantor">KANTOR / {KANTOR_NUMBER}</div>
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

export default PrintCoupon8x5;