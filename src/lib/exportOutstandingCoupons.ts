import ExcelJS from 'exceljs';
import type { OutstandingCouponSummary } from '@/hooks/useOutstandingCoupons';

export const exportOutstandingCouponsToExcel = async (data: OutstandingCouponSummary[]) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Kupon Belum Bayar');

  // Title
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'LAPORAN KUPON BELUM TERBAYAR';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:H2');
  const dateCell = sheet.getCell('A2');
  dateCell.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  dateCell.font = { italic: true, size: 10 };
  dateCell.alignment = { horizontal: 'center' };

  // Headers
  const headerRow = sheet.addRow([]);
  sheet.addRow([]);
  const headers = ['No', 'Nama Konsumen', 'Kode Kontrak', 'Kupon Keluar', 'Nominal Angsuran', 'Terbayar', 'Belum Bayar', 'Total Belum Bayar'];
  const hRow = sheet.addRow(headers);
  hRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  // Data rows
  const startRow = hRow.number + 1;
  data.forEach((row, i) => {
    const r = sheet.addRow([
      i + 1,
      row.customer_name,
      row.contract_ref,
      row.total_coupons_issued,
      row.daily_installment_amount,
      row.coupons_paid,
      row.coupons_unpaid,
      row.total_unpaid_amount,
    ]);
    r.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      if (colNumber === 5 || colNumber === 8) {
        cell.numFmt = '#,##0';
      }
      if (colNumber >= 4 && colNumber <= 8) {
        cell.alignment = { horizontal: 'center' };
      }
      if (colNumber === 5 || colNumber === 8) {
        cell.alignment = { horizontal: 'right' };
      }
    });
  });

  // Total row with formulas
  const endRow = startRow + data.length - 1;
  const totalRow = sheet.addRow([]);
  totalRow.getCell(1).value = '';
  totalRow.getCell(2).value = '';
  totalRow.getCell(3).value = 'TOTAL';
  totalRow.getCell(3).font = { bold: true };
  totalRow.getCell(3).alignment = { horizontal: 'right' };
  totalRow.getCell(4).value = { formula: `SUM(D${startRow}:D${endRow})` };
  totalRow.getCell(5).value = '';
  totalRow.getCell(6).value = { formula: `SUM(F${startRow}:F${endRow})` };
  totalRow.getCell(7).value = { formula: `SUM(G${startRow}:G${endRow})` };
  totalRow.getCell(8).value = { formula: `SUM(H${startRow}:H${endRow})` };
  totalRow.getCell(8).numFmt = '#,##0';

  for (let c = 1; c <= 8; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { ...cell.font, bold: true };
    cell.border = {
      top: { style: 'double' }, bottom: { style: 'double' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  }

  // Column widths
  sheet.columns = [
    { width: 5 }, { width: 25 }, { width: 15 }, { width: 14 },
    { width: 18 }, { width: 12 }, { width: 14 }, { width: 20 },
  ];

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kupon_Belum_Bayar_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
