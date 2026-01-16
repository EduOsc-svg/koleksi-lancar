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
import { useCustomers } from "@/hooks/useCustomers";
import { formatRupiah, formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { SearchInput } from "@/components/ui/search-input";

export default function Reports() {
  const { t } = useTranslation();
  const { data: agents } = useSalesAgents();
  const { data: customers } = useCustomers();
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [collectorId, setSalesId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: payments, isLoading } = useAggregatedPayments(
    dateFrom,
    dateTo,
    collectorId || undefined
  );

  // Client-side filtering untuk customer dan pencarian
  const filteredPayments = payments?.filter(payment => {
    if (customerId && payment.customer_id !== customerId) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.customer_name.toLowerCase().includes(query) ||
        payment.contract_ref.toLowerCase().includes(query) ||
        payment.sales_agent_name?.toLowerCase().includes(query) ||
        payment.collector_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const ITEMS_PER_PAGE = 5;
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(
    filteredPayments,
    ITEMS_PER_PAGE,
  );
  const totalAmount = filteredPayments?.reduce((sum, p) => sum + p.total_amount, 0) ?? 0;

  const handleExportExcel = async () => {
    if (!filteredPayments?.length) return;

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
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'LAPORAN PEMBAYARAN';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Period row
    worksheet.mergeCells('A2:H2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Periode: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // Filter info row
    const selectedCustomerInfo = customerId 
      ? customers?.find(c => c.id === customerId)
      : null;
    const selectedSalesInfo = collectorId
      ? agents?.find(a => a.id === collectorId) 
      : null;
    
    worksheet.mergeCells('A3:H3');
    const filterCell = worksheet.getCell('A3');
    let filterText = 'Filter: ';
    if (selectedCustomerInfo) {
      filterText += `Customer: ${selectedCustomerInfo.customer_code} - ${selectedCustomerInfo.name}`;
    }
    if (selectedSalesInfo) {
      if (selectedCustomerInfo) filterText += ' | ';
      filterText += `Sales: ${selectedSalesInfo.agent_code} - ${selectedSalesInfo.name}`;
    }
    if (!selectedCustomerInfo && !selectedSalesInfo) {
      filterText += 'Semua Customer & Sales';
    }
    filterCell.value = filterText;
    filterCell.font = { size: 11 };
    filterCell.alignment = { horizontal: 'center' };
    periodCell.value = `Periode: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // Empty row
    worksheet.addRow([]);

    // Header row
    const headerRow = worksheet.addRow([
      'Tanggal',
      'Pelanggan',
      'Kupon #',
      'Jumlah Coupon',
      'Nominal Pembayaran',
      'Total',
      'Nama Kolektor',
      'Nama Sales'
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
    filteredPayments.forEach((p, index) => {
      const rowNumber = index + 6; // Starting from row 6 (after headers and filter info)
      
      // Use customer code as coupon code, fallback to contract ref or customer ID
      const couponCode = p.customer_code || p.contract_ref || `${p.customer_id.slice(-4)}`;
      
      // Calculate nominal per coupon (total amount divided by coupon count)
      const nominalPerCoupon = Math.round(p.total_amount / p.coupon_count);
      
      const row = worksheet.addRow([
        p.payment_date,
        p.customer_name,
        couponCode,
        p.coupon_count,
        nominalPerCoupon,
        { formula: `D${rowNumber}*E${rowNumber}` }, // Jumlah Coupon × Nominal Pembayaran
        p.collector_name || '-',
        p.sales_agent_name || '-'
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
      { formula: `SUM(D6:D${5 + filteredPayments.length})` }, // Total Jumlah Coupon
      'TOTAL:',
      { formula: `SUM(F6:F${5 + filteredPayments.length})` }, // Total Amount
      '',  // Nama Kolektor
      ''   // Nama Sales
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
      { width: 15 },  // Kupon #
      { width: 16 },  // Jumlah Coupon
      { width: 18 },  // Nominal Pembayaran
      { width: 18 },  // Total
      { width: 20 },  // Nama Kolektor
      { width: 20 },  // Nama Sales
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
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <Label>Pencarian</Label>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari berdasarkan nama customer, kode customer, kontrak, sales, atau kolektor..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Label>{t("Filter Berdasarkan Customer (Kode)")}</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Semua Customer")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Semua Customer")}</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_code} - {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("Filter Berdasarkan Sales (Kode)")}</Label>
              <Select value={collectorId} onValueChange={(v) => setSalesId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Semua Sales")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Semua Sales")}</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.agent_code} - {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end md:col-span-2 lg:col-span-1">
              <Button onClick={handleExportExcel} variant="outline" className="w-full">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t("reports.exportExcel", "Export Excel")}
              </Button>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary & Filter Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Ringkasan Filter Aktif:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>📅 Periode: {formatDate(dateFrom)} - {formatDate(dateTo)}</div>
                {customerId && (
                  <div>👤 Customer: {customers?.find(c => c.id === customerId)?.customer_code} - {customers?.find(c => c.id === customerId)?.name}</div>
                )}
                {collectorId && (
                  <div>🏢 Sales: {agents?.find(a => a.id === collectorId)?.agent_code} - {agents?.find(a => a.id === collectorId)?.name}</div>
                )}
                {!customerId && !collectorId && (
                  <div>🌍 Menampilkan: Semua Customer & Sales</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{formatRupiah(totalAmount)}</div>
              <div className="text-sm text-muted-foreground">Total Pembayaran</div>
              <div className="text-sm text-muted-foreground">{filteredPayments?.length || 0} Transaksi</div>
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
              <TableHead>Kupon #</TableHead>
              <TableHead className="text-center">Jumlah Coupon</TableHead>
              <TableHead className="text-right">Nominal Pembayaran</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Kolektor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">{t("common.loading")}</TableCell>
              </TableRow>
            ) : filteredPayments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {payments?.length === 0 ? t("common.noData") : "Tidak ada data yang sesuai dengan filter"}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedItems.map((payment, idx) => {
                  // Use customer code as coupon code, fallback to contract ref
                  const couponCode = payment.customer_code || payment.contract_ref || `${payment.customer_id.slice(-4)}`;
                  const nominalPerCoupon = Math.round(payment.total_amount / payment.coupon_count);
                  // Format coupon indices as readable string (e.g., "1, 2, 3" or "1-5")
                  const formatCouponIndices = (indices: number[]) => {
                    if (indices.length === 0) return '-';
                    if (indices.length === 1) return String(indices[0]);
                    
                    // Check if indices are consecutive
                    const isConsecutive = indices.every((val, i) => 
                      i === 0 || val === indices[i - 1] + 1
                    );
                    
                    if (isConsecutive && indices.length > 2) {
                      return `${indices[0]}-${indices[indices.length - 1]}`;
                    }
                    return indices.join(', ');
                  };
                  
                  return (
                    <TableRow key={`${payment.customer_id}-${payment.payment_date}-${payment.contract_ref}`}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell className="font-mono text-center font-semibold">{couponCode}</TableCell>
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
