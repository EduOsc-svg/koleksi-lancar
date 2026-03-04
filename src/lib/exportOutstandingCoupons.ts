import ExcelJS from 'exceljs';
import type { OutstandingCouponSummary } from '@/hooks/useOutstandingCoupons';
import type { CouponHandover } from '@/hooks/useCouponHandovers';

export const exportOutstandingCouponsToExcel = async (data: OutstandingCouponSummary[], handovers?: CouponHandover[]) => {
  // Aggregate handover counts per contract
  const handoverMap = new Map<string, number>();
  if (handovers) {
    for (const h of handovers) {
      handoverMap.set(h.contract_id, (handoverMap.get(h.contract_id) || 0) + h.coupon_count);
    }
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  // ============ Sheet 1: Laporan Utama ============
  const sheet = workbook.addWorksheet('Kupon Belum Bayar');

  // Title
  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'LAPORAN KUPON BELUM TERBAYAR';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };

  // Subtitle with date
  sheet.mergeCells('A2:J2');
  const dateCell = sheet.getCell('A2');
  dateCell.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  dateCell.font = { italic: true, size: 12 };
  dateCell.alignment = { horizontal: 'center' };

  // Empty row
  sheet.addRow([]);

  // Headers with enhanced columns
  const headers = [
    'No', 'Nama Konsumen', 'Kode Kontrak', 'Kupon Keluar', 'Kupon di Kolektor',
    'Nominal Angsuran', 'Terbayar', 'Telah Dibayar', 'Belum Bayar', 'Total Belum Bayar'
  ];
  const hRow = sheet.addRow(headers);
  hRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  // Data rows with enhanced formulas
  const startRow = hRow.number + 1;
  data.forEach((row, i) => {
    const rowNum = startRow + i;
    const kuponDiKolektor = handoverMap.get(row.contract_id) || 0;
    const dataRow = sheet.addRow([
      i + 1,
      row.customer_name,
      row.contract_ref,
      row.total_coupons_issued,
      kuponDiKolektor,
      row.daily_installment_amount,
      row.coupons_paid,
      // Dynamic formula: Terbayar × Nominal Angsuran
      { formula: `G${rowNum}*F${rowNum}` },
      row.coupons_unpaid,
      // Dynamic formula: Belum Bayar × Nominal Angsuran
      { formula: `I${rowNum}*F${rowNum}` }
    ]);

    dataRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      
      // Format currency columns (Nominal Angsuran, Telah Dibayar & Total Belum Bayar)
      if (colNumber === 6 || colNumber === 8 || colNumber === 10) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
      // Format number columns - center alignment (Kupon Keluar, Kupon di Kolektor, Terbayar, Belum Bayar)
      else if (colNumber === 4 || colNumber === 5 || colNumber === 7 || colNumber === 9) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      }
    });
  });

  // Total row with comprehensive formulas
  const endRow = startRow + data.length - 1;
  const totalRow = sheet.addRow([
    '',
    '',
    'TOTAL',
    { formula: `SUM(D${startRow}:D${endRow})` }, // Total Kupon Keluar
    { formula: `SUM(E${startRow}:E${endRow})` }, // Total Kupon di Kolektor
    { formula: `AVERAGE(F${startRow}:F${endRow})` }, // Rata-rata Nominal Angsuran
    { formula: `SUM(G${startRow}:G${endRow})` }, // Total Terbayar
    { formula: `SUM(H${startRow}:H${endRow})` }, // Total Telah Dibayar
    { formula: `SUM(I${startRow}:I${endRow})` }, // Total Belum Bayar
    { formula: `SUM(J${startRow}:J${endRow})` } // Total Nilai Belum Bayar
  ]);

  // Style total row
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    cell.border = {
      top: { style: 'double' }, bottom: { style: 'double' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };

    if (colNumber === 3) {
      cell.alignment = { horizontal: 'right' };
    } else if (colNumber === 6 || colNumber === 8 || colNumber === 10) { // Nominal Angsuran, Telah Dibayar & Total Belum Bayar
      cell.numFmt = '"Rp "#,##0';
      cell.alignment = { horizontal: 'right' };
    } else if (colNumber === 4 || colNumber === 5 || colNumber === 7 || colNumber === 9) { // Numbers
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'center' };
    }
  });

  // Column widths
  sheet.columns = [
    { width: 5 },   // No
    { width: 25 },  // Nama Konsumen
    { width: 15 },  // Kode Kontrak
    { width: 12 },  // Kupon Keluar
    { width: 15 },  // Kupon di Kolektor
    { width: 18 },  // Nominal Angsuran
    { width: 12 },  // Terbayar
    { width: 18 },  // Telah Dibayar
    { width: 12 },  // Belum Bayar
    { width: 18 },  // Total Belum Bayar
  ];

  // ============ Sheet 2: Analisis Ringkasan ============
  const summarySheet = workbook.addWorksheet('Analisis Ringkasan');
  
  summarySheet.mergeCells('A1:C1');
  const summaryTitleCell = summarySheet.getCell('A1');
  summaryTitleCell.value = 'ANALISIS RINGKASAN PENAGIHAN BELUM BAYAR';
  summaryTitleCell.font = { bold: true, size: 14 };
  summaryTitleCell.alignment = { horizontal: 'center' };

  // Summary metrics
  summarySheet.addRow([]);
  summarySheet.addRow([]);
  
  const summaryMetrics = [
    ['Metrik', 'Nilai', 'Formula'],
    ['Total Kontrak', `=COUNTA('Kupon Belum Bayar'.B${startRow}:B${endRow})`, 'Menghitung jumlah kontrak'],
    ['Total Kupon Keluar', `=SUM('Kupon Belum Bayar'.D${startRow}:D${endRow})`, 'Jumlah seluruh kupon yang diterbitkan'],
    ['Total Kupon di Kolektor', `=SUM('Kupon Belum Bayar'.E${startRow}:E${endRow})`, 'Jumlah kupon yang diserahkan ke kolektor'],
    ['Total Kupon Terbayar', `=SUM('Kupon Belum Bayar'.G${startRow}:G${endRow})`, 'Jumlah kupon yang sudah dibayar'],
    ['Total Nilai Telah Dibayar', `=SUM('Kupon Belum Bayar'.H${startRow}:H${endRow})`, 'Total nilai rupiah yang sudah dibayar'],
    ['Total Kupon Belum Bayar', `=SUM('Kupon Belum Bayar'.I${startRow}:I${endRow})`, 'Jumlah kupon yang belum dibayar'],
    ['Total Nilai Belum Bayar', `=SUM('Kupon Belum Bayar'.J${startRow}:J${endRow})`, 'Total nilai rupiah yang belum terbayar']
  ];

  summaryMetrics.forEach((rowData, index) => {
    const row = summarySheet.addRow(rowData);
    
    if (index === 0) {
      // Header styling
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      });
    } else {
      // Data formatting
      if (index >= 5 && index <= 7) { // Nilai rupiah
        row.getCell(2).numFmt = '"Rp "#,##0';
      } else if (index >= 2 && index <= 4) { // Angka biasa
        row.getCell(2).numFmt = '#,##0';
      }
    }
  });

  // Set column widths for summary
  summarySheet.getColumn('A').width = 25;
  summarySheet.getColumn('B').width = 20;
  summarySheet.getColumn('C').width = 35;

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kupon_Belum_Bayar_Dinamis_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
