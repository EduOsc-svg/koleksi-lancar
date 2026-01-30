import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Wallet, TrendingUp, Users, CalendarIcon, DollarSign, Download, Eye } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCollectors } from "@/hooks/useCollectors";
import { useAggregatedPayments } from "@/hooks/useAggregatedPayments";
import { usePayments } from "@/hooks/usePayments";
import { formatRupiah } from "@/lib/format";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { SearchInput } from "@/components/ui/search-input";
import { CollectorDetailDialog } from "@/components/collector/CollectorDetailDialog";

export default function Collector() {
  const { t } = useTranslation();
  const { data: collectors } = useCollectors();
  
  // Month selection - use Date object for dynamic calendar
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Filter by collector
  const [selectedCollector, setSelectedCollector] = useState<string>("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCollectorDetail, setSelectedCollectorDetail] = useState<{
    id: string;
    name: string;
    collector_code: string;
  } | null>(null);
  
  // Handle view detail
  const handleViewDetail = (collector: { id: string; name: string; collector_code: string }) => {
    setSelectedCollectorDetail(collector);
    setDetailDialogOpen(true);
  };
  
  // Calculate date range from selected date
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
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
  
  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

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

    // Define columns - hanya 4 kolom sesuai permintaan
    // A: Kode, B: Nama, C: Jumlah Tagihan, D: Total Tertagih
    worksheet.columns = [
      { header: "Kode Kolektor", key: "collector_code", width: 18 },
      { header: "Nama", key: "name", width: 30 },
      { header: "Jumlah Tagihan", key: "payment_count", width: 18 },
      { header: "Total Tertagih", key: "total_collected", width: 22 },
    ];

    // Add title and period info
    worksheet.insertRow(1, [`LAPORAN PERFORMA KOLEKTOR - ${format(selectedDate, "MMMM yyyy", { locale: localeId }).toUpperCase()}`]);
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4788' } };
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };

    // Add empty row
    worksheet.addRow([]);

    // Style header row (now row 3)
    worksheet.getRow(3).eachCell((cell) => {
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
      const rowNumber = index + 4; // Starting from row 4 due to title and headers
      
      const row = worksheet.addRow({
        collector_code: collector.collector_code,
        name: collector.name,
        payment_count: collector.paymentCount,
        total_collected: collector.totalCollected,
      });
      
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

    // Add summary section with formulas
    const lastDataRow = collectorStats.length + 3; // Adjusted for title
    const summaryStartRow = lastDataRow + 2;
    
    worksheet.addRow([]);
    
    // Summary header
    const summaryHeaderRow = worksheet.addRow(['RINGKASAN']);
    worksheet.mergeCells(`A${summaryStartRow}:D${summaryStartRow}`);
    const summaryHeaderCell = worksheet.getCell(`A${summaryStartRow}`);
    summaryHeaderCell.font = { bold: true, size: 14 };
    summaryHeaderCell.alignment = { horizontal: 'center' };
    summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };

    // Summary rows with formulas
    const summaryRows = [
      ['Total Kolektor:', { formula: `COUNTA(A4:A${lastDataRow})` }, '', ''],
      ['Total Tagihan:', { formula: `SUM(C4:C${lastDataRow})` }, '', ''],
      ['Total Tertagih:', { formula: `SUM(D4:D${lastDataRow})` }, '', ''],
      ['Rata² per Kolektor:', { formula: `AVERAGE(D4:D${lastDataRow})` }, '', ''],
    ];

    summaryRows.forEach(rowData => {
      const row = worksheet.addRow(rowData);
      row.getCell(1).font = { bold: true };
      row.getCell(2).font = { bold: true };
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Format number columns
    worksheet.getColumn("payment_count").numFmt = "#,##0";
    worksheet.getColumn("total_collected").numFmt = '"Rp "#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performa_kolektor_${format(selectedDate, "yyyy-MM")}.xlsx`;
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
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "MMMM yyyy", { locale: localeId })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                defaultMonth={selectedDate}
                locale={localeId}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
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
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginatedCollectors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail({
                          id: collector.id,
                          name: collector.name,
                          collector_code: collector.collector_code,
                        })}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
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

      {/* Detail Dialog */}
      <CollectorDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        collector={selectedCollectorDetail}
        defaultDate={selectedDate}
      />
    </div>
  );
}