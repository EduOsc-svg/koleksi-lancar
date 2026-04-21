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
    ['Total Modal (Realized)', data.total_modal, '"Rp "#,##0', 'Modal proporsional dari pembayaran tertagih'],
    ['Total Omset (Realized)', data.total_omset, '"Rp "#,##0', 'Omset = total pembayaran tertagih'],
    ['Keuntungan Kotor', data.total_profit, '"Rp "#,##0', 'Omset Realized - Modal Realized'],
    ['Total Komisi', data.total_commission, '"Rp "#,##0', 'Tier diterapkan ke total omset agen'],
    ['Biaya Operasional', data.total_expenses, '"Rp "#,##0', 'Total biaya operasional'],
    ['Keuntungan Bersih', data.net_profit, '"Rp "#,##0', 'Profit - Komisi - Operasional'],
    ['Jumlah Kontrak', data.contracts_count, '#,##0', 'Total kontrak di tahun ini'],
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
    
    // Highlight net profit (now mapped to gross profit per request)
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
  const monthlyHeaders = ['Bulan', 'Modal', 'Omset', 'Operasional', 'Keuntungan', 'Keuntungan Bersih', '% Keuntungan', 'Tertagih', 'Jumlah Kontrak'];
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
    // add base values first; we'll set formulas for derived columns after knowing the row number
    const added = monthlySheet.addRow([
      month.monthLabel,
      month.total_modal,
      month.total_omset,
      month.operational,
      month.profit,
      // Keuntungan Bersih will now be Keuntungan Kotor (same as profit)
      null,
      null,
      month.collected,
      month.contracts_count,
    ]);

    const rowNum = monthlyStartRow + index;
    // Keuntungan Bersih = Keuntungan Kotor (same as Keuntungan column E)
    added.getCell(6).value = { formula: `E${rowNum}` };
    // % Keuntungan = IF(Omset=0,0,KeuntunganBersih / Omset) -> Omset is column C (3)
    added.getCell(7).value = { formula: `IF(C${rowNum}=0,0,F${rowNum}/C${rowNum})` };

    // Format currency columns (B,C,D,E,F = 2-6) and also column 8 (Tertagih)
    [2, 3, 4, 5, 6, 8].forEach(colIndex => {
      added.getCell(colIndex).numFmt = '"Rp "#,##0';
    });
    // format percent column (7)
    added.getCell(7).numFmt = '0.00%';
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
    // For percent column, compute overall percent: IF(total Omset=0,0, SUM(KeuntunganBersih)/SUM(Omset) )
    { formula: `IF(SUM(C${monthlyStartRow}:C${dataEndRow})=0,0,SUM(F${monthlyStartRow}:F${dataEndRow})/SUM(C${monthlyStartRow}:C${dataEndRow}))` },
    { formula: `SUM(H${monthlyStartRow}:H${dataEndRow})` },
    { formula: `SUM(I${monthlyStartRow}:I${dataEndRow})` },
  ]);
  totalsRow.font = { bold: true };
  totalsRow.eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    if (colNumber >= 2 && colNumber <= 6 || colNumber === 8) {
      cell.numFmt = '"Rp "#,##0';
    }
    if (colNumber === 7) {
      cell.numFmt = '0.00%';
    }
  });

  // Set column widths
  monthlySheet.getColumn(1).width = 15;
  // Set reasonable widths; include new columns 7 (Keuntungan Bersih) and 8 (% Keuntungan)
  [2, 3, 4, 5, 6, 8].forEach(col => {
    monthlySheet.getColumn(col).width = 18;
  });
  monthlySheet.getColumn(7).width = 12; // percent column
  monthlySheet.getColumn(9).width = 15;

  // ============ Sheet 3: Performa Sales Agent (per bulan, kontrak per tanggal ascending) ============
  const agentSheet = workbook.addWorksheet('Performa Sales');

  // For each month, render a labeled section with contracts sorted by start_date ascending
  data.monthly_details.forEach((monthDetail: MonthlyDetailData) => {
    const monthLabel = monthDetail.monthLabel || monthDetail.monthKey;
    // Section title
    agentSheet.addRow([]);
    agentSheet.mergeCells(`A${agentSheet.lastRow?.number || 1}:H${agentSheet.lastRow?.number || 1}`);
    const sectionTitleRow = agentSheet.addRow([`${monthLabel.toUpperCase()}`]);
    sectionTitleRow.getCell(1).font = { bold: true, size: 12 };

  // Table header for this month (requested columns)
  const headers = ['No', 'Tanggal', 'Kode Kontrak', 'Nama Konsumen', 'Produk', 'Omset', 'Persentase (Total)'];
    const headerRow = agentSheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // Sort contracts by start_date ascending
    const contracts = (monthDetail.contracts || []).slice().sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return da - db;
    });

    const startRow = (agentSheet.lastRow?.number || 1) + 1;
    if (contracts.length === 0) {
      const empty = agentSheet.addRow(['', '', '', 'Tidak ada kontrak di bulan ini']);
      empty.getCell(4).font = { italic: true, color: { argb: 'FF999999' } };
    } else {
      const monthTotal = monthDetail.total_omset || contracts.reduce((s, c) => s + Number(c.omset || 0), 0);
      contracts.forEach((contract, idx) => {
        const dateLabel = contract.start_date ? format(new Date(contract.start_date), 'yyyy-MM-dd') : '';
        const omsetVal = Number(contract.omset || 0);
        const pct = monthTotal > 0 ? omsetVal / monthTotal : 0;
        const row = agentSheet.addRow([
          idx + 1,
          dateLabel,
          contract.contract_ref || '',
          contract.customer_name,
          contract.product_type,
          omsetVal,
          pct,
        ]);
        // format Omset and Persentase
        row.getCell(6).numFmt = '"Rp "#,##0';
        row.getCell(7).numFmt = '0.00%';
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      // Totals for the month
      const detailEndRow = (agentSheet.lastRow?.number || startRow) ;
      const totalRow = agentSheet.addRow(['', '', 'TOTAL', '', '', { formula: `SUM(F${startRow}:F${detailEndRow})` }, { formula: `IF(SUM(F${startRow}:F${detailEndRow})=0,0,1)` }]);
      totalRow.font = { bold: true };
      totalRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };
        if (colNumber === 6) cell.numFmt = '"Rp "#,##0';
        if (colNumber === 7) cell.numFmt = '0.00%';
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
    }
  });

  // Set reasonable column widths for agent sheet
  agentSheet.getColumn(1).width = 5;
  agentSheet.getColumn(2).width = 12;
  agentSheet.getColumn(3).width = 12;
  agentSheet.getColumn(4).width = 25;
  agentSheet.getColumn(5).width = 20;
  [6, 7, 8].forEach(col => agentSheet.getColumn(col).width = 18);


  // ============ Sheet 5-16: Detail Bulanan (Jan - Des) ============
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  data.monthly_details.forEach((monthDetail: MonthlyDetailData, monthIndex: number) => {
    const sheetName = monthNames[monthIndex] || monthDetail.monthLabel;
    const sheet = workbook.addWorksheet(sheetName);

  // Title
  sheet.mergeCells('A1:G1');
    const mTitleCell = sheet.getCell('A1');
    mTitleCell.value = `DETAIL TRANSAKSI - ${sheetName.toUpperCase()} ${year}`;
    mTitleCell.font = { bold: true, size: 14 };
    mTitleCell.alignment = { horizontal: 'center' };

    // Contract details table
    sheet.addRow([]);
  const detailHeaders = ['No', 'Tanggal', 'Kode Kontrak', 'Nama Konsumen', 'Produk', 'Omset', 'Persentase (Total)'];
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
    if (monthDetail.contracts.length > 0) {
      // Sort contracts by start_date ascending so the earliest dates appear first
      const sortedContracts = (monthDetail.contracts || []).slice().sort((a, b) => {
        const da = a.start_date ? new Date(a.start_date).getTime() : 0;
        const db = b.start_date ? new Date(b.start_date).getTime() : 0;
        return da - db;
      });

      const monthTotal = monthDetail.total_omset || sortedContracts.reduce((s, c) => s + Number(c.omset || 0), 0);
      sortedContracts.forEach((contract, idx) => {
        const dateLabel = contract.start_date ? format(new Date(contract.start_date), 'yyyy-MM-dd') : '';
        const omsetVal = Number(contract.omset || 0);
        const pct = monthTotal > 0 ? omsetVal / monthTotal : 0;
        const row = sheet.addRow([
          idx + 1,
          dateLabel,
          contract.contract_ref || '',
          contract.customer_name,
          contract.product_type,
          omsetVal,
          pct,
        ]);
        // format Omset and Persentase
        row.getCell(6).numFmt = '"Rp "#,##0';
        row.getCell(7).numFmt = '0.00%';
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
          };
        });
      });

      // Totals row with SUM formulas
      const detailEndRow = detailStartRow + monthDetail.contracts.length - 1;
      const totalRow = sheet.addRow([
        '', '', '', 'TOTAL',
        '',
        { formula: `SUM(F${detailStartRow}:F${detailEndRow})` },
        { formula: `IF(SUM(F${detailStartRow}:F${detailEndRow})=0,0,1)` },
      ]);
      totalRow.font = { bold: true };
      totalRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
        if (colNumber === 6) {
          cell.numFmt = '"Rp "#,##0';
        }
        if (colNumber === 7) {
          cell.numFmt = '0.00%';
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

      const opsDataEnd = opsDataStart + monthDetail.operational_expenses.length - 1;
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
    } else {
      const emptyOpsRow = sheet.addRow(['', 'Tidak ada biaya operasional bulan ini']);
      emptyOpsRow.getCell(2).font = { italic: true, color: { argb: 'FF999999' } };
    }

    // Set column widths
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 20;
    [5, 6, 7, 8].forEach(col => {
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
    // Komisi dihapus dari laporan keuangan per permintaan
    ['Keuntungan Bersih', '= Omset - Modal', 'Laba setelah penyesuaian (sekarang = Keuntungan Kotor)'],
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
