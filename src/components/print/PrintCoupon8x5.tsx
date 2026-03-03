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
          padding: 3mm; 
          margin-bottom: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
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

      @media print {
        @page { 
          size: A4 landscape; 
          margin: 0; 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body { 
          margin: 0; 
          background: white; 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-coupon-wrapper {
          width: 297mm;
          height: 210mm;
          padding: 3mm; 
          margin: 0 auto;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .print-coupon-wrapper:last-child { page-break-after: avoid; }
        .print-btn-container { display: none !important; }
        
        /* Garis potong enhanced untuk print */
        .coupon-grid {
          border: 3px dashed #000 !important;
          gap: 4mm !important;
          padding: 3mm !important;
          outline: 4px dashed #000;
          outline-offset: 2mm;
        }
        
        .coupon-card {
          border: 3px dashed #000 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        /* Garis potong horizontal lebih tebal saat print */
        .coupon-grid::before,
        .coupon-grid::after {
          background: repeating-linear-gradient(
            to right,
            #000 0,
            #000 2mm,
            transparent 2mm,
            transparent 4mm
          ) !important;
          height: 4mm !important;
          opacity: 1 !important;
        }

        /* Garis potong vertikal lebih tebal saat print */
        .coupon-card:nth-child(1)::after,
        .coupon-card:nth-child(2)::after,
        .coupon-card:nth-child(4)::after,
        .coupon-card:nth-child(5)::after,
        .coupon-card:nth-child(7)::after,
        .coupon-card:nth-child(8)::after {
          background: repeating-linear-gradient(
            to bottom,
            #000 0,
            #000 2mm,
            transparent 2mm,
            transparent 4mm
          ) !important;
          width: 4mm !important;
          opacity: 1 !important;
        }

        /* Corner markers lebih besar dan jelas saat print */
        .coupon-card::before {
          font-size: 12pt !important;
          width: 6mm !important;
          height: 6mm !important;
          color: #000 !important;
          font-weight: bold !important;
          background: white !important;
          border: 1px solid #000 !important;
        }
        
        /* Background image optimization untuk print */
        .bg-img-layer {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          opacity: 1 !important;
          filter: none !important;
        }
        
        /* Sembunyikan instruksi potong saat print */
        .cutting-guide,
        .cutting-guide-vertical {
          display: none !important;
        }
        
        /* Sembunyikan semua instruksi tambahan saat print */
        div[style*="position: absolute"][style*="top: -15mm"] {
          display: none !important;
        }
      }

      /* =========================================
         3. GRID LAYOUT & GARIS POTONG ENHANCED
         ========================================= */
      .coupon-grid {
        display: grid;
        grid-template-columns: repeat(3, 8.4cm);
        grid-template-rows: repeat(3, 5.8cm);
        gap: 3mm; /* Diperbesar untuk garis potong yang lebih jelas */
        border: 2px dashed #000;
        padding: 2mm; 
        position: relative;
        
        /* Background pattern untuk area potong */
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2mm,
          #f0f0f0 2mm,
          #f0f0f0 3mm
        );
      }

      .coupon-card {
        width: 8.4cm;
        height: 5.8cm;
        position: relative;
        background-color: white;
        overflow: hidden;
        
        /* Garis potong lengkap di semua sisi */
        border: 2px dashed #333;
        border-radius: 1mm;
        
        /* Box shadow untuk efek 3D */
        box-shadow: 
          0 0 0 1px white,
          0 2px 4px rgba(0,0,0,0.1);
      }

      /* Garis potong horizontal di gap grid */
      .coupon-grid::before {
        content: '';
        position: absolute;
        top: calc(33.33% - 1.5mm);
        left: 0;
        right: 0;
        height: 3mm;
        background: repeating-linear-gradient(
          to right,
          transparent 0,
          transparent 3mm,
          #666 3mm,
          #666 4mm
        );
        z-index: 1;
      }

      .coupon-grid::after {
        content: '';
        position: absolute;
        top: calc(66.66% - 1.5mm);
        left: 0;
        right: 0;
        height: 3mm;
        background: repeating-linear-gradient(
          to right,
          transparent 0,
          transparent 3mm,
          #666 3mm,
          #666 4mm
        );
        z-index: 1;
      }

      /* Garis potong vertikal di gap grid */
      .coupon-card:nth-child(1)::after,
      .coupon-card:nth-child(2)::after,
      .coupon-card:nth-child(4)::after,
      .coupon-card:nth-child(5)::after,
      .coupon-card:nth-child(7)::after,
      .coupon-card:nth-child(8)::after {
        content: '';
        position: absolute;
        top: 0;
        right: -3mm;
        width: 3mm;
        height: 100%;
        background: repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 3mm,
          #666 3mm,
          #666 4mm
        );
        z-index: 2;
      }

      /* Corner markers untuk panduan potong yang lebih jelas */
      .coupon-card::before {
        content: '✂';
        position: absolute;
        top: -2mm;
        left: -2mm;
        font-size: 8pt;
        color: #666;
        background: white;
        width: 4mm;
        height: 4mm;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        z-index: 3;
      }

      .bg-img-layer {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        object-fit: cover; 
        object-position: top center; 
        z-index: 1; 
      }
      
      /* =========================================
         4. POSISI DATA (TEXT)
         ========================================= */
      .content-layer {
        position: relative;
        z-index: 10; 
        width: 100%;
        height: 100%;
      }

      .title-section {
        position: absolute;
        top: 18mm; 
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        width: 100%;
      }
      .voucher-title {
        font-size: 10.5pt; 
        font-weight: normal; 
        color: #000;
        text-decoration: underline;
      }

      .content-area {
        position: absolute;
        top: 24.5mm; 
        left: 1.5mm; 
        width: 100%;
      }

      .data-row {
        font-size: 10.3pt; 
        line-height: 1.15; 
        color: #000;
        white-space: nowrap;
      }

      .data-row .label {
        display: inline-block;
        width: 26mm; 
        font-weight: normal;
      }
      .data-row .value { 
        font-weight: normal; 
      }

      .value-alamat {
        display: inline-block;
        max-width: 50mm;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: bottom;
      }

      .red-text { color: red; font-weight: bold; }

      .right-section {
        position: absolute;
        right: 1mm; 
        bottom: 7mm; 
        text-align: right;
      }
      .lbl-besar { 
        font-size: 10pt; 
        color: #000; 
        text-decoration: underline; 
        margin-bottom: 1px;
      }
      .val-besar { 
        font-size: 11pt; 
        color: red; 
        font-weight: bold;
      }

      .footer {
        position: absolute; 
        bottom: 1.5mm; 
        width: 100%; 
        text-align: center;
        font-size: 10pt; 
        color: red; 
        font-weight: bold;
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
  const BG_IMAGE_URL = "/BackgroundSME2.jpg";
  
  // State untuk handle image loading
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
    console.warn('Background image failed to load:', BG_IMAGE_URL);
  };

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
          {/* Cutting Guidelines Enhanced */}
          <div className="cutting-guide">
            ✂ POTONG MENGIKUTI SEMUA GARIS PUTUS-PUTUS - IKUTI SEMUA SISI ✂
          </div>
          <div className="cutting-guide-vertical">
            ✂ GARIS POTONG LENGKAP ✂
          </div>
          
          {/* Instruksi potong tambahan */}
          <div style={{
            position: 'absolute',
            top: '-15mm',
            right: '10mm',
            fontSize: '8pt',
            color: '#333',
            background: 'white',
            padding: '3mm',
            border: '2px solid #666',
            borderRadius: '3mm',
            textAlign: 'center',
            zIndex: 15,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontWeight: 'bold', color: '#d32f2f', marginBottom: '1mm' }}>
              📋 PANDUAN POTONG:
            </div>
            <div style={{ fontSize: '7pt', lineHeight: '1.3' }}>
              1. Potong garis LUAR grid dulu ⬜<br />
              2. Potong garis DALAM antar kupon ✂<br />
              3. Ikuti semua tanda ✂ di sudut<br />
              4. Gunakan penggaris untuk hasil rapi
            </div>
          </div>
          
          {/* Corner Registration Marks */}
          <div style={{
            position: 'absolute',
            top: '1mm',
            left: '1mm',
            width: '5mm',
            height: '5mm',
            borderTop: '2px solid #000',
            borderLeft: '2px solid #000',
            zIndex: 10
          }}></div>
          <div style={{
            position: 'absolute',
            top: '1mm',
            right: '1mm',
            width: '5mm',
            height: '5mm',
            borderTop: '2px solid #000',
            borderRight: '2px solid #000',
            zIndex: 10
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '1mm',
            left: '1mm',
            width: '5mm',
            height: '5mm',
            borderBottom: '2px solid #000',
            borderLeft: '2px solid #000',
            zIndex: 10
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '1mm',
            right: '1mm',
            width: '5mm',
            height: '5mm',
            borderBottom: '2px solid #000',
            borderRight: '2px solid #000',
            zIndex: 10
          }}></div>
          
          <div className="coupon-grid">
            {Array.from({ length: 9 }, (_, index) => {
              const coupon = pagesCoupons[index];
              
              if (!coupon) {
                // Render kartu kosong dengan panduan potong
                return (
                  <div key={`empty-${index}`} className="coupon-card empty-card">
                    <div className="empty-card-text">
                      <div>KARTU KOSONG</div>
                      <div style={{ fontSize: '8pt', marginTop: '2mm' }}>
                        Potong sesuai garis
                      </div>
                    </div>
                  </div>
                );
              }

              const isUrgent = isUrgentCoupon(coupon, contract.tenor_days);
              
              return (
                <div key={coupon.id} className={`coupon-card ${isUrgent ? 'coupon-urgent' : ''}`}>
                  
                  {/* Layer 1: Background Image (Pakai IMG agar dipaksa cetak) */}
                  <img 
                    src={BG_IMAGE_URL} 
                    className="bg-img-layer" 
                    alt="background"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{
                      display: imageError ? 'none' : 'block',
                      filter: imageLoaded ? 'none' : 'blur(1px)'
                    }}
                  />
                  
                  {/* Fallback background jika gambar gagal load */}
                  {imageError && (
                    <div 
                      className="bg-img-layer"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        opacity: 0.3
                      }}
                    />
                  )}

                  {/* Layer 2: Konten Text */}
                  <div className="content-layer">
                    {/* Title Section */}
                    <div className="title-section">
                      <div className="voucher-title">VOUCHER ANGSURAN</div>
                    </div>

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
                            <span className="label">Rekening BRI ( {REKENING_NUMBER} )</span>
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