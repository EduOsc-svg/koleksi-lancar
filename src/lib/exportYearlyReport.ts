import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { YearlyFinancialSummary, MonthlyDetailData } from '@/hooks/useYearlyFinancialSummary';

export const exportYearlyReportToExcel = async (
  data: YearlyFinancialSummary,
  year: number
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  // ============ Sheet 1: Ringkasan Tahunan ============
  const summarySheet = workbook.addWorksheet('Ringkasan Tahunan');
  
  // Title
  summarySheet.mergeCells('A1:C1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `LAPORAN KEUANGAN TAHUNAN ${year}`;
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  summarySheet.mergeCells('A2:C2');
  const subtitleCell = summarySheet.getCell('A2');
  subtitleCell.value = 'MANAGEMENT SYSTEM KREDIT';
  subtitleCell.font = { bold: true, size: 12 };
  subtitleCell.alignment = { horizontal: 'center' };

  // Table header
  const summaryHeaderRow = summarySheet.addRow(['']);
  const summaryTableHeader = summarySheet.addRow(['Metrik', 'Nilai', 'Keterangan']);
  summaryTableHeader.font = { bold: true };
  summaryTableHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  const summaryRows: [string, number, string, string][] = [
    ['Total Modal', data.total_modal, '"Rp "#,##0', 'Total modal yang dikeluarkan'],
    ['Total Omset', data.total_omset, '"Rp "#,##0', 'Total pinjaman yang disalurkan'],
    ['Keuntungan Kotor', data.total_profit, '"Rp "#,##0', 'Omset - Modal'],
    ['Total Komisi', data.total_commission, '"Rp "#,##0', 'Komisi sales agent'],
    ['Biaya Operasional', data.total_expenses, '"Rp "#,##0', 'Total biaya operasional'],
    ['Keuntungan Bersih', data.net_profit, '"Rp "#,##0', 'Profit - Komisi - Operasional'],
    ['Jumlah Kontrak', data.contracts_count, '#,##0', 'Total kontrak aktif'],
    ['Kontrak Selesai', data.completed_count, '#,##0', 'Kontrak yang sudah lunas'],
    ['Kontrak Aktif', data.active_count, '#,##0', 'Kontrak yang masih berjalan'],
    ['Lancar', data.lancar_count, '#,##0', 'Status pembayaran lancar'],
    ['Kurang Lancar', data.kurang_lancar_count, '#,##0', 'Status pembayaran kurang lancar'],
    ['Macet', data.macet_count, '#,##0', 'Status pembayaran macet'],
    ['Margin Keuntungan', data.profit_margin / 100, '0.0%', 'Persentase keuntungan dari omset'],
    ['Total Tertagih', data.total_collected, '"Rp "#,##0', 'Total pembayaran diterima'],
    ['Sisa Tagihan', data.total_to_collect, '"Rp "#,##0', 'Total tagihan belum terbayar'],
    ['Tingkat Penagihan', data.collection_rate / 100, '0.0%', 'Efektivitas penagihan'],
  ];

  summaryRows.forEach((item) => {
    const row = summarySheet.addRow([item[0], item[1], item[3]]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).numFmt = item[2];
    
    // Highlight net profit
    if (item[0] === 'Keuntungan Bersih') {
      row.getCell(2).font = { bold: true, color: { argb: (item[1] as number) >= 0 ? 'FF008000' : 'FFFF0000' } };
    }

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });
  });

  // Set column widths
  summarySheet.getColumn('A').width = 25;
  summarySheet.getColumn('B').width = 22;
  summarySheet.getColumn('C').width = 35;

  // ============ Sheet 2: Breakdown Bulanan ============
  const monthlySheet = workbook.addWorksheet('Breakdown Bulanan');
  
  // Header
  const monthlyHeaders = ['Bulan', 'Modal', 'Omset', 'Operasional', 'Keuntungan', 'Komisi', 'Tertagih', 'Jumlah Kontrak'];
  const headerRow = monthlySheet.addRow(monthlyHeaders);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Data rows
  const monthlyStartRow = 2;
  data.monthly_breakdown.forEach((month, index) => {
    const row = monthlySheet.addRow([
      month.monthLabel,
      month.total_modal,
      month.total_omset,
      month.operational,
      month.profit,
      month.commission,
      month.collected,
      month.contracts_count,
    ]);

    // Format currency columns (B-G = 2-7)
    [2, 3, 4, 5, 6, 7].forEach(colIndex => {
      row.getCell(colIndex).numFmt = '"Rp "#,##0';
    });
  });

  // Add totals row with SUM formulas
  const dataEndRow = monthlyStartRow + data.monthly_breakdown.length - 1;
  const totalsRow = monthlySheet.addRow([
    'TOTAL',
    { formula: `SUM(B${monthlyStartRow}:B${dataEndRow})` },
    { formula: `SUM(C${monthlyStartRow}:C${dataEndRow})` },
    { formula: `SUM(D${monthlyStartRow}:D${dataEndRow})` },
    { formula: `SUM(E${monthlyStartRow}:E${dataEndRow})` },
    { formula: `SUM(F${monthlyStartRow}:F${dataEndRow})` },
    { formula: `SUM(G${monthlyStartRow}:G${dataEndRow})` },
    { formula: `SUM(H${monthlyStartRow}:H${dataEndRow})` },
  ]);
  totalsRow.font = { bold: true };
  totalsRow.eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    if (colNumber >= 2 && colNumber <= 7) {
      cell.numFmt = '"Rp "#,##0';
    }
  });

  // Set column widths
  monthlySheet.getColumn(1).width = 15;
  [2, 3, 4, 5, 6, 7].forEach(col => {
    monthlySheet.getColumn(col).width = 18;
  });
  monthlySheet.getColumn(8).width = 15;

  // ============ Sheet 3: Performa Sales Agent ============
  const agentSheet = workbook.addWorksheet('Performa Sales Agent');
  
  // Header
  const agentHeaders = ['No', 'Kode', 'Nama', 'Komisi %', 'Modal', 'Omset', 'Keuntungan', 'Komisi (Rp)', 'Jumlah Kontrak'];
  const agentHeaderRow = agentSheet.addRow(agentHeaders);
  agentHeaderRow.font = { bold: true };
  agentHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Data rows with formulas
  const agentStartRow = 2;
  data.agents.forEach((agent, index) => {
    const rowNum = agentStartRow + index;
    const row = agentSheet.addRow([
      index + 1,
      agent.agent_code,
      agent.agent_name,
      agent.commission_percentage / 100,
      agent.total_modal,
      agent.total_omset,
      // Profit formula: Omset - Modal
      { formula: `F${rowNum}-E${rowNum}` },
      // Commission formula: Omset * Commission %
      { formula: `F${rowNum}*D${rowNum}` },
      agent.contracts_count,
    ]);

    // Format cells
    row.getCell(4).numFmt = '0%';
    [5, 6, 7, 8].forEach(colIndex => {
      row.getCell(colIndex).numFmt = '"Rp "#,##0';
    });
  });

  // Add totals row with SUM formulas
  const agentDataEndRow = agentStartRow + data.agents.length - 1;
  if (data.agents.length > 0) {
    const agentTotalsRow = agentSheet.addRow([
      '',
      '',
      'TOTAL',
      '',
      { formula: `SUM(E${agentStartRow}:E${agentDataEndRow})` },
      { formula: `SUM(F${agentStartRow}:F${agentDataEndRow})` },
      { formula: `SUM(G${agentStartRow}:G${agentDataEndRow})` },
      { formula: `SUM(H${agentStartRow}:H${agentDataEndRow})` },
      { formula: `SUM(I${agentStartRow}:I${agentDataEndRow})` },
    ]);
    agentTotalsRow.font = { bold: true };
    agentTotalsRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };
      if (colNumber >= 5 && colNumber <= 8) {
        cell.numFmt = '"Rp "#,##0';
      }
    });
  }

  // Set column widths
  agentSheet.getColumn(1).width = 5;
  agentSheet.getColumn(2).width = 10;
  agentSheet.getColumn(3).width = 25;
  agentSheet.getColumn(4).width = 12;
  [5, 6, 7, 8].forEach(col => {
    agentSheet.getColumn(col).width = 18;
  });
  agentSheet.getColumn(9).width = 15;

  // ============ Sheet 4: Analisis Trend Penagihan ============
  const trendSheet = workbook.addWorksheet('Trend Penagihan');
  
  trendSheet.mergeCells('A1:D1');
  const trendTitleCell = trendSheet.getCell('A1');
  trendTitleCell.value = `ANALISIS TREND PENAGIHAN ${year}`;
  trendTitleCell.font = { bold: true, size: 14 };
  trendTitleCell.alignment = { horizontal: 'center' };

  // Trend Analysis Headers
  const trendHeaders = ['Bulan', 'Total Penagihan', 'Rata-rata Harian', 'Target vs Realisasi'];
  const trendHeaderRow = trendSheet.addRow(['']);
  trendSheet.addRow(['']);
  const trendDataHeaderRow = trendSheet.addRow(trendHeaders);
  
  trendDataHeaderRow.font = { bold: true };
  trendDataHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Calculate trend data from monthly breakdown
  const trendStartRow = 4;
  data.monthly_breakdown.forEach((month, index) => {
    const rowNum = trendStartRow + index;
    const daysInMonth = new Date(year, index + 1, 0).getDate();
    const averageDaily = month.collected / daysInMonth;
    const targetRealization = (month.collected / month.total_omset) * 100;

    const row = trendSheet.addRow([
      month.monthLabel,
      month.collected,
      averageDaily,
      targetRealization / 100,
    ]);

    // Format cells
    row.getCell(2).numFmt = '"Rp "#,##0';
    row.getCell(3).numFmt = '"Rp "#,##0';
    row.getCell(4).numFmt = '0.0%';
  });

  // Add trend summary
  const trendSummaryRow = trendStartRow + data.monthly_breakdown.length + 1;
  trendSheet.getCell(`A${trendSummaryRow}`).value = 'RINGKASAN TREND:';
  trendSheet.getCell(`A${trendSummaryRow}`).font = { bold: true };

  trendSheet.getCell(`A${trendSummaryRow + 1}`).value = 'Total Penagihan Tahun:';
  trendSheet.getCell(`B${trendSummaryRow + 1}`).value = data.total_collected;
  trendSheet.getCell(`B${trendSummaryRow + 1}`).numFmt = '"Rp "#,##0';

  trendSheet.getCell(`A${trendSummaryRow + 2}`).value = 'Rata-rata Bulanan:';
  trendSheet.getCell(`B${trendSummaryRow + 2}`).value = data.total_collected / 12;
  trendSheet.getCell(`B${trendSummaryRow + 2}`).numFmt = '"Rp "#,##0';

  trendSheet.getCell(`A${trendSummaryRow + 3}`).value = 'Tingkat Penagihan:';
  trendSheet.getCell(`B${trendSummaryRow + 3}`).value = data.collection_rate / 100;
  trendSheet.getCell(`B${trendSummaryRow + 3}`).numFmt = '0.0%';

  // Set column widths for trend sheet
  trendSheet.getColumn('A').width = 15;
  trendSheet.getColumn('B').width = 20;
  trendSheet.getColumn('C').width = 20;
  trendSheet.getColumn('D').width = 20;

  // ============ Sheet 5: Rumus Kalkulasi ============
  const formulaSheet = workbook.addWorksheet('Rumus Kalkulasi');
  
  formulaSheet.mergeCells('A1:C1');
  formulaSheet.getCell('A1').value = 'RUMUS KALKULASI BISNIS';
  formulaSheet.getCell('A1').font = { bold: true, size: 14 };
  formulaSheet.getCell('A1').alignment = { horizontal: 'center' };

  const formulas = [
    ['Total Pinjaman (Omset)', '= Modal × 1.2', 'Margin keuntungan 20%'],
    ['Keuntungan Kotor', '= Omset - Modal', 'Selisih nilai pinjaman dan modal'],
    ['Cicilan Harian', '= Omset ÷ Tenor', 'Pembagian merata per hari kerja'],
    ['Komisi Agen', '= Omset × Persentase Komisi', 'Komisi berdasarkan tier dinamis'],
    ['Keuntungan Bersih', '= Profit Kotor - Komisi - Operasional', 'Laba setelah semua biaya'],
    ['Margin Keuntungan', '= (Profit Kotor ÷ Omset) × 100%', 'Persentase margin dari omset'],
    ['Tingkat Penagihan', '= Tertagih ÷ (Tertagih + Sisa) × 100%', 'Efektivitas penagihan'],
    ['Trend Analysis', '= Rata-rata Harian × Hari dalam Bulan', 'Proyeksi penagihan bulanan'],
  ];

  formulas.forEach((row, index) => {
    const rowNum = index + 3;
    formulaSheet.getCell(`A${rowNum}`).value = row[0];
    formulaSheet.getCell(`A${rowNum}`).font = { bold: true };
    formulaSheet.getCell(`B${rowNum}`).value = row[1];
    formulaSheet.getCell(`B${rowNum}`).font = { italic: true };
    formulaSheet.getCell(`C${rowNum}`).value = row[2];
    formulaSheet.getCell(`C${rowNum}`).font = { color: { argb: 'FF666666' } };
  });

  formulaSheet.getColumn('A').width = 30;
  formulaSheet.getColumn('B').width = 35;
  formulaSheet.getColumn('C').width = 40;

  // ============ Sheet 6: Status Kontrak ============
  const statusSheet = workbook.addWorksheet('Status Kontrak');
  
  statusSheet.mergeCells('A1:C1');
  const statusTitleCell = statusSheet.getCell('A1');
  statusTitleCell.value = `ANALISIS STATUS KONTRAK ${year}`;
  statusTitleCell.font = { bold: true, size: 14 };
  statusTitleCell.alignment = { horizontal: 'center' };

  // Status breakdown
  const statusData = [
    ['Status', 'Jumlah Kontrak', 'Persentase'],
    ['Completed', data.completed_count, (data.completed_count / data.contracts_count) * 100],
    ['Lancar', data.lancar_count, (data.lancar_count / data.contracts_count) * 100],
    ['Kurang Lancar', data.kurang_lancar_count, (data.kurang_lancar_count / data.contracts_count) * 100],
    ['Macet', data.macet_count, (data.macet_count / data.contracts_count) * 100],
    ['TOTAL', data.contracts_count, 100],
  ];

  statusSheet.addRow([]);
  statusSheet.addRow([]);

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
      });
    }
    
    // Format percentage column
    if (index > 0) {
      row.getCell(3).numFmt = '0.0%';
    }
  });

  // Set column widths
  statusSheet.getColumn('A').width = 15;
  statusSheet.getColumn('B').width = 15;
  statusSheet.getColumn('C').width = 15;

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Keuangan_Lengkap_${year}_Management_System_Kredit.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};
