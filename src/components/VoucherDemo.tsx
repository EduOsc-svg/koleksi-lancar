import React, { useState } from 'react';import React, { useState } from 'react';import React, { useState } from 'react';

import VoucherCard from '@/components/print/VoucherCard';

import '@/styles/Voucher-new.css';import VoucherCard from '@/components/print/VoucherCard';import VoucherCard from '@/components/print/VoucherCard';



// Demo data untuk testing layout voucherimport '@/styles/Voucher-new.css';import '@/styles/Voucher-        {/* H        {/* Hidden Print Container - Only for printing */}

const demoVoucherData = {

  contractRef: "KON-2024-001",        <div className="voucher-print-container print-a4-landscape-container">

  noFaktur: "FK-001234567",

  customerName: "Ahmad Budi Santoso",// Demo data untuk testing layout voucher          <div className="voucher-page page">

  customerCode: "CUST001",

  customerAddress: "Jl. Merdeka No. 123, RT 02/RW 05, Kelurahan Sumber Jaya",const demoVoucherData = {            <div className="voucher-grid">

  dueDate: "15/01/2026",

  installmentNumber: 45,  contractRef: "KON-2024-001",              <VoucherCard data={demoVoucherData} />

  installmentAmount: 125000,

  remainingTenorDays: 15  noFaktur: "FK-001234567",              <VoucherCard data={demoVoucherDataUrgent} />

};

  customerName: "Ahmad Budi Santoso",              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />

const demoVoucherDataUrgent = {

  ...demoVoucherData,  customerCode: "CUST001",              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />

  contractRef: "KON-2024-002",

  noFaktur: "FK-001234568",  customerAddress: "Jl. Merdeka No. 123, RT 02/RW 05, Kelurahan Sumber Jaya",              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />

  customerName: "Siti Nurhaliza",

  remainingTenorDays: 8,  dueDate: "15/01/2026",              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />

  installmentNumber: 89,

  installmentAmount: 200000,  installmentNumber: 45,              <VoucherCard isEmpty={true} />

};

  installmentAmount: 125000,              <VoucherCard isEmpty={true} />

const VoucherDemo: React.FC = () => {

  const [showPreview, setShowPreview] = useState(false);  remainingTenorDays: 15              <VoucherCard isEmpty={true} />



  const handleShowPreview = () => {};            </div>

    setShowPreview(true);

  };          </div>



  const handleHidePreview = () => {const demoVoucherDataUrgent = {        }ainer - Only for printing */}

    setShowPreview(false);

  };  ...demoVoucherData,        <div className="voucher-print-container print-a4-landscape-container">



  const handlePrint = () => {  contractRef: "KON-2024-002",          <div className="voucher-page page">

    window.print();

  };  noFaktur: "FK-001234568",            <div className="voucher-grid">

  

  return (  customerName: "Siti Nurhaliza",              <VoucherCard data={demoVoucherData} />

    <div className="min-h-screen bg-gray-50">

      <div className="bg-white shadow-sm border-b">  remainingTenorDays: 8, // Kurang dari 10 hari, akan menggunakan background merah              <VoucherCard data={demoVoucherDataUrgent} />

        <div className="max-w-7xl mx-auto px-4 py-6">

          <h1 className="text-3xl font-bold text-gray-900">Voucher Preview & Print</h1>  installmentNumber: 89,              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />

          <p className="mt-2 text-gray-600">

            Preview voucher di layar dan print dengan layout A4 landscape (3x3 grid)  installmentAmount: 200000,              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />

          </p>

        </div>};              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />

      </div>

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />

      <div className="max-w-7xl mx-auto p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">const VoucherDemo: React.FC = () => {              <VoucherCard isEmpty={true} />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

            <h2 className="text-lg font-semibold text-blue-800 mb-2">🖥️ Screen Preview</h2>  const [showPreview, setShowPreview] = useState(false);              <VoucherCard isEmpty={true} />

            <p className="text-blue-700 text-sm">

              Voucher ditampilkan di layar dengan ukuran diperkecil untuk preview.               <VoucherCard isEmpty={true} />

              Layout dan positioning sama dengan hasil print (3x3 grid).

            </p>  const handleShowPreview = () => {            </div>

          </div>

              setShowPreview(true);          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">

            <h2 className="text-lg font-semibold text-green-800 mb-2">🖨️ Print Mode</h2>  };        }mo data untuk testing layout voucher

            <p className="text-green-700 text-sm">

              Tekan <strong>Ctrl+P</strong> untuk print preview ukuran sebenarnya const demoVoucherData = {

              (89x56.33mm) dalam layout A4 landscape dengan gap 10mm.

            </p>  const handleHidePreview = () => {  contractRef: "KON-2024-001",

          </div>

        </div>    setShowPreview(false);  noFaktur: "FK-001234567",



        <div className="flex gap-4 mb-6">  };  customerName: "Ahmad Budi Santoso",

          {!showPreview ? (

            <button   customerCode: "CUST001",

              onClick={handleShowPreview}

              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"  const handlePrint = () => {  customerAddress: "Jl. Merdeka No. 123, RT 02/RW 05, Kelurahan Sumber Jaya",

            >

              👁️ Show Preview (3x3 Grid)    window.print();  dueDate: "15/01/2026",

            </button>

          ) : (  };  installmentNumber: 45,

            <div className="flex gap-4">

              <button     installmentAmount: 125000,

                onClick={handlePrint}

                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"  return (  remainingTenorDays: 15

              >

                🖨️ Print Vouchers (9 per halaman)    <div className="min-h-screen bg-gray-50">};

              </button>

              <button       {/* Header */}

                onClick={handleHidePreview}

                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium"      <div className="bg-white shadow-sm border-b">const demoVoucherDataUrgent = {

              >

                ✕ Hide Preview        <div className="max-w-7xl mx-auto px-4 py-6">  ...demoVoucherData,

              </button>

            </div>          <h1 className="text-3xl font-bold text-gray-900">Voucher Preview & Print</h1>  contractRef: "KON-2024-002",

          )}

        </div>          <p className="mt-2 text-gray-600">  noFaktur: "FK-001234568",



        {showPreview && (            Preview voucher di layar dan print dengan layout A4 landscape (3x3 grid)  customerName: "Siti Nurhaliza",

          <div className="voucher-preview-container mb-8">

            <div className="bg-white rounded-lg shadow-lg p-6">          </p>  remainingTenorDays: 8, // Kurang dari 10 hari, akan menggunakan background merah

              <div className="flex justify-between items-center mb-4">

                <h3 className="text-lg font-semibold text-gray-800">📋 Voucher Preview (3x3 Grid)</h3>        </div>  installmentNumber: 89,

                <span className="text-sm text-gray-500">Preview Mode - Ukuran diperkecil untuk layar</span>

              </div>      </div>  installmentAmount: 200000,

              

              <div className="voucher-preview-grid">};

                <VoucherCard data={demoVoucherData} />

                <VoucherCard data={demoVoucherDataUrgent} />      <div className="max-w-7xl mx-auto p-6">

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />        {/* Info Panel */}const VoucherDemo: React.FC = () => {

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">  const [showPreview, setShowPreview] = useState(false);

                <VoucherCard isEmpty={true} />

                <VoucherCard isEmpty={true} />          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

                <VoucherCard isEmpty={true} />

              </div>            <h2 className="text-lg font-semibold text-blue-800 mb-2">🖥️ Screen Preview</h2>  const handleShowPreview = () => {

            </div>

          </div>            <p className="text-blue-700 text-sm">    setShowPreview(true);

        )}

              Voucher ditampilkan di layar dengan ukuran diperkecil untuk preview.   };

        <div className="voucher-print-container print-a4-landscape-container">

          <div className="voucher-page page">              Layout dan positioning sama dengan hasil print (3x3 grid).

            <div className="voucher-grid">

              <VoucherCard data={demoVoucherData} />            </p>  const handleHidePreview = () => {

              <VoucherCard data={demoVoucherDataUrgent} />

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />          </div>    setShowPreview(false);

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />            };

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />

              <VoucherCard isEmpty={true} />          <div className="bg-green-50 border border-green-200 rounded-lg p-4">

              <VoucherCard isEmpty={true} />

              <VoucherCard isEmpty={true} />            <h2 className="text-lg font-semibold text-green-800 mb-2">🖨️ Print Mode</h2>  const handlePrint = () => {

            </div>

          </div>            <p className="text-green-700 text-sm">    window.print();

        </div>

              Tekan <strong>Ctrl+P</strong> untuk print preview ukuran sebenarnya   };

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white p-6 rounded-lg shadow">              (89x56.33mm) dalam layout A4 landscape dengan gap 10mm.  return (

            <h3 className="font-semibold mb-4 text-gray-800">✨ Fitur Layout 3x3</h3>

            <ul className="space-y-2 text-sm text-gray-600">            </p>    <div className="min-h-screen bg-gray-50">

              <li>✅ <strong>9 Voucher per halaman</strong>: Layout grid 3x3 optimal</li>

              <li>✅ <strong>Gap 10mm</strong>: Spasi yang cukup antar voucher</li>          </div>      {/* Header */}

              <li>✅ <strong>Area Grid 267x179mm</strong>: Sesuai spesifikasi</li>

              <li>✅ <strong>Ukuran 89x56.33mm</strong>: Per voucher</li>        </div>      <div className="bg-white shadow-sm border-b">

              <li>✅ <strong>CSS Background</strong>: Background watermark via CSS</li>

              <li>✅ <strong>Font Optimized</strong>: Times New Roman print-friendly</li>        <div className="max-w-7xl mx-auto px-4 py-6">

            </ul>

          </div>        {/* Action Buttons */}          <h1 className="text-3xl font-bold text-gray-900">Voucher Preview & Print</h1>



          <div className="bg-white p-6 rounded-lg shadow">        <div className="flex gap-4 mb-6">          <p className="mt-2 text-gray-600">

            <h3 className="font-semibold mb-4 text-gray-800">🖨️ Print Instructions</h3>

            <ol className="space-y-2 text-sm text-gray-600">          {!showPreview ? (            Preview voucher di layar dan print dengan layout A4 landscape

              <li>1. Tekan <strong>Ctrl+P</strong> (Windows) atau <strong>Cmd+P</strong> (Mac)</li>

              <li>2. Pilih <strong>Paper Size: A4</strong></li>            <button           </p>

              <li>3. Pilih <strong>Orientation: Landscape</strong></li>

              <li>4. Set <strong>Margins: None</strong> atau <strong>Minimum</strong></li>              onClick={handleShowPreview}        </div>

              <li>5. Pastikan <strong>Print backgrounds</strong> enabled</li>

              <li>6. Voucher akan muncul dalam grid 3x3 (9 voucher)</li>              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"      </div>

            </ol>

          </div>            >

        </div>

      </div>              👁️ Show Preview (3x3 Grid)      <div className="max-w-7xl mx-auto p-6">

    </div>

  );            </button>        {/* Info Panel */}

};

          ) : (        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

export default VoucherDemo;
            <div className="flex gap-4">          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

              <button             <h2 className="text-lg font-semibold text-blue-800 mb-2">🖥️ Screen Preview</h2>

                onClick={handlePrint}            <p className="text-blue-700 text-sm">

                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"              Voucher ditampilkan di layar dengan ukuran diperkecil untuk preview. 

              >              Layout dan positioning sama dengan hasil print.

                🖨️ Print Vouchers (9 per halaman)            </p>

              </button>          </div>

              <button           

                onClick={handleHidePreview}          <div className="bg-green-50 border border-green-200 rounded-lg p-4">

                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium"            <h2 className="text-lg font-semibold text-green-800 mb-2">�️ Print Mode</h2>

              >            <p className="text-green-700 text-sm">

                ✕ Hide Preview              Tekan <strong>Ctrl+P</strong> untuk print preview ukuran sebenarnya 

              </button>              (80mm x 50mm) dalam layout A4 landscape.

            </div>            </p>

          )}          </div>

        </div>        </div>



        {/* Voucher Preview Container - Only show when button is pressed */}        {/* Action Buttons */}

        {showPreview && (        <div className="flex gap-4 mb-6">

          <div className="voucher-preview-container mb-8">          {!showPreview ? (

            <div className="bg-white rounded-lg shadow-lg p-6">            <button 

              <div className="flex justify-between items-center mb-4">              onClick={handleShowPreview}

                <h3 className="text-lg font-semibold text-gray-800">📋 Voucher Preview (3x3 Grid)</h3>              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"

                <span className="text-sm text-gray-500">Preview Mode - Ukuran diperkecil untuk layar</span>            >

              </div>              👁️ Show Preview

                          </button>

              <div className="voucher-preview-grid">          ) : (

                <VoucherCard data={demoVoucherData} />            <div className="flex gap-4">

                <VoucherCard data={demoVoucherDataUrgent} />              <button 

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />                onClick={handlePrint}

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />              >

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />                🖨️ Print Vouchers

                <VoucherCard isEmpty={true} />              </button>

                <VoucherCard isEmpty={true} />              <button 

                <VoucherCard isEmpty={true} />                onClick={handleHidePreview}

              </div>                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium"

            </div>              >

          </div>                ✕ Hide Preview

        )}              </button>

            </div>

        {/* Hidden Print Container - Only for printing */}          )}

        <div className="voucher-print-container print-a4-landscape-container">        </div>

          <div className="voucher-page page">

            <div className="voucher-grid">        {/* Voucher Preview Container - Only show when button is pressed */}

              <VoucherCard data={demoVoucherData} />        {showPreview && (

              <VoucherCard data={demoVoucherDataUrgent} />          <div className="voucher-preview-container mb-8">

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />            <div className="bg-white rounded-lg shadow-lg p-6">

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />              <div className="flex justify-between items-center mb-4">

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />                <h3 className="text-lg font-semibold text-gray-800">📋 Voucher Preview</h3>

              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />                <span className="text-sm text-gray-500">Preview Mode - Ukuran diperkecil untuk layar</span>

              <VoucherCard isEmpty={true} />              </div>

              <VoucherCard isEmpty={true} />              

              <VoucherCard isEmpty={true} />              <div className="voucher-preview-grid">

            </div>                <VoucherCard data={demoVoucherData} />

          </div>                <VoucherCard data={demoVoucherDataUrgent} />

        </div>                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />

                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />

        {/* Features Info */}                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">                <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />

          <div className="bg-white p-6 rounded-lg shadow">                <VoucherCard isEmpty={true} />

            <h3 className="font-semibold mb-4 text-gray-800">✨ Fitur Layout 3x3</h3>                <VoucherCard isEmpty={true} />

            <ul className="space-y-2 text-sm text-gray-600">                <VoucherCard isEmpty={true} />

              <li>✅ <strong>9 Voucher per halaman</strong>: Layout grid 3x3 optimal</li>              </div>

              <li>✅ <strong>Gap 10mm</strong>: Spasi yang cukup antar voucher</li>            </div>

              <li>✅ <strong>Area Grid 267x179mm</strong>: Sesuai spesifikasi</li>          </div>

              <li>✅ <strong>Ukuran 89x56.33mm</strong>: Per voucher</li>        )}

              <li>✅ <strong>CSS Background</strong>: Background watermark via CSS</li>

              <li>✅ <strong>Font Optimized</strong>: Times New Roman print-friendly</li>        {/* Hidden Print Container - Only for printing */}

            </ul>        <div className="voucher-print-container">

          </div>          <div className="voucher-page">

            <div className="voucher-grid">

          <div className="bg-white p-6 rounded-lg shadow">              <VoucherCard data={demoVoucherData} />

            <h3 className="font-semibold mb-4 text-gray-800">🖨️ Print Instructions</h3>              <VoucherCard data={demoVoucherDataUrgent} />

            <ol className="space-y-2 text-sm text-gray-600">              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234569", customerName: "Budi Hartono"}} />

              <li>1. Tekan <strong>Ctrl+P</strong> (Windows) atau <strong>Cmd+P</strong> (Mac)</li>              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234570", customerName: "Maria Magdalena"}} />

              <li>2. Pilih <strong>Paper Size: A4</strong></li>              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234571", customerName: "Joko Widodo"}} />

              <li>3. Pilih <strong>Orientation: Landscape</strong></li>              <VoucherCard data={{...demoVoucherData, noFaktur: "FK-001234572", customerName: "Susi Susanti"}} />

              <li>4. Set <strong>Margins: None</strong> atau <strong>Minimum</strong></li>              <VoucherCard isEmpty={true} />

              <li>5. Pastikan <strong>Print backgrounds</strong> enabled</li>              <VoucherCard isEmpty={true} />

              <li>6. Voucher akan muncul dalam grid 3x3 (9 voucher)</li>              <VoucherCard isEmpty={true} />

            </ol>            </div>

          </div>          </div>

        </div>        </div>

      </div>

    </div>        {/* Features Info */}

  );        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

};          <div className="bg-white p-6 rounded-lg shadow">

            <h3 className="font-semibold mb-4 text-gray-800">✨ Fitur Layout</h3>

export default VoucherDemo;            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ <strong>Data-Only Display</strong>: Tanpa label untuk clean look</li>
              <li>✅ <strong>CSS Background</strong>: Background watermark via CSS</li>
              <li>✅ <strong>Positioning Presisi</strong>: Berdasarkan backup testing</li>
              <li>✅ <strong>A4 Landscape Grid</strong>: 3x3 layout (9 voucher/halaman)</li>
              <li>✅ <strong>Font Optimized</strong>: Times New Roman print-friendly</li>
              <li>✅ <strong>Gap 10mm</strong>: Spasi optimal antar voucher</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4 text-gray-800">�️ Print Instructions</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Tekan <strong>Ctrl+P</strong> (Windows) atau <strong>Cmd+P</strong> (Mac)</li>
              <li>2. Pilih <strong>Paper Size: A4</strong></li>
              <li>3. Pilih <strong>Orientation: Landscape</strong></li>
              <li>4. Set <strong>Margins: None</strong> atau <strong>Minimum</strong></li>
              <li>5. Pastikan <strong>Print backgrounds</strong> enabled</li>
              <li>6. Voucher akan muncul dalam grid 3x3</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDemo;