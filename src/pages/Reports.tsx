import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
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
  const [collectorId, setCollectorId] = useState<string>("");

  const { data: payments, isLoading } = useAggregatedPayments(
    dateFrom,
    dateTo,
    collectorId || undefined
  );

  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(payments);
  const totalAmount = payments?.reduce((sum, p) => sum + p.total_amount, 0) ?? 0;

  const handleExportExcel = async () => {
    if (!payments?.length) return;

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
      'Kontrak',
      'Jumlah Kupon',
      'Nomor Kupon',
      'Total (Rp)',
      'Kolektor'
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

    // Data rows
    payments.forEach((p) => {
      const row = worksheet.addRow([
        p.payment_date,
        p.customer_name,
        p.contract_ref,
        p.coupon_count,
        `#${p.coupon_indices.join(', #')}`,
        p.total_amount,
        p.collector_name || '-'
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Format currency column
        if (colNumber === 6) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Total row
    const totalRow = worksheet.addRow([
      '', '', '', '', 'TOTAL:',
      { formula: `SUM(F5:F${4 + payments.length})` },
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
      { width: 15 },  // Kontrak
      { width: 14 },  // Jumlah Kupon
      { width: 20 },  // Nomor Kupon
      { width: 18 },  // Total
      { width: 15 },  // Kolektor
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
              <Label>{t("collection.collector")}</Label>
              <Select value={collectorId} onValueChange={(v) => setCollectorId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("collection.allCollectors")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("collection.allCollectors")}</SelectItem>
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
              <TableHead>{t("contracts.contractRef")}</TableHead>
              <TableHead>{t("reports.couponsPaid", "Kupon Dibayar")}</TableHead>
              <TableHead className="text-right">{t("reports.totalAmount", "Total")}</TableHead>
              <TableHead>{t("collection.collector")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">{t("common.loading")}</TableCell>
              </TableRow>
            ) : payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedItems.map((payment, idx) => (
                  <TableRow key={`${payment.customer_id}-${payment.payment_date}-${idx}`}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{payment.customer_name}</TableCell>
                    <TableCell>{payment.contract_ref}</TableCell>
                    <TableCell>
                      <span className="font-medium">{payment.coupon_count} {t("contracts.coupons").toLowerCase()}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        (#{payment.coupon_indices.join(', #')})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(payment.total_amount)}
                    </TableCell>
                    <TableCell>{payment.collector_name || "-"}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">{formatRupiah(totalAmount)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
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
