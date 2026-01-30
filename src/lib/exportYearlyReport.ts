import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { YearlyFinancialSummary } from '@/hooks/useYearlyFinancialSummary';

export const exportYearlyReportToExcel = async (
  data: YearlyFinancialSummary,
  year: number
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Koleksi Lancar';
  workbook.created = new Date();

  // ============ Sheet 1: Ringkasan Tahunan ============
  const summarySheet = workbook.addWorksheet('Ringkasan Tahunan');
  
  // Title
  summarySheet.mergeCells('A1:E1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `LAPORAN KEUANGAN TAHUNAN ${year}`;
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  summarySheet.mergeCells('A2:E2');
  const subtitleCell = summarySheet.getCell('A2');
  subtitleCell.value = 'KOLEKSI LANCAR';
  subtitleCell.font = { bold: true, size: 12 };
  subtitleCell.alignment = { horizontal: 'center' };

  // Summary metrics with formulas referencing monthly breakdown
  const summaryStartRow = 4;
  summarySheet.getCell(`A${summaryStartRow}`).value = 'Ringkasan Finansial';
  summarySheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 12 };

  const summaryLabels = [
    ['Total Modal', 'B', data.total_modal],
    ['Total Omset', 'B', data.total_omset],
    ['Keuntungan Kotor', 'B', data.total_profit],
    ['Total Komisi (5%)', 'B', data.total_commission],
    ['Biaya Operasional', 'B', data.total_expenses],
    ['Keuntungan Bersih', 'B', data.net_profit],
    ['Jumlah Kontrak', 'B', data.contracts_count],
    ['Margin Keuntungan', 'B', data.profit_margin / 100],
    ['Total Tertagih', 'B', data.total_collected],
    ['Sisa Tagihan', 'B', data.total_to_collect],
    ['Tingkat Penagihan', 'B', data.collection_rate / 100],
  ];

  summaryLabels.forEach((item, index) => {
    const row = summaryStartRow + 1 + index;
    summarySheet.getCell(`A${row}`).value = item[0] as string;
    summarySheet.getCell(`A${row}`).font = { bold: true };
    
    const cell = summarySheet.getCell(`B${row}`);
    cell.value = item[2] as number;
    
    // Format based on type
    if (String(item[0]).includes('Margin') || String(item[0]).includes('Tingkat')) {
      cell.numFmt = '0.0%';
    } else if (String(item[0]).includes('Jumlah')) {
      cell.numFmt = '#,##0';
    } else {
      cell.numFmt = '"Rp "#,##0';
    }

    // Color for net profit
    if (String(item[0]).includes('Keuntungan Bersih')) {
      cell.font = { bold: true, color: { argb: (item[2] as number) >= 0 ? 'FF008000' : 'FFFF0000' } };
    }
  });

  // Set column widths
  summarySheet.getColumn('A').width = 25;
  summarySheet.getColumn('B').width = 20;

  // ============ Sheet 2: Breakdown Bulanan ============
  const monthlySheet = workbook.addWorksheet('Breakdown Bulanan');
  
  // Header
  const monthlyHeaders = ['Bulan', 'Modal', 'Omset', 'Keuntungan', 'Komisi', 'Tertagih', 'Jumlah Kontrak'];
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
      month.profit,
      month.commission,
      month.collected,
      month.contracts_count,
    ]);

    // Format currency columns
    [2, 3, 4, 5, 6].forEach(colIndex => {
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
  ]);
  totalsRow.font = { bold: true };
  totalsRow.eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    if (colNumber >= 2 && colNumber <= 6) {
      cell.numFmt = '"Rp "#,##0';
    }
  });

  // Set column widths
  monthlySheet.getColumn(1).width = 15;
  [2, 3, 4, 5, 6].forEach(col => {
    monthlySheet.getColumn(col).width = 18;
  });
  monthlySheet.getColumn(7).width = 15;

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

  // ============ Sheet 4: Rumus Kalkulasi ============
  const formulaSheet = workbook.addWorksheet('Rumus Kalkulasi');
  
  formulaSheet.mergeCells('A1:C1');
  formulaSheet.getCell('A1').value = 'RUMUS KALKULASI BISNIS';
  formulaSheet.getCell('A1').font = { bold: true, size: 14 };

  const formulas = [
    ['Total Pinjaman (Omset)', '= Modal × 1.2', 'Margin keuntungan 20%'],
    ['Keuntungan Kotor', '= Omset - Modal', 'Selisih nilai pinjaman dan modal'],
    ['Cicilan Harian', '= Omset ÷ Tenor', 'Pembagian merata per hari kerja'],
    ['Komisi Agen', '= Omset × 5%', 'Komisi standar per kontrak'],
    ['Keuntungan Bersih', '= Profit Kotor - Komisi - Operasional', 'Laba setelah semua biaya'],
    ['Margin Keuntungan', '= (Profit Kotor ÷ Omset) × 100%', 'Persentase margin dari omset'],
    ['Tingkat Penagihan', '= Tertagih ÷ (Tertagih + Sisa) × 100%', 'Efektivitas penagihan'],
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

  formulaSheet.getColumn('A').width = 25;
  formulaSheet.getColumn('B').width = 40;
  formulaSheet.getColumn('C').width = 35;

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Tahunan_${year}_Koleksi_Lancar.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};
