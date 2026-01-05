import React from 'react';
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
  remainingTenorDays: 8, // Kurang dari 10 hari, akan menggunakan background merah
  installmentNumber: 89,
  installmentAmount: 200000,
};

const VoucherDemo: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Demo Voucher Layout - Print Only Mode</h1>
      
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-yellow-800">️ Print Only Mode - Performance Optimized</h2>
        <p className="text-yellow-700 mb-2">
          Voucher layout ini menggunakan <strong>print-only mode</strong> berdasarkan file backup untuk performa optimal.
        </p>
        <p className="text-yellow-700">
          <strong>Cara melihat voucher:</strong> Tekan <strong>Ctrl+P (Cmd+P di Mac)</strong> untuk print preview.
        </p>
      </div>

      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">🚀 Benefits Print-Only Mode:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
          <li>✅ <strong>Performance Optimal</strong>: Tidak ada screen CSS yang memperberat kinerja</li>
          <li>✅ <strong>Print Precision</strong>: Layout khusus untuk A4 landscape print</li>
          <li>✅ <strong>Lightweight</strong>: File CSS minimal tanpa screen media</li>
          <li>✅ <strong>Background Efficient</strong>: CSS background-image untuk print</li>
          <li>✅ <strong>Data Focus</strong>: Hanya menampilkan data penting tanpa label</li>
        </ul>
      </div>

      <div className="voucher-print-container print-only">
        <div className="voucher-page">
          <div className="voucher-grid">
            <VoucherCard data={demoVoucherData} />
            <VoucherCard data={demoVoucherDataUrgent} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />
            <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />
            <VoucherCard isEmpty={true} />
            <VoucherCard isEmpty={true} />
            <VoucherCard isEmpty={true} />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-2">Fitur Layout Print-Only (Based on Backup):</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ <strong>Data-Only Display</strong>: Tidak menampilkan label (NO.Faktur:, Nama:, dll)</li>
          <li>✅ <strong>CSS Background</strong>: Background image di-handle CSS untuk print efficiency</li>
          <li>✅ <strong>Positioning Presisi</strong>: Berdasarkan backup file yang sudah tested</li>
          <li>✅ <strong>A4 Landscape Grid</strong>: 3x3 layout optimal (80mm x 50mm per voucher)</li>
          <li>✅ <strong>Font Optimized</strong>: Times New Roman dengan size print-friendly</li>
          <li>✅ <strong>No Screen CSS</strong>: Tidak ada media screen untuk performa maksimal</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-green-800">📋 Print Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
          <li>Tekan <strong>Ctrl+P</strong> (Windows) atau <strong>Cmd+P</strong> (Mac)</li>
          <li>Pilih <strong>Paper Size: A4</strong></li>
          <li>Pilih <strong>Orientation: Landscape</strong></li>
          <li>Set <strong>Margins: None</strong> atau <strong>Minimum</strong></li>
          <li>Pastikan <strong>Print backgrounds</strong> enabled</li>
          <li>Voucher akan muncul dalam grid 3x3 dengan background watermark</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">⚡ Performance Benefits:</h3>
        <div className="text-sm text-gray-700">
          <p><strong>Before (dengan screen media):</strong> CSS lebih besar, rendering ganda</p>
          <p><strong>After (print-only):</strong> CSS minimal, rendering optimal untuk print</p>
        </div>
      </div>
    </div>
  );
};

export default VoucherDemo;