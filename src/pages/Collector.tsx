import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Wallet, TrendingUp, Users, Calendar, DollarSign, Download } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useCollectors } from "@/hooks/useCollectors";
import { useAggregatedPayments } from "@/hooks/useAggregatedPayments";
import { usePayments } from "@/hooks/usePayments";
import { formatRupiah } from "@/lib/format";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { SearchInput } from "@/components/ui/search-input";

export default function Collector() {
  const { t } = useTranslation();
  const { data: collectors } = useCollectors();
  
  // Month selection
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));
  
  // Filter by collector
  const [selectedCollector, setSelectedCollector] = useState<string>("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Calculate date range from selected month
  const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
  const monthEnd = endOfMonth(monthStart);
  const dateFrom = format(monthStart, "yyyy-MM-dd");
  const dateTo = format(monthEnd, "yyyy-MM-dd");
  
  // Fetch payments for the selected period
  const { data: payments, isLoading } = usePayments(dateFrom, dateTo, selectedCollector || undefined);
  const { data: aggregatedPayments } = useAggregatedPayments(dateFrom, dateTo, selectedCollector || undefined);
  
  // Calculate collector statistics
  const collectorStats = collectors?.map(collector => {
    const collectorPayments = payments?.filter(p => p.collector_id === collector.id) || [];
    const totalCollected = collectorPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
    const paymentCount = collectorPayments.length;
    const uniqueCustomers = new Set(collectorPayments.map(p => p.credit_contracts?.customer_id)).size;
    
    return {
      ...collector,
      totalCollected,
      paymentCount,
      uniqueCustomers,
    };
  }).filter(collector => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collector.name.toLowerCase().includes(query) ||
      collector.collector_code.toLowerCase().includes(query) ||
      collector.phone?.toLowerCase().includes(query)
    );
  }).sort((a, b) => b.totalCollected - a.totalCollected) || [];
  
  // Pagination constants
  const COLLECTOR_ITEMS_PER_PAGE = 5;
  const PAYMENT_ITEMS_PER_PAGE = 10;
  
  // Pagination for collector stats
  const {
    paginatedItems: paginatedCollectors,
    currentPage: collectorPage,
    goToPage: setCollectorPage,
    totalPages: collectorTotalPages,
    totalItems: collectorTotalItems
  } = usePagination(collectorStats, COLLECTOR_ITEMS_PER_PAGE);
  
  // Pagination for payment history
  const {
    paginatedItems: paginatedPayments,
    currentPage: paymentPage,
    goToPage: setPaymentPage,
    totalPages: paymentTotalPages,
    totalItems: paymentTotalItems
  } = usePagination(aggregatedPayments || [], PAYMENT_ITEMS_PER_PAGE);
  
  // Summary totals
  const totalCollectedThisMonth = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
  const totalPaymentsThisMonth = payments?.length || 0;
  const uniqueCustomersThisMonth = new Set(payments?.map(p => p.credit_contracts?.customer_id)).size;
  const activeCollectors = new Set(payments?.map(p => p.collector_id)).size;
  
  // Generate month options (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    monthOptions.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: localeId }),
    });
  }

  // Export to Excel with dynamic formulas
  const handleExportExcel = async () => {
    if (collectorStats.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Credit Management System";
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet("Performa Kolektor");

    // Define columns
    // A: No, B: Kode, C: Nama, D: Jumlah Tagihan, E: Customer, F: Total Tertagih
    worksheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Kode Kolektor", key: "collector_code", width: 18 },
      { header: "Nama", key: "name", width: 30 },
      { header: "Jumlah Tagihan", key: "payment_count", width: 18 },
      { header: "Customer", key: "unique_customers", width: 15 },
      { header: "Total Tertagih", key: "total_collected", width: 22 },
    ];

    // Style header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F81BD" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    collectorStats.forEach((collector, index) => {
      const rowNumber = index + 2;
      
      const row = worksheet.addRow({
        no: null,
        collector_code: collector.collector_code,
        name: collector.name,
        payment_count: collector.paymentCount,
        unique_customers: collector.uniqueCustomers,
        total_collected: collector.totalCollected,
      });
      
      // Formula for auto-numbering: =ROW()-1
      worksheet.getCell(`A${rowNumber}`).value = { formula: `ROW()-1` };
      
      // Style each row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add summary row with SUM formulas
    const lastDataRow = collectorStats.length + 1;
    const summaryRowNumber = lastDataRow + 2;
    
    worksheet.addRow({});
    
    const summaryRow = worksheet.addRow({
      no: "TOTAL",
      collector_code: null,
      name: null,
      payment_count: null,
      unique_customers: null,
      total_collected: null,
    });
    
    // Dynamic SUM formulas
    worksheet.getCell(`D${summaryRowNumber}`).value = { formula: `SUM(D2:D${lastDataRow})` };
    worksheet.getCell(`E${summaryRowNumber}`).value = { formula: `SUM(E2:E${lastDataRow})` };
    worksheet.getCell(`F${summaryRowNumber}`).value = { formula: `SUM(F2:F${lastDataRow})` };
    
    // Style summary row
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2EFDA" },
    };
    summaryRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Format number columns
    worksheet.getColumn("payment_count").numFmt = "#,##0";
    worksheet.getColumn("unique_customers").numFmt = "#,##0";
    worksheet.getColumn("total_collected").numFmt = "#,##0";

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performa_kolektor_${selectedMonth}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("Performa Kolektor", "Performa Kolektor")}</h2>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCollector} onValueChange={(v) => setSelectedCollector(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Semua Kolektor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kolektor</SelectItem>
              {collectors?.map((collector) => (
                <SelectItem key={collector.id} value={collector.id}>
                  {collector.collector_code} - {collector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex justify-between items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari kolektor berdasarkan nama, kode, atau telepon..."
          className="max-w-md"
        />
        <div className="text-sm text-gray-500">
          Menampilkan {collectorTotalItems} dari {collectors?.length || 0} kolektor
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tertagih</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatRupiah(totalCollectedThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Bulan {format(monthStart, "MMMM yyyy", { locale: localeId })}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaymentsThisMonth}</div>
            <p className="text-xs text-muted-foreground">pembayaran tercatat</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Terlayani</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomersThisMonth}</div>
            <p className="text-xs text-muted-foreground">pelanggan unik</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kolektor Aktif</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCollectors}</div>
            <p className="text-xs text-muted-foreground">dari {collectors?.length || 0} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Collector Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performa Kolektor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Jumlah Tagihan</TableHead>
                <TableHead className="text-right">Customer</TableHead>
                <TableHead className="text-right">Total Tertagih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginatedCollectors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {searchQuery ? `Tidak ada kolektor yang ditemukan dengan kata kunci "${searchQuery}"` : "Belum ada data kolektor"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCollectors.map((collector, i) => (
                  <TableRow key={collector.id}>
                    <TableCell>{(collectorPage - 1) * COLLECTOR_ITEMS_PER_PAGE + i + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{collector.collector_code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{collector.name}</TableCell>
                    <TableCell className="text-right">{collector.paymentCount}</TableCell>
                    <TableCell className="text-right">{collector.uniqueCustomers}</TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatRupiah(collector.totalCollected)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {collectorTotalPages > 1 && (
            <TablePagination
              currentPage={collectorPage}
              totalPages={collectorTotalPages}
              onPageChange={setCollectorPage}
              totalItems={collectorTotalItems}
            />
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Kontrak</TableHead>
                <TableHead>Kolektor</TableHead>
                <TableHead className="text-right">Kupon</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada riwayat pembayaran
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment, i) => (
                  <TableRow key={`${payment.customer_id}-${payment.payment_date}-${i}`}>
                    <TableCell>
                      {format(new Date(payment.payment_date), "dd MMM yyyy", { locale: localeId })}
                    </TableCell>
                    <TableCell className="font-medium">{payment.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.contract_ref}</Badge>
                    </TableCell>
                    <TableCell>{payment.collector_name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Badge>{payment.coupon_count}x</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatRupiah(payment.total_amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {paymentTotalPages > 1 && (
            <TablePagination
              currentPage={paymentPage}
              totalPages={paymentTotalPages}
              onPageChange={setPaymentPage}
              totalItems={paymentTotalItems}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}