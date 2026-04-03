import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { YearlyFinancialSummary, MonthlyDetailData } from '@/hooks/useYearlyFinancialSummary';
import { supabase } from '@/integrations/supabase/client';
import { calculateTieredCommission, CommissionTier } from '@/hooks/useCommissionTiers';

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
    ['Total Komisi', data.total_commission, '"Rp "#,##0', 'Komisi sales'],
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
  const agentSheet = workbook.addWorksheet('Performa Sales');
  
  // Header
  const agentHeaders = ['No', 'Kode', 'Nama', 'Komisi %', 'Modal', 'Omset', 'Keuntungan', 'Komisi (Rp)', 'Jumlah Kontrak'];
  const agentHeaderRow = agentSheet.addRow(agentHeaders);
  agentHeaderRow.font = { bold: true };
  agentHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Fetch commission tiers so Excel uses the same tier rules as Sales page
  const { data: commissionTiersData } = await supabase
    .from('commission_tiers')
    .select('*')
    .order('min_amount', { ascending: true });
  const tiers: CommissionTier[] = (commissionTiersData || []) as CommissionTier[];

  // Data rows with formulas
  const agentStartRow = 2;
  data.agents.forEach((agent, index) => {
    const rowNum = agentStartRow + index;

    // Compute commission percentage according to tier rules based on agent total omset
    const dynamicPct = agent.total_omset > 0 ? calculateTieredCommission(agent.total_omset, tiers) / 100 : 0;

    const row = agentSheet.addRow([
      index + 1,
      agent.agent_code,
      agent.agent_name,
      dynamicPct,
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


  // ============ Sheet 5-16: Detail Bulanan (Jan - Des) ============
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  data.monthly_details.forEach((monthDetail: MonthlyDetailData, monthIndex: number) => {
    const sheetName = monthNames[monthIndex] || monthDetail.monthLabel;
    const sheet = workbook.addWorksheet(sheetName);

  // Title
  sheet.mergeCells('A1:H1');
    const mTitleCell = sheet.getCell('A1');
    mTitleCell.value = `DETAIL TRANSAKSI - ${sheetName.toUpperCase()} ${year}`;
    mTitleCell.font = { bold: true, size: 14 };
    mTitleCell.alignment = { horizontal: 'center' };

    // Contract details table
    sheet.addRow([]);
  const detailHeaders = ['No', 'Kode Sales', 'Nama Konsumen', 'Orderan Barang', 'Modal', 'Omset', 'Komisi', 'Laba Bersih'];
    const detailHeaderRow = sheet.addRow(detailHeaders);
    detailHeaderRow.font = { bold: true };
    detailHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });

  const detailStartRow = 4;
  // detailEndRow needs to be available later for summary formulas; default to one row before start
  let detailEndRow = detailStartRow - 1;
  if (monthDetail.contracts.length > 0) {
      monthDetail.contracts.forEach((contract, idx) => {
        const row = sheet.addRow([
          idx + 1,
          contract.agent_code,
          contract.customer_name,
          contract.product_type,
          contract.modal,
          contract.omset,
          contract.commission,
          contract.net_profit,
        ]);
        [5, 6, 7, 8].forEach(col => {
          row.getCell(col).numFmt = '"Rp "#,##0';
        });
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
          };
        });
      });

      // Totals row with SUM formulas
  detailEndRow = detailStartRow + monthDetail.contracts.length - 1;
      const totalRow = sheet.addRow([
        '', '', '', 'TOTAL',
        { formula: `SUM(E${detailStartRow}:E${detailEndRow})` },
        { formula: `SUM(F${detailStartRow}:F${detailEndRow})` },
        { formula: `SUM(G${detailStartRow}:G${detailEndRow})` },
        { formula: `SUM(H${detailStartRow}:H${detailEndRow})` },
      ]);
      totalRow.font = { bold: true };
      totalRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
        if (colNumber >= 5 && colNumber <= 8) {
          cell.numFmt = '"Rp "#,##0';
        }
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      });
    } else {
      const emptyRow = sheet.addRow(['', '', 'Tidak ada transaksi bulan ini']);
      emptyRow.getCell(3).font = { italic: true, color: { argb: 'FF999999' } };
    }

    // Operational expenses section
    const opsStartRowNum = detailStartRow + monthDetail.contracts.length + 3;
    sheet.getCell(`A${opsStartRowNum}`).value = 'DETAIL OPERASIONAL';
    sheet.getCell(`A${opsStartRowNum}`).font = { bold: true, size: 12 };

    const opsHeaderRow = sheet.addRow(['No', 'Deskripsi', 'Kategori', 'Jumlah']);
    opsHeaderRow.font = { bold: true };
    opsHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFED7D31' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    // We'll build a formula string for operational total so it works even when there are no ops
    let opsSumFormula = '0';
    let opsDataEnd = opsStartRowNum; // fallback

    if (monthDetail.operational_expenses.length > 0) {
      const opsDataStart = opsStartRowNum + 2;
      monthDetail.operational_expenses.forEach((exp, idx) => {
        const row = sheet.addRow([idx + 1, exp.description, exp.category || '-', exp.amount]);
        row.getCell(4).numFmt = '"Rp "#,##0';
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
          };
        });
      });

      opsDataEnd = opsDataStart + monthDetail.operational_expenses.length - 1;
      const opsTotalRow = sheet.addRow(['', '', 'TOTAL', { formula: `SUM(D${opsDataStart}:D${opsDataEnd})` }]);
      opsTotalRow.font = { bold: true };
      opsTotalRow.getCell(4).numFmt = '"Rp "#,##0';
      opsTotalRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      });

      opsSumFormula = `SUM(D${opsDataStart}:D${opsDataEnd})`;
    } else {
      const emptyOpsRow = sheet.addRow(['', 'Tidak ada biaya operasional bulan ini']);
      emptyOpsRow.getCell(2).font = { italic: true, color: { argb: 'FF999999' } };
      opsSumFormula = '0';
    }

    // ===== Keuntungan Akhir summary panel (placed to the right of ops) =====
    // Contract data ranges
    const contractProfitRange = `H${detailStartRow}:H${detailEndRow}`;
    const contractCommissionRange = `G${detailStartRow}:G${detailEndRow}`;
    const contractModalRange = `E${detailStartRow}:E${detailEndRow}`;
    const contractOmsetRange = `F${detailStartRow}:F${detailEndRow}`;

    // Summary formulas
    const profitSumFormula = `SUM(${contractProfitRange})`;
    const commissionSumFormula = `SUM(${contractCommissionRange})`;
    const modalSumFormula = `SUM(${contractModalRange})`;
    const omsetSumFormula = `SUM(${contractOmsetRange})`;
    const netProfitFormula = `${profitSumFormula}-${commissionSumFormula}-${opsSumFormula}`;
    const netProfitPctFormula = `IF(${omsetSumFormula}=0,0,(${netProfitFormula})/(${omsetSumFormula}))`;

  // Place summary dynamically aligned with the operational block (Option A)
  // Title will be merged on E{opsStartRowNum}:F{opsStartRowNum}, labels in column E,
  // values in column F and percent in column G.
  // Make column E a spacer/boundary so the summary panel doesn't butt against the details.
  // Shift the summary one column to the right: labels in F, values in G, percent in H.
  const summaryColLabel = 'F';
  const summaryColValue = 'G';
  const summaryColPct = 'H';
  // Align the summary title row with the 'DETAIL OPERASIONAL' title row so they appear
  // on the same vertical level even when the operational block length changes.
  const summaryTitleRow = opsStartRowNum;
  const summaryRowBase = summaryTitleRow + 1;

  // Merge F and G for the title (we keep column E as a spacer/boundary)
  sheet.mergeCells(`F${summaryTitleRow}:G${summaryTitleRow}`);
  sheet.getCell(`${summaryColLabel}${summaryTitleRow}`).value = 'KEUNTUNGAN AKHIR';
  const summaryTitleCell = sheet.getCell(`${summaryColLabel}${summaryTitleRow}`);
  summaryTitleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  summaryTitleCell.alignment = { horizontal: 'center' };
  summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Rows: Total Modal, Total Omset, Profit, Komisi, Operasional, Keuntungan Akhir
  // Label + value rows
  const labels = ['Total Modal', 'Total Omset', 'Profit (Omset - Modal)', 'Komisi', 'Operasional', 'Keuntungan Akhir'];
  // Write labels and values
  sheet.getCell(`${summaryColLabel}${summaryRowBase}`).value = labels[0];
  sheet.getCell(`${summaryColValue}${summaryRowBase}`).value = { formula: modalSumFormula };
  sheet.getCell(`${summaryColValue}${summaryRowBase}`).numFmt = '"Rp "#,##0';

  sheet.getCell(`${summaryColLabel}${summaryRowBase + 1}`).value = labels[1];
  sheet.getCell(`${summaryColValue}${summaryRowBase + 1}`).value = { formula: omsetSumFormula };
  sheet.getCell(`${summaryColValue}${summaryRowBase + 1}`).numFmt = '"Rp "#,##0';

  sheet.getCell(`${summaryColLabel}${summaryRowBase + 2}`).value = labels[2];
  sheet.getCell(`${summaryColValue}${summaryRowBase + 2}`).value = { formula: profitSumFormula };
  sheet.getCell(`${summaryColValue}${summaryRowBase + 2}`).numFmt = '"Rp "#,##0';

  sheet.getCell(`${summaryColLabel}${summaryRowBase + 3}`).value = labels[3];
  sheet.getCell(`${summaryColValue}${summaryRowBase + 3}`).value = { formula: commissionSumFormula };
  sheet.getCell(`${summaryColValue}${summaryRowBase + 3}`).numFmt = '"Rp "#,##0';

  sheet.getCell(`${summaryColLabel}${summaryRowBase + 4}`).value = labels[4];
  sheet.getCell(`${summaryColValue}${summaryRowBase + 4}`).value = { formula: opsSumFormula };
  sheet.getCell(`${summaryColValue}${summaryRowBase + 4}`).numFmt = '"Rp "#,##0';

  sheet.getCell(`${summaryColLabel}${summaryRowBase + 5}`).value = labels[5];
  const netCell = sheet.getCell(`${summaryColValue}${summaryRowBase + 5}`);
  netCell.value = { formula: netProfitFormula };
  netCell.numFmt = '"Rp "#,##0';
  netCell.font = { bold: true, color: { argb: 'FF0B6623' } }; // dark green
  netCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }; // light green background

    // Percent column (to the right)
  const pctCell = sheet.getCell(`${summaryColPct}${summaryRowBase + 5}`);
  pctCell.value = { formula: netProfitPctFormula };
  pctCell.numFmt = '0.00%';
  pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  pctCell.font = { bold: true };

    // Apply borders and light fill to summary cells
    // Apply borders and light fills to summary cells, with special label styling
    for (let r = summaryRowBase; r <= summaryRowBase + 5; r++) {
      const labelCell = sheet.getCell(`${summaryColLabel}${r}`);
      const valueCell = sheet.getCell(`${summaryColValue}${r}`);
      const percentCell = sheet.getCell(`${summaryColPct}${r}`);

      // Label styling
      labelCell.font = { bold: true };
      labelCell.alignment = { horizontal: 'left' };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

      // Value cells already formatted as currency; give subtle background
      // Avoid overwriting the special net profit cell (which has its own fill)
      if (`${summaryColValue}${r}` !== `${summaryColValue}${summaryRowBase + 5}`) {
        valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }

      // Percent cell default fill (only used on the final row)
      if (r !== summaryRowBase + 5) {
        percentCell.value = null;
      }

      [labelCell, valueCell, percentCell].forEach(cell => {
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      });
    }

      // Set column widths. Make column E (5) a small spacer/boundary so content doesn't appear cramped.
      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 12;
      sheet.getColumn(3).width = 25;
      sheet.getColumn(4).width = 20;
      // Column 5 (E) is the spacer/boundary
      sheet.getColumn(5).width = 3;
      // Columns F(6), G(7), H(8) are for summary and regular columns
      [6, 7, 8].forEach(col => {
        sheet.getColumn(col).width = 18;
      });
  });

  // ============ Sheet 17: Rumus Kalkulasi ============
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
