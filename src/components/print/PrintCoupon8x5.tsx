import React from 'react';
import { createPortal } from "react-dom";

// --- Tipe Data ---
export interface InstallmentCoupon {
  id: string;
  installment_index: number;
  due_date: string; 
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
  
  // --- Inject CSS ---
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
         2. PENGATURAN HALAMAN (GRID SYSTEM)
         ========================================= */
      /* Mode Layar */
      @media screen {
        body {
          background-color: #525659;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }
        .print-coupon-wrapper {
          width: 297mm;
          height: 210mm;
          background: white;
          box-shadow: 0 0 15px rgba(0,0,0,0.5);
          padding: 5mm; 
          margin-bottom: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        
        /* Tombol Print */
        .print-btn-container {
            position: fixed; bottom: 30px; right: 30px; z-index: 9999;
        }
        .print-btn {
            background-color: #dc3545; color: white; border: none;
            padding: 15px 30px; border-radius: 50px; font-weight: bold; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            font-family: sans-serif; display: flex; align-items: center; gap: 8px;
        }
        .print-btn:hover { background-color: #c82333; }
      }

      /* Mode Cetak */
      @media print {
        @page { 
          size: A4 landscape; 
          margin: 0; 
        }
        body { margin: 0; background: white; }
        
        .print-coupon-wrapper {
          width: 297mm;
          height: 210mm;
          padding: 5mm; 
          margin: 0 auto;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .print-coupon-wrapper:last-child { page-break-after: avoid; }
        
        /* Sembunyikan elemen UI */
        .print-btn-container { display: none !important; }
      }

      /* =========================================
         3. GRID LAYOUT & GARIS POTONG
         ========================================= */
      .coupon-grid {
        display: grid;
        /* Ukuran Kartu: 8.4cm x 5.8cm */
        grid-template-columns: repeat(3, 8.4cm);
        grid-template-rows: repeat(3, 5.8cm);
        
        /* Gap 0 agar garis menyatu */
        gap: 0; 
        
        /* GARIS POTONG LUAR (Atas & Kiri) */
        border-top: 1px dashed #000;
        border-left: 1px dashed #000;
      }

      .coupon-card {
        width: 8.4cm;
        height: 5.8cm;
        position: relative;
        background-color: white;
        overflow: hidden;
        
        /* GARIS POTONG DALAM (Kanan & Bawah) */
        border-right: 1px dashed #000;
        border-bottom: 1px dashed #000;
      }

      /* =========================================
         4. BACKGROUND IMAGE (IMG TAG)
         ========================================= */
      /* Ini kunci agar gambar tercetak otomatis */
      .bg-img-layer {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        object-fit: fill; 
        z-index: 1; /* Di bawah teks */
        opacity: 1; 
      }

      /* =========================================
         5. POSISI DATA (TEXT)
         ========================================= */
      .content-layer {
        position: relative;
        z-index: 10; /* Di atas gambar */
        width: 100%;
        height: 100%;
      }

      .content-area {
        position: absolute;
        top: 24mm; /* Jarak dari atas melewati Header Gambar */
        left: 3mm;
      }

      .data-row {
        font-size: 9pt;
        line-height: 1.35;
        color: #000;
        white-space: nowrap;
      }

      .data-row .label {
        display: inline-block;
        width: 23mm; 
      }
      .data-row .value { font-weight: bold; }

      .value-alamat {
        display: inline-block;
        max-width: 48mm;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: bottom;
      }

      .red-text { color: red; font-weight: bold; }

      .right-section {
        position: absolute;
        right: 2mm;
        top: 36mm;
        text-align: right;
      }
      .lbl-besar { font-size: 8pt; color: red; text-decoration: underline; }
      .val-besar { font-size: 10pt; font-weight: 900; color: red; }

      .footer {
        position: absolute; bottom: 1.5mm; width: 100%; text-align: center;
        font-size: 8pt; color: red; font-weight: bold;
      }
      
      /* Urgent Style Override */
      .coupon-urgent .data-row,
      .coupon-urgent .footer {
        color: red !important;
      }
    `;
    
    // Inject Style
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    styleElement.setAttribute('data-print-styles', 'true');
    document.head.appendChild(styleElement);
    
    return () => {
      const existingStyles = document.querySelectorAll('[data-print-styles="true"]');
      existingStyles.forEach(el => el.remove());
    };
  }, []);

  // --- Helper Functions ---
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("id-ID");
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const isUrgentCoupon = (coupon: InstallmentCoupon, tenor: number) => {
    const installmentIndex = coupon.installment_index;
    const remainingDays = tenor - installmentIndex;
    return remainingDays <= 10;
  };

  const groupCouponsIntoPages = (coupons: InstallmentCoupon[], couponsPerPage: number = 9) => {
    const pages: InstallmentCoupon[][] = [];
    for (let i = 0; i < coupons.length; i += couponsPerPage) {
      pages.push(coupons.slice(i, i + couponsPerPage));
    }
    return pages;
  };

  // --- Data Preparation ---
  const noFakturBase = `${contract.tenor_days}/${contract.sales_agents?.agent_code || "-"}/${contract.contract_ref}`;
  const displayAddress = contract.customers?.business_address || contract.customers?.address || "-";
  const couponPages = groupCouponsIntoPages(coupons);

  // Constants
  const REKENING_NUMBER = "008201003537567";
  const KANTOR_NUMBER = "0821 8802 0656";
  const BG_IMAGE_URL = "https://uploads.onecompiler.io/3zcmc9fyy/448fk8uyf/Background%20WM%20SME2.jpg";

  const printContent = (
    <>
      {/* Tombol Print */}
      <div className="print-btn-container">
        <button onClick={() => window.print()} className="print-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
            CETAK HALAMAN
        </button>
      </div>

      {couponPages.map((pagesCoupons, pageIndex) => (
        <div key={pageIndex} className="print-coupon-wrapper">
          <div className="coupon-grid">
            {Array.from({ length: 9 }, (_, index) => {
              const coupon = pagesCoupons[index];
              
              if (!coupon) {
                // Render kartu kosong agar grid tetap utuh untuk dipotong
                return <div key={`empty-${index}`} className="coupon-card"></div>;
              }

              const isUrgent = isUrgentCoupon(coupon, contract.tenor_days);
              
              return (
                <div key={coupon.id} className={`coupon-card ${isUrgent ? 'coupon-urgent' : ''}`}>
                  
                  {/* Layer 1: Background Image (Pakai IMG agar dipaksa cetak) */}
                  <img src={BG_IMAGE_URL} className="bg-img-layer" alt="background" />

                  {/* Layer 2: Konten Text */}
                  <div className="content-layer">
                    <div className="content-area">
                        <div className="data-row">
                            <span className="label">NO.Faktur</span>
                            <span className="value">: {truncateText(noFakturBase, 18)}</span>
                        </div>
                        <div className="data-row">
                            <span className="label">Nama</span>
                            <span className="value">: {truncateText(contract.customers?.name || "-", 20)}</span>
                        </div>
                        <div className="data-row">
                            <span className="label">Alamat</span>
                            <span className="value value-alamat">: {truncateText(displayAddress, 22)}</span>
                        </div>
                        <div className="data-row">
                            <span className="label">Jatuh Tempo</span>
                            <span className="value">: {formatDate(coupon.due_date)}</span>
                        </div>
                        <div className="data-row">
                            <span className="label">Angsuran Ke-</span>
                            <span className="value">: <span className="red-text">{coupon.installment_index}</span></span>
                        </div>
                        <div className="data-row">
                            <span className="label">No Rekening</span>
                            <span className="value">: {REKENING_NUMBER}</span>
                        </div>
                    </div>

                    <div className="right-section">
                        <div className="lbl-besar">Besar Angsuran</div>
                        <div className="val-besar">Rp {formatAmount(coupon.amount)}</div>
                    </div>

                    <div className="footer">KANTOR / {KANTOR_NUMBER}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return createPortal(printContent, document.body);
}

export default PrintCoupon8x5;