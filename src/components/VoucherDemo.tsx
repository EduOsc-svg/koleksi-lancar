import React, { useState } from 'react';
import VoucherCard from '@/components/print/VoucherCard';
import '@/styles/Voucher-new.css';

// Demo data untuk testing layout voucher
const demoVoucherData = {
  contractRef: "KON-2024-001",
  noFaktur: "FK-001234567",
  customerName: "Ahmad Budi Santoso",
  customerCode: "CUST001",
  customerAddress: "Jl. Merdeka No. 123, RT 02/RW 05, Kelurahan Sumber Jaya",
  dueDate: "15/01/2026",
  installmentNumber: 45,
  installmentAmount: 125000,
  remainingTenorDays: 15
};

const demoVoucherDataUrgent = {
  ...demoVoucherData,
  contractRef: "KON-2024-002",
  noFaktur: "FK-001234568",
  customerName: "Siti Nurhaliza",
  remainingTenorDays: 8,
  installmentNumber: 89,
  installmentAmount: 200000,
};

const VoucherDemo: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  const handleHidePreview = () => {
    setShowPreview(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Voucher Preview & Print</h1>
          <p className="mt-2 text-gray-600">
            Preview voucher di layar dan print dengan layout A4 landscape (3x4 grid)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">🖥️ Screen Preview</h2>
            <p className="text-blue-700 text-sm">
              Voucher ditampilkan di layar dengan ukuran diperkecil untuk preview. 
              Layout dan positioning sama dengan hasil print.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">🖨️ Print Mode</h2>
            <p className="text-green-700 text-sm">
              Tekan <strong>Ctrl+P</strong> untuk print preview ukuran sebenarnya 
              (8cm x 5cm) dalam layout A4 landscape.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {!showPreview ? (
            <button 
              onClick={handleShowPreview}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
            >
              👁️ Show Preview
            </button>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={handlePrint}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
              >
                🖨️ Print Vouchers
              </button>
              <button 
                onClick={handleHidePreview}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium"
              >
                ✕ Hide Preview
              </button>
            </div>
          )}
        </div>

        {showPreview && (
          <div className="voucher-preview-container mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">📋 Voucher Preview (3x4 Grid)</h3>
                <span className="text-sm text-gray-500">Preview Mode - Ukuran diperkecil untuk layar</span>
              </div>
              
              <div className="voucher-preview-grid">
                <VoucherCard data={demoVoucherData} />
                <VoucherCard data={demoVoucherDataUrgent} />
                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />
                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />
                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />
                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />
                <VoucherCard isEmpty={true} />
                <VoucherCard isEmpty={true} />
                <VoucherCard isEmpty={true} />
                <VoucherCard isEmpty={true} />
                <VoucherCard isEmpty={true} />
                <VoucherCard isEmpty={true} />
              </div>
            </div>
          </div>
        )}

        {/* Hidden Print Container - Only for printing */}
        <div className="print-a4-landscape-container">
          <div className="page">
            <VoucherCard data={demoVoucherData} />
            <VoucherCard data={demoVoucherDataUrgent} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />
            <VoucherCard isEmpty={true} />
            <VoucherCard isEmpty={true} />
            <VoucherCard isEmpty={true} />
            <VoucherCard isEmpty={true} />
            <VoucherCard isEmpty={true} />
            <VoucherCard isEmpty={true} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4 text-gray-800">✨ Fitur Layout 3x4</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ <strong>12 Voucher per halaman</strong>: Layout grid 3x4 optimal</li>
              <li>✅ <strong>Gap 1mm</strong>: Spasi minimal antar voucher</li>
              <li>✅ <strong>Margin 8mm</strong>: Di semua sisi halaman</li>
              <li>✅ <strong>Ukuran 8x5cm</strong>: Per voucher</li>
              <li>✅ <strong>CSS Background</strong>: Background watermark via CSS</li>
              <li>✅ <strong>Font Optimized</strong>: Times New Roman print-friendly</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4 text-gray-800">🖨️ Print Instructions</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Tekan <strong>Ctrl+P</strong> (Windows) atau <strong>Cmd+P</strong> (Mac)</li>
              <li>2. Pilih <strong>Paper Size: A4</strong></li>
              <li>3. Pilih <strong>Orientation: Landscape</strong></li>
              <li>4. Set <strong>Margins: None</strong> atau <strong>Minimum</strong></li>
              <li>5. Pastikan <strong>Print backgrounds</strong> enabled</li>
              <li>6. Voucher akan muncul dalam grid 3x4 (12 voucher)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDemo;
