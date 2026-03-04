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
    'Nominal Angsuran', 'Terbayar', 'Belum Bayar', 'Total Belum Bayar',
    'Persentase Terbayar', 'Status'
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
      row.coupons_unpaid,
      // Dynamic formula: Belum Bayar × Nominal Angsuran
      { formula: `H${rowNum}*F${rowNum}` },
      // Dynamic formula: Persentase Terbayar = (Terbayar / Kupon Keluar) × 100%
      { formula: `IF(D${rowNum}=0,0,G${rowNum}/D${rowNum})` },
      // Dynamic formula: Status berdasarkan persentase
      { formula: `IF(J${rowNum}>=0.9,"Lancar",IF(J${rowNum}>=0.7,"Kurang Lancar","Bermasalah"))` }
    ]);

    dataRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      
      // Format currency columns (Nominal Angsuran & Total Belum Bayar)
      if (colNumber === 6 || colNumber === 9) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
      // Format percentage column (Persentase Terbayar)
      else if (colNumber === 10) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'center' };
      }
      // Format number columns - center alignment (Kupon Keluar, Kupon di Kolektor, Terbayar, Belum Bayar)
      else if (colNumber === 4 || colNumber === 5 || colNumber === 7 || colNumber === 8) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      }
      // Status column styling
      else if (colNumber === 11) {
        cell.alignment = { horizontal: 'center' };
        // Conditional formatting akan ditambah nanti
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
    { formula: `SUM(H${startRow}:H${endRow})` }, // Total Belum Bayar
    { formula: `SUM(I${startRow}:I${endRow})` }, // Total Nilai Belum Bayar
    { formula: `AVERAGE(J${startRow}:J${endRow})` }, // Rata-rata Persentase
    { formula: `COUNTIF(K${startRow}:K${endRow},"Bermasalah")&" Bermasalah"` } // Status Summary
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
    } else if (colNumber === 6 || colNumber === 9) { // Nominal Angsuran & Total Belum Bayar
      cell.numFmt = '"Rp "#,##0';
      cell.alignment = { horizontal: 'right' };
    } else if (colNumber === 10) { // Persentase
      cell.numFmt = '0.0%';
      cell.alignment = { horizontal: 'center' };
    } else if (colNumber === 4 || colNumber === 5 || colNumber === 7 || colNumber === 8) { // Numbers
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'center' };
    } else if (colNumber === 11) { // Status
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
    { width: 12 },  // Belum Bayar
    { width: 20 },  // Total Belum Bayar
    { width: 16 },  // Persentase Terbayar
    { width: 15 },  // Status
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
    ['Total Kupon Belum Bayar', `=SUM('Kupon Belum Bayar'.H${startRow}:H${endRow})`, 'Jumlah kupon yang belum dibayar'],
    ['Total Nilai Belum Bayar', `=SUM('Kupon Belum Bayar'.I${startRow}:I${endRow})`, 'Total nilai rupiah yang belum terbayar'],
    ['Rata-rata Persentase Bayar', `=AVERAGE('Kupon Belum Bayar'.J${startRow}:J${endRow})`, 'Rata-rata tingkat pembayaran'],
    ['Kontrak Bermasalah', `=COUNTIF('Kupon Belum Bayar'.K${startRow}:K${endRow},"Bermasalah")`, 'Jumlah kontrak dengan status bermasalah'],
    ['Tingkat Kolektibilitas', `=1-B9/B2`, 'Persentase kontrak yang tidak bermasalah'],
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
      if (index >= 5 && index <= 6) { // Nilai rupiah
        row.getCell(2).numFmt = '"Rp "#,##0';
      } else if (index === 7 || index === 9) { // Persentase
        row.getCell(2).numFmt = '0.0%';
      } else if (index >= 2 && index <= 8) { // Angka biasa
        row.getCell(2).numFmt = '#,##0';
      }
    }
  });

  // Set column widths for summary
  summarySheet.getColumn('A').width = 25;
  summarySheet.getColumn('B').width = 20;
  summarySheet.getColumn('C').width = 35;

  // ============ Sheet 3: Status Breakdown ============
  const statusSheet = workbook.addWorksheet('Status Breakdown');
  
  statusSheet.mergeCells('A1:C1');
  const statusTitleCell = statusSheet.getCell('A1');
  statusTitleCell.value = 'BREAKDOWN STATUS PEMBAYARAN';
  statusTitleCell.font = { bold: true, size: 14 };
  statusTitleCell.alignment = { horizontal: 'center' };

  statusSheet.addRow([]);
  statusSheet.addRow([]);
  
  const statusData = [
    ['Status', 'Jumlah Kontrak', 'Persentase'],
    ['Lancar (≥90%)', `=COUNTIF('Kupon Belum Bayar'.J${startRow}:J${endRow},">=0.9")`, `=B4/SUM(B4:B6)`],
    ['Kurang Lancar (70-89%)', `=COUNTIFS('Kupon Belum Bayar'.J${startRow}:J${endRow},">=0.7",'Kupon Belum Bayar'.J${startRow}:J${endRow},"<0.9")`, `=B5/SUM(B4:B6)`],
    ['Bermasalah (<70%)', `=COUNTIF('Kupon Belum Bayar'.J${startRow}:J${endRow},"<0.7")`, `=B6/SUM(B4:B6)`],
    ['TOTAL', `=SUM(B4:B6)`, '100%'],
  ];

  statusData.forEach((rowData, index) => {
    const row = statusSheet.addRow(rowData);
    
    if (index === 0 || index === statusData.length - 1) {
      // Header and total row styling
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index === 0 ? 'FF4472C4' : 'FFD9E2F3' } };
        if (index === 0) {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        }
        cell.alignment = { horizontal: 'center' };
      });
    }
    
    // Format percentage column
    if (index > 0) {
      row.getCell(3).numFmt = '0.0%';
      row.getCell(3).alignment = { horizontal: 'center' };
    }
  });

  // Set column widths
  statusSheet.getColumn('A').width = 20;
  statusSheet.getColumn('B').width = 15;
  statusSheet.getColumn('C').width = 15;

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
