import ExcelJS from 'exceljs';
import type { CouponHandover } from '@/hooks/useCouponHandovers';

interface EnrichedHandover extends CouponHandover {
  paidInRange: number;
  unpaidInRange: number;
  status: 'fully_paid' | 'partially_paid' | 'unpaid';
}

const STATUS_LABELS: Record<string, string> = {
  fully_paid: 'Lunas',
  partially_paid: 'Sebagian',
  unpaid: 'Belum Bayar',
};

const HEADERS = [
  'No', 'Tanggal', 'Kolektor', 'Kode Sales', 'Kode Kolektor', 'Konsumen', 'Kode Kontrak',
  'Pembayaran ke', 'Jumlah Kupon', 'Tertagih', 'Belum Tagih', 'Status',
  'Nominal/Kupon', 'Total Nominal', 'Tertagih (Rp)', 'Sisa (Rp)',
];

const COL_WIDTHS = [5, 14, 20, 14, 14, 22, 15, 16, 10, 10, 12, 14, 16, 18, 18, 18];

// Per-collector sheet (single collector) — different column layout as requested
const COLLECTOR_HEADERS = [
  'No', 'Tanggal', 'Konsumen', 'Kode Kontrak', 'Pembayaran Ke', 'Jumlah Kupon', 'Tertagih', 'Angsuran', 'Tertagih (Rp)'
];

const COLLECTOR_COL_WIDTHS = [5, 14, 30, 16, 14, 12, 12, 14, 18];

function buildSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  handovers: EnrichedHandover[],
  title: string,
  isCollectorSheet = false,
) {
  const sheet = workbook.addWorksheet(sheetName);

  // Title
  if (isCollectorSheet) {
    sheet.mergeCells('A1:I1');
  } else {
    sheet.mergeCells('A1:P1');
  }
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  if (isCollectorSheet) {
    sheet.mergeCells('A2:I2');
  } else {
    sheet.mergeCells('A2:P2');
  }
  const dateCell = sheet.getCell('A2');
  dateCell.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  dateCell.font = { italic: true, size: 12 };
  dateCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Headers
  const headersToUse = isCollectorSheet ? COLLECTOR_HEADERS : HEADERS;
  const hRow = sheet.addRow(headersToUse);
  hRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  const startRow = hRow.number + 1;

  handovers.forEach((h, i) => {
    const rowNum = startRow + i;
    const amt = h.credit_contracts?.daily_installment_amount || 0;

    let dataRowValues: any[] = [];
    if (isCollectorSheet) {
      // Per-collector layout: No, Tanggal, Konsumen, Kode Kontrak, Pembayaran Ke, Jumlah Kupon, Tertagih, Angsuran, Tertagih (Rp)
      dataRowValues = [
        i + 1,
        h.handover_date,
        h.credit_contracts?.customers?.name || '-',
        h.credit_contracts?.contract_ref || '-',
        `${h.start_index}-${h.end_index}`,
        h.coupon_count,
        h.paidInRange,
        amt,
        { formula: `G${rowNum}*H${rowNum}` }, // Tertagih(Rp) = Tertagih * Angsuran
      ];
    } else {
      dataRowValues = [
        i + 1,
        h.handover_date,
        h.collectors?.name || '-',
        h.credit_contracts?.sales_agents?.agent_code || '-',
        h.collectors?.collector_code || '-',
        h.credit_contracts?.customers?.name || '-',
        h.credit_contracts?.contract_ref || '-',
        `${h.start_index}-${h.end_index}`,
        h.coupon_count,
        h.paidInRange,
        h.unpaidInRange,
        STATUS_LABELS[h.status] || h.status,
        amt,
        { formula: `I${rowNum}*M${rowNum}` },
        { formula: `J${rowNum}*M${rowNum}` },
        { formula: `K${rowNum}*M${rowNum}` },
      ];
    }

    const dataRow = sheet.addRow(dataRowValues);

    dataRow.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

      if (isCollectorSheet) {
        // Collector sheet formatting: columns 6 and 7 numeric, 8 and 9 currency
        if ([6, 7].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if ([8, 9].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      } else {
        if ([13, 14, 15, 16].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if ([9, 10, 11].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        }

        if (colNumber === 12) {
          cell.alignment = { horizontal: 'center' };
          if (h.status === 'fully_paid') {
            cell.font = { bold: true, color: { argb: 'FF228B22' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
          } else if (h.status === 'partially_paid') {
            cell.font = { bold: true, color: { argb: 'FFB8860B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E1' } };
          } else {
            cell.font = { bold: true, color: { argb: 'FFDC143C' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
          }
        }
      }
    });
  });

  // Total row
  if (handovers.length > 0) {
    const endRow = startRow + handovers.length - 1;
    let totalRowValues: any[] = [];
    if (isCollectorSheet) {
      // Totals for collector sheet: total jumlah kupon (F), total tertagih (G), total tertagih Rp (I)
      totalRowValues = [
        '', '', 'TOTAL', '', '',
        { formula: `SUM(F${startRow}:F${endRow})` },
        { formula: `SUM(G${startRow}:G${endRow})` },
        '',
        { formula: `SUM(I${startRow}:I${endRow})` },
      ];
    } else {
      totalRowValues = [
        '', '', '', '', '', '', 'TOTAL', '',
        { formula: `SUM(I${startRow}:I${endRow})` },
        { formula: `SUM(J${startRow}:J${endRow})` },
        { formula: `SUM(K${startRow}:K${endRow})` },
        '', '',
        { formula: `SUM(N${startRow}:N${endRow})` },
        { formula: `SUM(O${startRow}:O${endRow})` },
        { formula: `SUM(P${startRow}:P${endRow})` },
      ];
    }

    const totalRow = sheet.addRow(totalRowValues);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
      if (isCollectorSheet) {
        if ([6, 7].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if ([8, 9].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      } else {
        if ([13, 14, 15, 16].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if ([9, 10, 11].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        }
      }
    });
  }

  // Column widths
  sheet.columns = (isCollectorSheet ? COLLECTOR_COL_WIDTHS : COL_WIDTHS).map((width) => ({ width }));
}

export const exportHandoversToExcel = async (handovers: EnrichedHandover[]) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  // Sheet 1: Semua Kolektor
  buildSheet(workbook, 'Semua Kolektor', handovers, 'LAPORAN SERAH TERIMA KUPON - SEMUA KOLEKTOR');

  // Group by collector
  const byCollector = new Map<string, { name: string; code: string; items: EnrichedHandover[] }>();
  handovers.forEach((h) => {
    const key = h.collector_id;
    if (!byCollector.has(key)) {
      byCollector.set(key, {
        name: h.collectors?.name || 'Unknown',
        code: h.collectors?.collector_code || '-',
        items: [],
      });
    }
    byCollector.get(key)!.items.push(h);
  });

  // Sheet per collector (use collector-specific layout)
  // Ensure unique sheet names — Excel worksheets must be unique within the workbook.
  const usedNames = new Set<string>();
  let collectorSheetCount = 0;
  byCollector.forEach(({ name, code, items }) => {
    const baseName = (name || 'Unknown').substring(0, 28).replace(/[\\/*?[\]:]/g, '');
    let safeName = baseName;
    let suffix = 1;
    // If safeName already used, append a small numeric suffix to make it unique
    while (usedNames.has(safeName) || workbook.getWorksheet(safeName)) {
      safeName = `${baseName}-${suffix}`;
      suffix += 1;
    }
    usedNames.add(safeName);
    buildSheet(workbook, safeName, items, `LAPORAN SERAH TERIMA KUPON - ${name.toUpperCase()}`, true);
    collectorSheetCount += 1;
  });

  // Debug: log how many sheets will be in the workbook (1 master + per-collector)
  try {
     
    console.info(`Export: creating ${1 + collectorSheetCount} worksheet(s) for handovers (1 master + ${collectorSheetCount} collectors)`);
  } catch (e) {
    // swallow logging errors in environments where console may be unavailable
  }

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Serah_Terima_Kupon_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
