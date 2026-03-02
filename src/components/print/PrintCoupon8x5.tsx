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
          padding: 3mm; /* Diperkecil dari 5mm ke 3mm */
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
          /* Pastikan background images tercetak */
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body { 
          margin: 0; 
          background: white; 
          /* Force print background images */
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .print-coupon-wrapper {
          width: 297mm;
          height: 210mm;
          padding: 3mm; /* Diperkecil dari 5mm ke 3mm untuk menghemat kertas */
          margin: 0 auto;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          
          /* Add print margins guidance */
          border: 1px solid #ddd;
        }
        .print-coupon-wrapper:last-child { page-break-after: avoid; }
        
        /* Sembunyikan elemen UI */
        .print-btn-container { display: none !important; }
        
        /* Print-specific page margins */
        .print-coupon-wrapper::before {
          content: 'MARGIN POTONG 5mm';
          position: absolute;
          top: 1mm;
          left: 1mm;
          font-size: 6pt;
          color: #999;
          font-family: Arial, sans-serif;
        }
        
        .print-coupon-wrapper::after {
          content: 'HALAMAN ' counter(page);
          position: absolute;
          bottom: 1mm;
          right: 1mm;
          font-size: 6pt;
          color: #999;
          font-family: Arial, sans-serif;
        }
      }

      /* =========================================
         3. GRID LAYOUT & GARIS POTONG ENHANCED
         ========================================= */
      .coupon-grid {
        display: grid;
        /* Ukuran Kartu: 8.4cm x 5.8cm */
        grid-template-columns: repeat(3, 8.4cm);
        grid-template-rows: repeat(3, 5.8cm);
        
        /* Gap untuk garis potong yang jelas - diperkecil */
        gap: 1mm; 
        
        /* GARIS POTONG LUAR yang lebih tebal */
        border: 2px dashed #000;
        padding: 1mm; /* Diperkecil dari 2mm ke 1mm */
        
        /* Background untuk membedakan area potong */
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
        
        /* GARIS POTONG ENHANCED dengan shadow */
        border: 1.5px dashed #333;
        border-radius: 2mm;
        box-shadow: 
          0 0 0 1px white, /* White outline inside */
          0 2px 4px rgba(0,0,0,0.1), /* Subtle shadow */
          inset 0 0 0 2mm transparent; /* Inner space for cutting */
        
        /* Efek 3D ringan */
        position: relative;
      }

      /* Tambahan: Corner markers untuk panduan potong */
      .coupon-card::before,
      .coupon-card::after {
        content: '';
        position: absolute;
        width: 3mm;
        height: 3mm;
        border: 1px solid #666;
        z-index: 2;
        background: white;
      }

      .coupon-card::before {
        top: -1.5mm;
        left: -1.5mm;
        border-right: none;
        border-bottom: none;
      }

      .coupon-card::after {
        bottom: -1.5mm;
        right: -1.5mm;
        border-left: none;
        border-top: none;
      }

      /* Garis potong tambahan di tengah grid untuk panduan */
      .coupon-grid::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 1px;
        height: 100%;
        background: repeating-linear-gradient(
          to bottom,
          #ccc 0,
          #ccc 2mm,
          transparent 2mm,
          transparent 4mm
        );
        z-index: 1;
        opacity: 0.5;
      }

      .coupon-grid::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: 1px;
        width: 100%;
        background: repeating-linear-gradient(
          to right,
          #ccc 0,
          #ccc 2mm,
          transparent 2mm,
          transparent 4mm
        );
        z-index: 1;
        opacity: 0.5;
      }

      /* Mode cetak: Garis potong lebih jelas */
      @media print {
        .coupon-grid {
          border: 2px dashed #000;
          gap: 1.5mm; /* Gap diperkecil untuk menghemat kertas */
          background: none; /* Hilangkan background pattern saat cetak */
        }
        
        .coupon-card {
          border: 2px dashed #000;
          border-radius: 0; /* Hilangkan radius saat cetak */
          box-shadow: none; /* Hilangkan shadow saat cetak */
        }

        /* Corner markers lebih tebal saat cetak */
        .coupon-card::before,
        .coupon-card::after {
          border-width: 2px;
          width: 4mm;
          height: 4mm;
        }

        /* Panduan potong tengah lebih jelas saat cetak */
        .coupon-grid::before,
        .coupon-grid::after {
          background: repeating-linear-gradient(
            var(--direction, to bottom),
            #000 0,
            #000 3mm,
            transparent 3mm,
            transparent 6mm
          );
          opacity: 0.3;
        }

        .coupon-grid::after {
          --direction: to right;
        }
        
        /* Background image optimization untuk print */
        .bg-img-layer {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          opacity: 1 !important;
          filter: none !important;
        }
      }

      /* =========================================
         6. CUTTING GUIDE TEXT & EMPTY CARDS
         ========================================= */
      .cutting-guide {
        position: absolute;
        top: -8mm;
        left: 50%;
        transform: translateX(-50%);
        font-size: 8pt;
        color: #666;
        font-weight: bold;
        text-align: center;
        background: white;
        padding: 1mm 3mm;
        border-radius: 2mm;
        border: 1px solid #ccc;
        z-index: 3;
      }

      .cutting-guide-vertical {
        position: absolute;
        left: -15mm;
        top: 50%;
        transform: translateY(-50%) rotate(-90deg);
        font-size: 8pt;
        color: #666;
        font-weight: bold;
        text-align: center;
        background: white;
        padding: 1mm 3mm;
        border-radius: 2mm;
        border: 1px solid #ccc;
        z-index: 3;
        transform-origin: center;
      }

      /* Empty card styling */
      .coupon-card.empty-card {
        background: repeating-linear-gradient(
          45deg,
          #f9f9f9,
          #f9f9f9 5mm,
          #f5f5f5 5mm,
          #f5f5f5 10mm
        );
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-card::before,
      .empty-card::after {
        opacity: 0.3;
      }

      .empty-card-text {
        color: #999;
        font-size: 10pt;
        font-style: italic;
        text-align: center;
        line-height: 1.3;
      }

      /* Hide guides on print */
      @media print {
        .cutting-guide,
        .cutting-guide-vertical {
          display: none;
        }
        
        .empty-card {
          background: #f8f8f8;
        }
      }
      /* Ini kunci agar gambar tercetak otomatis */
      .bg-img-layer {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        object-fit: cover; /* Ubah ke cover untuk proporsi yang lebih baik */
        object-position: center; /* Center gambar */
        z-index: 1; /* Di bawah teks */
        opacity: 1; 
        /* Backup background color jika gambar tidak load */
        background-color: #f8f9fa;
      }
      
      /* Fallback background pattern jika gambar gagal load */
      .bg-img-layer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        opacity: 0.1;
        z-index: -1;
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

      /* Title Section */
      .title-section {
        position: absolute;
        top: 12mm; /* Disesuaikan dengan posisi di gambar */
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        width: 100%;
      }

      .voucher-title {
        font-size: 9pt; /* Disesuaikan dengan gambar */
        font-weight: bold;
        color: #000;
        text-transform: uppercase;
        letter-spacing: 0.3mm;
      }

      .content-area {
        position: absolute;
        top: 20mm; /* Disesuaikan agar lebih dekat dengan gambar */
        left: 3mm; /* Sedikit lebih dekat ke kiri */
        max-width: 52mm; /* Sedikit diperlebar */
      }

      .data-row {
        font-size: 7pt; /* Diperkecil sesuai gambar */
        line-height: 1.5; /* Spacing yang lebih besar */
        color: #000;
        white-space: nowrap;
        margin-bottom: 0.8mm; /* Jarak antar baris lebih besar */
      }

      .data-row .label {
        display: inline-block;
        width: 20mm; /* Disesuaikan dengan gambar */
        font-weight: normal;
        font-size: 7pt;
      }
      .data-row .value { 
        font-weight: normal; /* Tidak bold seperti di gambar */
        font-size: 7pt;
      }

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
        right: 3mm; /* Sedikit lebih ke kiri */
        top: 30mm; /* Disesuaikan dengan posisi di gambar */
        text-align: right;
      }
      .lbl-besar { 
        font-size: 7pt; /* Diperkecil sesuai gambar */
        color: #000; 
        text-decoration: underline; 
        margin-bottom: 0.5mm;
        font-weight: normal;
      }
      .val-besar { 
        font-size: 9pt; /* Diperkecil sesuai gambar */
        font-weight: bold; 
        color: red; 
      }

      .footer {
        position: absolute; 
        bottom: 2mm; /* Sedikit lebih tinggi */
        width: 100%; 
        text-align: center;
        font-size: 7pt; /* Diperkecil sesuai gambar */
        color: red; 
        font-weight: bold;
        padding: 0 3mm; /* Tambah padding samping */
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
          {/* Cutting Guidelines */}
          <div className="cutting-guide">
            ✂ POTONG MENGIKUTI GARIS PUTUS-PUTUS ✂
          </div>
          <div className="cutting-guide-vertical">
            ✂ POTONG ✂
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