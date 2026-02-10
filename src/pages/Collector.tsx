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
  const { data: payments, isLoading } = usePayments(dateFrom, dateTo, undefined);
  
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
  
  // Pagination for collector stats
  const {
    paginatedItems: paginatedCollectors,
    currentPage: collectorPage,
    goToPage: setCollectorPage,
    totalPages: collectorTotalPages,
    totalItems: collectorTotalItems
  } = usePagination(collectorStats, COLLECTOR_ITEMS_PER_PAGE);
  
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

  // Export to Excel with enhanced analysis
  const handleExportExcel = async () => {
    if (collectorStats.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Credit Management System";
    workbook.created = new Date();
    
    // ============ Sheet 1: Performa Kolektor ============
    const worksheet = workbook.addWorksheet("Performa Kolektor");

    // Add title and period info
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `LAPORAN PERFORMA KOLEKTOR - ${format(selectedDate, "MMMM yyyy", { locale: localeId }).toUpperCase()}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };

    // Periode info row
    worksheet.mergeCells('A2:F2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Periode: ${format(selectedDate, "d MMMM yyyy", { locale: localeId })}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // Empty row
    worksheet.addRow([]);

    // Header row
    const headerRow = worksheet.addRow([
      "Kode Kolektor",
      "Nama", 
      "Jumlah Tagihan",
      "Total Tertagih",
      "Rata-rata per Tagihan",
      "Efisiensi (%)"
    ]);

    // Style header
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Data rows with enhanced calculations
    const dataStartRow = 5;
    const totalCollected = collectorStats.reduce((sum, stat) => sum + stat.totalCollected, 0);
    const totalPayments = collectorStats.reduce((sum, stat) => sum + stat.paymentCount, 0);

    collectorStats.forEach((stat, index) => {
      const rowNum = dataStartRow + index;
      const averagePerPayment = stat.paymentCount > 0 ? stat.totalCollected / stat.paymentCount : 0;
      const efficiency = totalCollected > 0 ? (stat.totalCollected / totalCollected) * 100 : 0;
      
      const row = worksheet.addRow([
        stat.collector_code,
        stat.name,
        stat.paymentCount,
        stat.totalCollected,
        averagePerPayment,
        efficiency / 100
      ]);

      // Format cells and add borders
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Format specific columns
        if (colNumber === 3) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if (colNumber === 4 || colNumber === 5) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 6) {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Total row with formulas
    const totalRowNum = dataStartRow + collectorStats.length;
    const totalRow = worksheet.addRow([
      '',
      'TOTAL',
      { formula: `SUM(C${dataStartRow}:C${totalRowNum - 1})` },
      { formula: `SUM(D${dataStartRow}:D${totalRowNum - 1})` },
      { formula: `AVERAGE(E${dataStartRow}:E${totalRowNum - 1})` },
      '100.0%'
    ]);

    // Style total row
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = {
        top: { style: 'double' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      };

      if (colNumber === 3) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 4 || colNumber === 5) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (colNumber === 6) {
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Set column widths
    worksheet.getColumn(1).width = 18; // Kode Kolektor
    worksheet.getColumn(2).width = 30; // Nama
    worksheet.getColumn(3).width = 18; // Jumlah Tagihan
    worksheet.getColumn(4).width = 22; // Total Tertagih
    worksheet.getColumn(5).width = 20; // Rata-rata
    worksheet.getColumn(6).width = 15; // Efisiensi

    // ============ Sheet 2: Analisis Ringkasan ============
    const summarySheet = workbook.addWorksheet("Ringkasan Analisis");
    
    summarySheet.mergeCells('A1:C1');
    const summaryTitleCell = summarySheet.getCell('A1');
    summaryTitleCell.value = `RINGKASAN ANALISIS PERFORMA - ${format(selectedDate, "MMMM yyyy", { locale: localeId }).toUpperCase()}`;
    summaryTitleCell.font = { bold: true, size: 14 };
    summaryTitleCell.alignment = { horizontal: 'center' };

    // Summary metrics
    summarySheet.addRow([]);
    summarySheet.addRow([]);
    
    const summaryData = [
      ['Metrik', 'Nilai', 'Keterangan'],
      ['Total Kolektor Aktif', collectorStats.length, 'Jumlah kolektor yang melakukan penagihan'],
      ['Total Transaksi Penagihan', totalPayments, 'Jumlah seluruh transaksi penagihan'],
      ['Total Nilai Tertagih', totalCollected, 'Total nilai yang berhasil ditagih'],
      ['Rata-rata per Kolektor', totalCollected / collectorStats.length, 'Rata-rata penagihan per kolektor'],
      ['Rata-rata per Transaksi', totalCollected / totalPayments, 'Rata-rata nilai per transaksi'],
      ['Kolektor Terbaik', collectorStats.reduce((best, current) => current.totalCollected > best.totalCollected ? current : best, collectorStats[0])?.name || '-', 'Kolektor dengan penagihan tertinggi']
    ];

    summaryData.forEach((rowData, index) => {
      const row = summarySheet.addRow(rowData);
      
      if (index === 0) {
        // Header styling
        row.font = { bold: true };
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center' };
        });
      } else {
        // Data formatting
        if (index >= 3 && index <= 5) {
          row.getCell(2).numFmt = '"Rp "#,##0';
        } else if (index === 2) {
          row.getCell(2).numFmt = '#,##0';
        }
      }
    });

    // Set column widths
    summarySheet.getColumn('A').width = 25;
    summarySheet.getColumn('B').width = 20;
    summarySheet.getColumn('C').width = 35;

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performa_kolektor_lengkap_${format(selectedDate, "yyyy-MM")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor dengan analisis lengkap");
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
        </div>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari kolektor berdasarkan nama, kode, atau telepon..."
          className="max-w-md"
          onClear={() => setSearchQuery("")}
        />
        <div className="text-sm text-gray-500">
          {searchQuery ? (
            <span>
              Ditemukan <strong>{collectorTotalItems}</strong> dari {collectors?.length || 0} kolektor
            </span>
          ) : (
            <span>
              Total <strong>{collectors?.length || 0}</strong> kolektor
            </span>
          )}
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