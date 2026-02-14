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
    'No', 'Nama Konsumen', 'Kode Kontrak', 'Kupon Keluar', 
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
      { formula: `G${rowNum}*E${rowNum}` },
      // Dynamic formula: Persentase Terbayar = (Terbayar / Kupon Keluar) × 100%
      { formula: `IF(D${rowNum}=0,0,F${rowNum}/D${rowNum})` },
      // Dynamic formula: Status berdasarkan persentase
      { formula: `IF(I${rowNum}>=0.9,"Lancar",IF(I${rowNum}>=0.7,"Kurang Lancar","Bermasalah"))` }
    ]);

    dataRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      
      // Format currency columns
      if (colNumber === 5 || colNumber === 8) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
      // Format percentage column
      else if (colNumber === 9) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'center' };
      }
      // Format number columns (center)
      else if (colNumber >= 4 && colNumber <= 7) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      }
      // Status column styling
      else if (colNumber === 10) {
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
    { formula: `AVERAGE(E${startRow}:E${endRow})` }, // Rata-rata Nominal
    { formula: `SUM(F${startRow}:F${endRow})` }, // Total Terbayar
    { formula: `SUM(G${startRow}:G${endRow})` }, // Total Belum Bayar
    { formula: `SUM(H${startRow}:H${endRow})` }, // Total Nilai Belum Bayar
    { formula: `AVERAGE(I${startRow}:I${endRow})` }, // Rata-rata Persentase
    { formula: `COUNTIF(J${startRow}:J${endRow},"Bermasalah")&" Bermasalah"` } // Status Summary
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
    } else if (colNumber === 5 || colNumber === 8) {
      cell.numFmt = '"Rp "#,##0';
      cell.alignment = { horizontal: 'right' };
    } else if (colNumber === 9) {
      cell.numFmt = '0.0%';
      cell.alignment = { horizontal: 'center' };
    } else if (colNumber >= 4 && colNumber <= 7) {
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'center' };
    } else if (colNumber === 10) {
      cell.alignment = { horizontal: 'center' };
    }
  });

  // Column widths
  sheet.columns = [
    { width: 5 },   // No
    { width: 25 },  // Nama Konsumen
    { width: 15 },  // Kode Kontrak
    { width: 12 },  // Kupon Keluar
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
    ['Total Kupon Terbayar', `=SUM('Kupon Belum Bayar'.F${startRow}:F${endRow})`, 'Jumlah kupon yang sudah dibayar'],
    ['Total Kupon Belum Bayar', `=SUM('Kupon Belum Bayar'.G${startRow}:G${endRow})`, 'Jumlah kupon yang belum dibayar'],
    ['Total Nilai Belum Bayar', `=SUM('Kupon Belum Bayar'.H${startRow}:H${endRow})`, 'Total nilai rupiah yang belum terbayar'],
    ['Rata-rata Persentase Bayar', `=AVERAGE('Kupon Belum Bayar'.I${startRow}:I${endRow})`, 'Rata-rata tingkat pembayaran'],
    ['Kontrak Bermasalah', `=COUNTIF('Kupon Belum Bayar'.J${startRow}:J${endRow},"Bermasalah")`, 'Jumlah kontrak dengan status bermasalah'],
    ['Tingkat Kolektibilitas', `=1-B8/B2`, 'Persentase kontrak yang tidak bermasalah'],
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
    ['Lancar (≥90%)', `=COUNTIF('Kupon Belum Bayar'.I${startRow}:I${endRow},">=0.9")`, `=B4/SUM(B4:B6)`],
    ['Kurang Lancar (70-89%)', `=COUNTIFS('Kupon Belum Bayar'.I${startRow}:I${endRow},">=0.7",'Kupon Belum Bayar'.I${startRow}:I${endRow},"<0.9")`, `=B5/SUM(B4:B6)`],
    ['Bermasalah (<70%)', `=COUNTIF('Kupon Belum Bayar'.I${startRow}:I${endRow},"<0.7")`, `=B6/SUM(B4:B6)`],
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

  // ============ Sheet 4: Ringkasan Kupon per Konsumen ============
  const customerSummarySheet = workbook.addWorksheet('Ringkasan per Konsumen');
  
  customerSummarySheet.mergeCells('A1:F1');
  const customerTitleCell = customerSummarySheet.getCell('A1');
  customerTitleCell.value = 'RINGKASAN KUPON DITERIMA & DIBAYAR PER KONSUMEN';
  customerTitleCell.font = { bold: true, size: 14 };
  customerTitleCell.alignment = { horizontal: 'center' };
  customerTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B46C1' } };
  customerTitleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };

  // Subtitle with generation date
  customerSummarySheet.mergeCells('A2:F2');
  const customerDateCell = customerSummarySheet.getCell('A2');
  customerDateCell.value = `Data per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  customerDateCell.font = { italic: true, size: 11 };
  customerDateCell.alignment = { horizontal: 'center' };

  customerSummarySheet.addRow([]);

  // Customer summary headers
  const customerHeaders = [
    'No', 'Nama Konsumen', 'Kode Kontrak', 'Kupon Diterima', 'Kupon Dibayar', 'Tingkat Pembayaran'
  ];
  const customerHeaderRow = customerSummarySheet.addRow(customerHeaders);
  customerHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  // Customer data rows
  const customerStartRow = customerHeaderRow.number + 1;
  data.forEach((customerData, i) => {
    const rowNum = customerStartRow + i;
    const kuponDiterima = handoverMap.get(customerData.contract_id) || 0;
    
    const customerRow = customerSummarySheet.addRow([
      i + 1,
      customerData.customer_name,
      customerData.contract_ref,
      kuponDiterima,
      customerData.coupons_paid,
      // Dynamic formula: Tingkat Pembayaran = (Kupon Dibayar / Kupon Diterima) × 100%
      kuponDiterima > 0 ? { formula: `IF(D${rowNum}=0,0,E${rowNum}/D${rowNum})` } : 0
    ]);

    customerRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      
      // Format number columns (center)
      if (colNumber >= 4 && colNumber <= 5) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      }
      // Format percentage column
      else if (colNumber === 6) {
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'center' };
        
        // Color coding based on payment rate
        const paymentRate = kuponDiterima > 0 ? customerData.coupons_paid / kuponDiterima : 0;
        if (paymentRate >= 0.9) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Light green
          cell.font = { color: { argb: 'FF065F46' } }; // Dark green
        } else if (paymentRate >= 0.7) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Light yellow
          cell.font = { color: { argb: 'FF92400E' } }; // Dark yellow
        } else if (kuponDiterima > 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } }; // Light red
          cell.font = { color: { argb: 'FF991B1B' } }; // Dark red
        }
      }
    });
  });

  // Customer summary total row
  const customerEndRow = customerStartRow + data.length - 1;
  const customerTotalRow = customerSummarySheet.addRow([
    '',
    '',
    'TOTAL',
    { formula: `SUM(D${customerStartRow}:D${customerEndRow})` }, // Total Kupon Diterima
    { formula: `SUM(E${customerStartRow}:E${customerEndRow})` }, // Total Kupon Dibayar
    { formula: `AVERAGE(F${customerStartRow}:F${customerEndRow})` } // Rata-rata Tingkat Pembayaran
  ]);

  // Style customer total row
  customerTotalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
    cell.border = {
      top: { style: 'double' }, bottom: { style: 'double' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };

    if (colNumber === 3) {
      cell.alignment = { horizontal: 'right' };
    } else if (colNumber >= 4 && colNumber <= 5) {
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'center' };
    } else if (colNumber === 6) {
      cell.numFmt = '0.0%';
      cell.alignment = { horizontal: 'center' };
    }
  });

  // Set customer summary column widths
  customerSummarySheet.columns = [
    { width: 5 },   // No
    { width: 25 },  // Nama Konsumen
    { width: 15 },  // Kode Kontrak
    { width: 14 },  // Kupon Diterima
    { width: 14 },  // Kupon Dibayar
    { width: 18 },  // Tingkat Pembayaran
  ];

  // Add summary statistics below the table
  customerSummarySheet.addRow([]);
  customerSummarySheet.addRow([]);
  
  const customerStatsHeaders = customerSummarySheet.addRow(['STATISTIK RINGKASAN', '', '', '', '', '']);
  customerStatsHeaders.getCell(1).font = { bold: true, size: 12 };
  customerStatsHeaders.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };

  const totalCustomers = data.length;
  const totalHandoverTransactions = handovers?.length || 0;
  const customersWithHandovers = new Set(handovers?.map(h => h.contract_id) || []).size;
  const averageCouponsPerCustomer = totalHandoverTransactions > 0 ? 
    (handovers?.reduce((sum, h) => sum + h.coupon_count, 0) || 0) / customersWithHandovers : 0;

  const statsData = [
    ['Total Konsumen', totalCustomers, '', '', '', ''],
    ['Konsumen dengan Serah Terima', customersWithHandovers, '', '', '', ''],
    ['Total Transaksi Serah Terima', totalHandoverTransactions, '', '', '', ''],
    ['Rata-rata Kupon per Konsumen', Math.round(averageCouponsPerCustomer * 100) / 100, '', '', '', ''],
  ];

  statsData.forEach((statRow) => {
    const row = customerSummarySheet.addRow(statRow);
    row.getCell(1).font = { bold: true };
    row.getCell(2).font = { bold: true };
    row.getCell(2).numFmt = '#,##0.00';
  });

  // ============ Sheet 5: Riwayat Detail Serah Terima ============
  if (handovers && handovers.length > 0) {
    const handoverHistorySheet = workbook.addWorksheet('Riwayat Serah Terima');
    
    handoverHistorySheet.mergeCells('A1:H1');
    const handoverTitleCell = handoverHistorySheet.getCell('A1');
    handoverTitleCell.value = 'RIWAYAT DETAIL SERAH TERIMA KUPON';
    handoverTitleCell.font = { bold: true, size: 14 };
    handoverTitleCell.alignment = { horizontal: 'center' };
    handoverTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
    handoverTitleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };

    // Subtitle with total transactions
    handoverHistorySheet.mergeCells('A2:H2');
    const handoverSubtitleCell = handoverHistorySheet.getCell('A2');
    handoverSubtitleCell.value = `Total ${handovers.length} transaksi serah terima kupon`;
    handoverSubtitleCell.font = { italic: true, size: 11 };
    handoverSubtitleCell.alignment = { horizontal: 'center' };

    handoverHistorySheet.addRow([]);

    // Handover history headers
    const handoverHeaders = [
      'No', 'Tanggal', 'Kolektor', 'Konsumen', 'Kode Kontrak', 'Range Kupon', 'Jumlah', 'Total Nilai'
    ];
    const handoverHeaderRow = handoverHistorySheet.addRow(handoverHeaders);
    handoverHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    // Sort handovers by date (newest first)
    const sortedHandovers = [...handovers].sort((a, b) => 
      new Date(b.handover_date).getTime() - new Date(a.handover_date).getTime()
    );

    // Handover data rows
    const handoverStartRow = handoverHeaderRow.number + 1;
    sortedHandovers.forEach((handover, i) => {
      const installmentAmount = handover.credit_contracts?.daily_installment_amount || 0;
      const totalValue = handover.coupon_count * installmentAmount;
      
      const handoverRow = handoverHistorySheet.addRow([
        i + 1,
        new Date(handover.handover_date).toLocaleDateString('id-ID'),
        `${handover.collectors?.name} (${handover.collectors?.collector_code})`,
        handover.credit_contracts?.customers?.name || '-',
        handover.credit_contracts?.contract_ref || '-',
        `#${handover.start_index}-#${handover.end_index}`,
        handover.coupon_count,
        totalValue
      ]);

      handoverRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
        
        // Format specific columns
        if (colNumber === 7) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if (colNumber === 8) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 1) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    // Handover total row
    const handoverEndRow = handoverStartRow + sortedHandovers.length - 1;
    const handoverTotalRow = handoverHistorySheet.addRow([
      '',
      '',
      '',
      '',
      '',
      'TOTAL',
      { formula: `SUM(G${handoverStartRow}:G${handoverEndRow})` }, // Total Kupon
      { formula: `SUM(H${handoverStartRow}:H${handoverEndRow})` }  // Total Nilai
    ]);

    // Style handover total row
    handoverTotalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } };
      cell.border = {
        top: { style: 'double' }, bottom: { style: 'double' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };

      if (colNumber === 6) {
        cell.alignment = { horizontal: 'right' };
      } else if (colNumber === 7) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 8) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Set handover history column widths
    handoverHistorySheet.columns = [
      { width: 5 },   // No
      { width: 12 },  // Tanggal
      { width: 20 },  // Kolektor
      { width: 25 },  // Konsumen
      { width: 15 },  // Kode Kontrak
      { width: 14 },  // Range Kupon
      { width: 10 },  // Jumlah
      { width: 18 },  // Total Nilai
    ];
  }

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
