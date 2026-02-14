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
import { supabase } from "@/integrations/supabase/client";

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

    try {
      toast.loading("Memproses data export...");

      const workbook = new ExcelJS.Workbook();
    workbook.creator = "Credit Management System";
    workbook.created = new Date();
    
    // ============ Sheet 1: Performa Kolektor ============
    const worksheet = workbook.addWorksheet("Performa Kolektor");

    // Add title and period info starting from F4
    worksheet.mergeCells('F4:K4');
    const titleCell = worksheet.getCell('F4');
    titleCell.value = `LAPORAN PERFORMA KOLEKTOR - ${format(selectedDate, "MMMM yyyy", { locale: localeId }).toUpperCase()}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };

    // Periode info row
    worksheet.mergeCells('F5:K5');
    const periodCell = worksheet.getCell('F5');
    periodCell.value = `Periode: ${format(selectedDate, "d MMMM yyyy", { locale: localeId })}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // Empty row (F6 will be empty)

    // Header row starting from F7
    const headerRow = worksheet.getRow(7);
    headerRow.getCell('F').value = "Kode Kolektor";
    headerRow.getCell('G').value = "Nama";
    headerRow.getCell('H').value = "Jumlah Tagihan";
    headerRow.getCell('I').value = "Total Tertagih";
    headerRow.getCell('J').value = "Rata-rata per Tagihan";
    headerRow.getCell('K').value = "Efisiensi (%)";

    // Style header
    ['F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
      const cell = headerRow.getCell(col);
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

    // Data rows with enhanced calculations using dynamic formulas
    const dataStartRow = 8; // Now starting from row 8 since header is in row 7
    const totalCollected = collectorStats.reduce((sum, stat) => sum + stat.totalCollected, 0);
    const totalPayments = collectorStats.reduce((sum, stat) => sum + stat.paymentCount, 0);

    collectorStats.forEach((stat, index) => {
      const rowNum = dataStartRow + index;
      const row = worksheet.getRow(rowNum);
      
      row.getCell('F').value = stat.collector_code;
      row.getCell('G').value = stat.name;
      row.getCell('H').value = stat.paymentCount;
      row.getCell('I').value = stat.totalCollected;
      row.getCell('J').value = { formula: `IF(H${rowNum}=0,0,I${rowNum}/H${rowNum})` }; // Dynamic formula for average per payment
      row.getCell('K').value = { formula: `I${rowNum}/$I$${dataStartRow + collectorStats.length}` }; // Dynamic formula for efficiency percentage

      // Format cells and add borders
      ['F', 'G', 'H', 'I', 'J', 'K'].forEach((col, colIndex) => {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Format specific columns
        if (col === 'H') {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if (col === 'I' || col === 'J') {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (col === 'K') {
          cell.numFmt = '0.0%';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Total row with enhanced dynamic formulas
    const totalRowNum = dataStartRow + collectorStats.length;
    const totalRow = worksheet.getRow(totalRowNum);
    
    totalRow.getCell('F').value = '';
    totalRow.getCell('G').value = 'TOTAL';
    totalRow.getCell('H').value = { formula: `SUM(H${dataStartRow}:H${totalRowNum - 1})` }; // Total payments
    totalRow.getCell('I').value = { formula: `SUM(I${dataStartRow}:I${totalRowNum - 1})` }; // Total collected
    totalRow.getCell('J').value = { formula: `AVERAGE(J${dataStartRow}:J${totalRowNum - 1})` }; // Average per payment
    totalRow.getCell('K').value = { formula: `SUM(K${dataStartRow}:K${totalRowNum - 1})` }; // Total efficiency (should be 100%)

    // Style total row
    ['F', 'G', 'H', 'I', 'J', 'K'].forEach((col) => {
      const cell = totalRow.getCell(col);
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = {
        top: { style: 'double' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      };

      if (col === 'H') {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if (col === 'I' || col === 'J') {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (col === 'K') {
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Set column widths - now for columns F through K
    worksheet.getColumn('F').width = 18; // Kode Kolektor
    worksheet.getColumn('G').width = 30; // Nama
    worksheet.getColumn('H').width = 18; // Jumlah Tagihan
    worksheet.getColumn('I').width = 22; // Total Tertagih
    worksheet.getColumn('J').width = 20; // Rata-rata
    worksheet.getColumn('K').width = 15; // Efisiensi

    // Add conditional formatting for performance analysis
    if (collectorStats.length > 0) {
      const performanceDataRange = `I${dataStartRow}:I${dataStartRow + collectorStats.length - 1}`;
      const efficiencyDataRange = `K${dataStartRow}:K${dataStartRow + collectorStats.length - 1}`;
      
      // Conditional formatting for Total Tertagih (performance-based coloring)
      worksheet.addConditionalFormatting({
        ref: performanceDataRange,
        rules: [
          {
            type: 'colorScale',
            priority: 1,
            cfvo: [
              { type: 'min' },
              { type: 'percentile', value: 50 },
              { type: 'max' }
            ],
            color: [
              { argb: 'FFFF6B6B' }, // Red for lowest
              { argb: 'FFFFFF99' }, // Yellow for medium  
              { argb: 'FF4ECDC4' }  // Green for highest
            ]
          }
        ]
      });

      // Conditional formatting for Efficiency (percentage-based)
      worksheet.addConditionalFormatting({
        ref: efficiencyDataRange,
        rules: [
          {
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: ['0.29'],
            priority: 1,
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF90EE90' } }, // Light green for high efficiency
              font: { color: { argb: 'FF006400' } }
            },
          },
          {
            type: 'cellIs',
            operator: 'between',
            formulae: ['0.1', '0.29'],
            priority: 2,
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFD700' } }, // Gold for medium efficiency
              font: { color: { argb: 'FF8B4513' } }
            },
          },
          {
            type: 'cellIs',
            operator: 'lessThan',
            formulae: ['0.1'],
            priority: 3,
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFCCCB' } }, // Light red for low efficiency
              font: { color: { argb: 'FF8B0000' } }
            },
          }
        ]
      });
    }

    // ============ Sheet 2: Pelacakan Kupon ============
    const couponSheet = workbook.addWorksheet("Pelacakan Kupon");
    
    // Get coupon handover data and payments for the selected month
    const { data: handoversData } = await supabase
      .from('coupon_handovers')
      .select(`
        *,
        collectors(name, collector_code),
        credit_contracts(contract_ref, customer_id, customers(name))
      `)
      .gte('handover_date', monthStart.toISOString().split('T')[0])
      .lte('handover_date', monthEnd.toISOString().split('T')[0]);

    const { data: paymentsData } = await supabase
      .from('payment_logs')
      .select(`
        *,
        credit_contracts(contract_ref, customer_id, customers(name)),
        collectors(name, collector_code)
      `)
      .gte('payment_date', monthStart.toISOString().split('T')[0])
      .lte('payment_date', monthEnd.toISOString().split('T')[0]);

    // Process coupon tracking data by customer
    const customerCouponMap = new Map();

    // Process handovers (coupons received by collectors)
    handoversData?.forEach(handover => {
      const customerId = handover.credit_contracts?.customer_id;
      const customerName = handover.credit_contracts?.customers?.name;
      const contractRef = handover.credit_contracts?.contract_ref;
      
      if (customerId && customerName) {
        const key = `${customerId}-${contractRef}`;
        if (!customerCouponMap.has(key)) {
          customerCouponMap.set(key, {
            customerName,
            contractRef,
            couponsReceived: 0,
            couponsPaid: 0,
            collectorName: handover.collectors?.name || 'Unknown',
            collectorCode: handover.collectors?.collector_code || 'N/A'
          });
        }
        customerCouponMap.get(key).couponsReceived += handover.coupon_count;
      }
    });

    // Process payments (coupons paid)
    paymentsData?.forEach(payment => {
      const customerId = payment.credit_contracts?.customer_id;
      const customerName = payment.credit_contracts?.customers?.name;
      const contractRef = payment.credit_contracts?.contract_ref;
      
      if (customerId && customerName) {
        const key = `${customerId}-${contractRef}`;
        if (!customerCouponMap.has(key)) {
          customerCouponMap.set(key, {
            customerName,
            contractRef,
            couponsReceived: 0,
            couponsPaid: 0,
            collectorName: payment.collectors?.name || 'Unknown',
            collectorCode: payment.collectors?.collector_code || 'N/A'
          });
        }
        customerCouponMap.get(key).couponsPaid += 1; // Each payment represents one coupon paid
      }
    });

    // Setup coupon sheet header
    const couponTitleRow = couponSheet.addRow(['LAPORAN PELACAKAN KUPON PER KONSUMEN']);
    couponTitleRow.font = { size: 16, bold: true };
    couponTitleRow.alignment = { horizontal: 'center' };
    couponSheet.mergeCells('A1:G1');

    const couponPeriodRow = couponSheet.addRow([`Periode: ${format(monthStart, "MMMM yyyy", { locale: localeId })}`]);
    couponPeriodRow.font = { size: 12 };
    couponPeriodRow.alignment = { horizontal: 'center' };
    couponSheet.mergeCells('A2:G2');

    couponSheet.addRow([]); // Empty row

    // Header for coupon tracking
    const couponHeaderRow = couponSheet.addRow([
      "Konsumen",
      "No. Kontrak",
      "Kupon Diterima",
      "Kupon Dibayar",
      "Kupon Tertunggak",
      "Kolektor",
      "Kode Kolektor"
    ]);

    // Style coupon header
    couponHeaderRow.font = { bold: true };
    couponHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B35' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add coupon tracking data rows
    const couponDataStartRow = 5; // Row 5 is where data starts (after title, period, empty row, header)
    let dataRowCount = 0;

    Array.from(customerCouponMap.values()).forEach((customerData, index) => {
      const currentRow = couponDataStartRow + index;
      
      const row = couponSheet.addRow([
        customerData.customerName,
        customerData.contractRef,
        customerData.couponsReceived,
        customerData.couponsPaid,
        { formula: `C${currentRow}-D${currentRow}` }, // Dynamic formula for outstanding coupons
        customerData.collectorName,
        customerData.collectorCode
      ]);

      // Style data rows
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Center align numeric columns
        if (colNumber >= 3 && colNumber <= 5) {
          cell.alignment = { horizontal: 'center' };
        }
        
        // Color code outstanding coupons with conditional formatting
        if (colNumber === 5) {
          // Add conditional formatting for better visual representation
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
        }
      });

      dataRowCount++;
    });

    // Calculate the range for formulas
    const dataEndRow = couponDataStartRow + dataRowCount - 1;

    // Add summary row for coupons with dynamic formulas
    couponSheet.addRow([]); // Empty row
    const couponSummaryRow = couponSheet.addRow([
      "TOTAL",
      "",
      { formula: `SUM(C${couponDataStartRow}:C${dataEndRow})` }, // Dynamic formula for Kupon Diterima
      { formula: `SUM(D${couponDataStartRow}:D${dataEndRow})` }, // Dynamic formula for Kupon Dibayar  
      { formula: `SUM(E${couponDataStartRow}:E${dataEndRow})` }, // Dynamic formula for Kupon Tertunggak
      "",
      ""
    ]);

    couponSummaryRow.font = { bold: true };
    couponSummaryRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } };
      cell.font = { bold: true };
      
      if (colNumber >= 3 && colNumber <= 5) {
        cell.alignment = { horizontal: 'center' };
      }
      
      cell.border = {
        top: { style: 'thick' },
        left: { style: 'thin' },
        bottom: { style: 'thick' },
        right: { style: 'thin' }
      };
    });

    // Set column widths for coupon sheet
    couponSheet.getColumn('A').width = 25; // Customer name
    couponSheet.getColumn('B').width = 15; // Contract ref
    couponSheet.getColumn('C').width = 15; // Coupons received
    couponSheet.getColumn('D').width = 15; // Coupons paid
    couponSheet.getColumn('E').width = 15; // Outstanding
    couponSheet.getColumn('F').width = 20; // Collector
    couponSheet.getColumn('G').width = 15; // Collector Code

    // Add conditional formatting to Outstanding column (E) for dynamic visual feedback
    if (dataRowCount > 0) {
      const outstandingRange = `E${couponDataStartRow}:E${couponDataStartRow + dataRowCount - 1}`;
      
      couponSheet.addConditionalFormatting({
        ref: outstandingRange,
        rules: [
          {
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: ['0'],
            priority: 1,
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFCCCC' } }, // Light red for outstanding
              font: { color: { argb: 'FF8B0000' } } // Dark red text
            },
          },
          {
            type: 'cellIs',
            operator: 'equal',
            formulae: ['0'],
            priority: 2,
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFCCFFCC' } }, // Light green for zero outstanding
              font: { color: { argb: 'FF006400' } } // Dark green text
            },
          }
        ]
      });
    }

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performa_kolektor_dengan_kupon_${format(selectedDate, "yyyy-MM")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.dismiss(); // Remove loading toast
    toast.success("Data kolektor dan pelacakan kupon berhasil diekspor");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.dismiss(); // Remove loading toast
      toast.error("Gagal mengekspor data: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
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