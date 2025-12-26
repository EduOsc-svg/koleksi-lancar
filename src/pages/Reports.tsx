import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAggregatedPayments } from "@/hooks/useAggregatedPayments";
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { formatRupiah, formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export default function Reports() {
  const { t } = useTranslation();
  const { data: agents } = useSalesAgents();
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [collectorId, setSalesId] = useState<string>("");

  const { data: payments, isLoading } = useAggregatedPayments(
    dateFrom,
    dateTo,
    collectorId || undefined
  );

  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(payments);
  const totalAmount = payments?.reduce((sum, p) => sum + p.total_amount, 0) ?? 0;

  const handleExportExcel = async () => {
    if (!payments?.length) return;

    try {
      // Dynamic import ExcelJS untuk mengurangi bundle size awal
      const ExcelJS = (await import('exceljs')).default;
      
      const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Credit Management System';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Laporan Pembayaran', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Title row
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'LAPORAN PEMBAYARAN';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Period row
    worksheet.mergeCells('A2:G2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Periode: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // Empty row
    worksheet.addRow([]);

    // Header row
    const headerRow = worksheet.addRow([
      'Tanggal',
      'Pelanggan',
      'Code Coupon',
      'Jumlah Coupon',
      'Nominal Pembayaran',
      'Total',
      'Sales'
    ]);

    // Style header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Data rows with formulas
    payments.forEach((p, index) => {
      const rowNumber = index + 5; // Starting from row 5 (after headers)
      
      // Generate code coupon (A001, A002, etc.)
      const codeCoupon = `A${String(index + 1).padStart(3, '0')}`;
      
      // Calculate nominal per coupon (total amount divided by coupon count)
      const nominalPerCoupon = Math.round(p.total_amount / p.coupon_count);
      
      const row = worksheet.addRow([
        p.payment_date,
        p.customer_name,
        codeCoupon,
        p.coupon_count,
        nominalPerCoupon,
        { formula: `D${rowNumber}*E${rowNumber}` }, // Jumlah Coupon × Nominal Pembayaran
        p.collector_name || '-'
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Format currency columns (Nominal Pembayaran & Total)
        if (colNumber === 5 || colNumber === 6) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
        
        // Center align for Jumlah Coupon and Code Coupon
        if (colNumber === 3 || colNumber === 4) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    // Total row with SUM formula
    const totalRow = worksheet.addRow([
      '', '', '', 
      { formula: `SUM(D5:D${4 + payments.length})` }, // Total Jumlah Coupon
      'TOTAL:',
      { formula: `SUM(F5:F${4 + payments.length})` }, // Total Amount
      ''
    ]);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'double' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      };
      
      if (colNumber === 4) {
        cell.alignment = { horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E7E6E6' }
        };
      }
      
      if (colNumber === 5) {
        cell.alignment = { horizontal: 'right' };
      }
      
      if (colNumber === 6) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF00' }
        };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 12 },  // Tanggal
      { width: 25 },  // Pelanggan
      { width: 15 },  // Code Coupon
      { width: 16 },  // Jumlah Coupon
      { width: 18 },  // Nominal Pembayaran
      { width: 18 },  // Total
      { width: 15 },  // Sales
    ];

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-pembayaran-${dateFrom}-${dateTo}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      // You could add toast notification here
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("reports.title")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.filter", "Filter")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>{t("reports.fromDate", "Dari Tanggal")}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("reports.toDate", "Sampai Tanggal")}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("Filter Berdasarkan Sales")}</Label>
              <Select value={collectorId} onValueChange={(v) => setSalesId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Semua Sales")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Semua Sales")}</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExportExcel} variant="outline" className="w-full">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t("reports.exportExcel", "Export Excel")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reports.date", "Tanggal")}</TableHead>
              <TableHead>{t("customers.title")}</TableHead>
              <TableHead>Code Coupon</TableHead>
              <TableHead className="text-center">Jumlah Coupon</TableHead>
              <TableHead className="text-right">Nominal Pembayaran</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">{t("common.loading")}</TableCell>
              </TableRow>
            ) : payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedItems.map((payment, idx) => {
                  const globalIndex = (currentPage - 1) * 10 + idx;
                  const codeCoupon = `A${String(globalIndex + 1).padStart(3, '0')}`;
                  const nominalPerCoupon = Math.round(payment.total_amount / payment.coupon_count);
                  
                  return (
                    <TableRow key={`${payment.customer_id}-${payment.payment_date}-${idx}`}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell className="font-mono text-center">{codeCoupon}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{payment.coupon_count}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">{formatRupiah(nominalPerCoupon)}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatRupiah(payment.total_amount)}
                      </TableCell>
                      <TableCell>{payment.collector_name || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </>
            )}
          </TableBody>
        </Table>
        
        {/* Total Summary Row */}
        <div className="p-4 bg-muted/50 border-t font-bold">
          <div className="flex justify-between">
            <span>Total Keseluruhan:</span>
            <span>{formatRupiah(totalAmount)}</span>
          </div>
        </div>
        
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
