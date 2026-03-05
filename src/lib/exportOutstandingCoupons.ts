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
  'Pembayaran ke', 'Jml Kupon', 'Tertagih', 'Belum Tagih', 'Status',
  'Nominal/Kupon', 'Total Nominal', 'Tertagih (Rp)', 'Sisa (Rp)',
];

const COL_WIDTHS = [5, 14, 20, 14, 14, 22, 15, 16, 10, 10, 12, 14, 16, 18, 18, 18];

function buildSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  handovers: EnrichedHandover[],
  title: string,
) {
  const sheet = workbook.addWorksheet(sheetName);

  // Title
  sheet.mergeCells('A1:O1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  sheet.mergeCells('A2:O2');
  const dateCell = sheet.getCell('A2');
  dateCell.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  dateCell.font = { italic: true, size: 12 };
  dateCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Headers
  const hRow = sheet.addRow(HEADERS);
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

    const dataRow = sheet.addRow([
      i + 1,
      h.handover_date,
      h.collectors?.name || '-',
      h.collectors?.collector_code || '-',
      h.credit_contracts?.customers?.name || '-',
      h.credit_contracts?.contract_ref || '-',
      `${h.start_index}-${h.end_index}`,
      h.coupon_count,
      h.paidInRange,
      h.unpaidInRange,
      STATUS_LABELS[h.status] || h.status,
      amt,
      { formula: `H${rowNum}*L${rowNum}` },
      { formula: `I${rowNum}*L${rowNum}` },
      { formula: `J${rowNum}*L${rowNum}` },
    ]);

    dataRow.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

      if ([12, 13, 14, 15].includes(colNumber)) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if ([8, 9, 10].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      }

      if (colNumber === 11) {
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
    });
  });

  // Total row
  if (handovers.length > 0) {
    const endRow = startRow + handovers.length - 1;
    const totalRow = sheet.addRow([
      '', '', '', '', '', 'TOTAL', '',
      { formula: `SUM(H${startRow}:H${endRow})` },
      { formula: `SUM(I${startRow}:I${endRow})` },
      { formula: `SUM(J${startRow}:J${endRow})` },
      '', '',
      { formula: `SUM(M${startRow}:M${endRow})` },
      { formula: `SUM(N${startRow}:N${endRow})` },
      { formula: `SUM(O${startRow}:O${endRow})` },
    ]);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
      if ([12, 13, 14, 15].includes(colNumber)) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if ([8, 9, 10].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      }
    });
  }

  // Column widths
  sheet.columns = COL_WIDTHS.map((width) => ({ width }));
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

  // Sheet per collector
  byCollector.forEach(({ name, items }) => {
    const safeName = name.substring(0, 31).replace(/[\\/*?[\]:]/g, '');
    buildSheet(workbook, safeName, items, `LAPORAN SERAH TERIMA KUPON - ${name.toUpperCase()}`);
  });

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
