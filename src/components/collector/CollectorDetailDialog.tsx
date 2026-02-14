import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Download } from "lucide-react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type FilterMode = "all" | "daily" | "monthly";

interface CollectorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collector: {
    id: string;
    name: string;
    collector_code: string;
  } | null;
  defaultDate: Date;
}

export function CollectorDetailDialog({
  open,
  onOpenChange,
  collector,
  defaultDate,
}: CollectorDetailDialogProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate);
  const [selectedMonth, setSelectedMonth] = useState<Date>(defaultDate);

  // Generate query key based on filter mode
  const getQueryKey = () => {
    if (filterMode === "daily" && selectedDate) {
      return format(selectedDate, "yyyy-MM-dd");
    }
    if (filterMode === "monthly") {
      return format(selectedMonth, "yyyy-MM");
    }
    return "all";
  };

  const { data: payments, isLoading } = useQuery({
    queryKey: ['collector_detail_payments', collector?.id, filterMode, getQueryKey()],
    queryFn: async () => {
      if (!collector?.id) return [];

      let query = supabase
        .from('payment_logs')
        .select(`
          id,
          payment_date,
          amount_paid,
          installment_index,
          contract_id,
          credit_contracts(
            contract_ref,
            daily_installment_amount,
            customer_id,
            customers(
              name
            )
          )
        `)
        .eq('collector_id', collector.id)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Filter based on mode
      if (filterMode === "daily" && selectedDate) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        query = query.eq('payment_date', dateStr);
      } else if (filterMode === "monthly") {
        const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
        const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
        query = query.gte('payment_date', startDate).lte('payment_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!collector?.id,
  });

  // Simple list of payments with contract ref, date, and amount
  const paymentList = payments?.map(payment => ({
    contract_ref: payment.credit_contracts?.contract_ref || '-',
    payment_date: payment.payment_date,
    amount_paid: Number(payment.amount_paid),
  })) || [];

  const totalCollected = paymentList.reduce((sum, item) => sum + item.amount_paid, 0);
  const totalPayments = paymentList.length;

  // Export detail to Excel
  const handleExportDetail = async () => {
    if (paymentList.length === 0 || !collector) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      toast.loading("Memproses data export...");

      // Get coupon handovers data
      let handoversQuery = supabase
        .from('coupon_handovers')
        .select(`
          id,
          handover_date,
          coupon_count,
          start_index,
          end_index,
          contract_id,
          credit_contracts(
            contract_ref,
            customer_id,
            customers(
              name
            )
          )
        `)
        .eq('collector_id', collector.id)
        .order('handover_date', { ascending: false });

      // Apply same date filter as payments
      if (filterMode === "daily" && selectedDate) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        handoversQuery = handoversQuery.eq('handover_date', dateStr);
      } else if (filterMode === "monthly") {
        const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
        const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
        handoversQuery = handoversQuery.gte('handover_date', startDate).lte('handover_date', endDate);
      }

      const { data: handoversData, error: handoversError } = await handoversQuery;
      if (handoversError) {
        console.error("Error fetching handovers:", handoversError);
        toast.error("Gagal mengambil data kupon: " + handoversError.message);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Credit Management System";
      workbook.created = new Date();
      
      const ws = workbook.addWorksheet("Detail Tagihan");

      // Title
    ws.mergeCells('A1:D1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `DETAIL TAGIHAN KOLEKTOR - ${collector.name.toUpperCase()} (${collector.collector_code})`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Period info
    ws.mergeCells('A2:D2');
    const periodCell = ws.getCell('A2');
    let periodText = "Periode: Semua Tanggal";
    if (filterMode === "daily" && selectedDate) {
      periodText = `Periode: ${format(selectedDate, "dd MMMM yyyy", { locale: localeId })}`;
    } else if (filterMode === "monthly") {
      periodText = `Periode: ${format(selectedMonth, "MMMM yyyy", { locale: localeId })}`;
    }
    periodCell.value = periodText;
    periodCell.font = { size: 11 };
    periodCell.alignment = { horizontal: 'center' };

    ws.addRow([]);

    // Header
    const headerRow = ws.addRow(["No", "Kode Kontrak", "Tanggal", "Jumlah"]);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data rows
    const dataStartRow = 5;
    paymentList.forEach((item, i) => {
      const row = ws.addRow([
        i + 1,
        item.contract_ref,
        format(new Date(item.payment_date), "dd/MM/yyyy"),
        item.amount_paid,
      ]);
      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (colNumber === 4) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 1) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    // Total row with formula
    const totalRowNum = dataStartRow + paymentList.length;
    const totalRow = ws.addRow(['', '', 'TOTAL', { formula: `SUM(D${dataStartRow}:D${totalRowNum - 1})` }]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = { top: { style: 'double' }, left: { style: 'thin' }, bottom: { style: 'double' }, right: { style: 'thin' } };
      if (colNumber === 4) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Column widths for first table
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 20;
    ws.getColumn(3).width = 16;
    ws.getColumn(4).width = 22;

    // ============ Second Table: Collector Summary ============
    
    // Add 3 empty rows as spacing
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]);
    
    // Process data by collector (in this case, single collector)
    const collectorSummary = {
      collector_code: collector.collector_code,
      collector_name: collector.name,
      coupons_out: 0,    // Kupon Keluar (handovers)
      coupons_in: 0,     // Kupon Masuk (payments)
      payment_count: paymentList.length,  // Jumlah Tagihan
      total_collected: totalCollected     // Total Tertagih
    };
    
    // Count handover coupons (kupon keluar)
    handoversData?.forEach(handover => {
      collectorSummary.coupons_out += handover.coupon_count;
    });
    
    // Count payment coupons (kupon masuk)
    collectorSummary.coupons_in = paymentList.length;

    // Second table header
    const secondTableStartRow = totalRowNum + 4; // After total row + 3 empty rows
    
    // Title for second table
    ws.mergeCells(`A${secondTableStartRow}:F${secondTableStartRow}`);
    const secondTitleCell = ws.getCell(`A${secondTableStartRow}`);
    secondTitleCell.value = 'RINGKASAN PERFORMA KOLEKTOR';
    secondTitleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    secondTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B35' } };
    secondTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Header row for second table
    const secondHeaderRow = ws.addRow(["Kode Kolektor", "Nama", "Kupon Keluar", "Kupon Masuk", "Jumlah Tagihan", "Total Tertagih"]);
    secondHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF8C00' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data row for second table (single collector)
    const secondDataStartRow = secondTableStartRow + 2;
    const collectorRow = ws.addRow([
      collectorSummary.collector_code,
      collectorSummary.collector_name,
      collectorSummary.coupons_out,
      collectorSummary.coupons_in,
      collectorSummary.payment_count,
      collectorSummary.total_collected
    ]);
    
    collectorRow.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      
      // Center align numeric columns
      if (colNumber >= 3 && colNumber <= 5) {
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 6) {
        // Format currency for total tertagih
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Adjust column widths for second table
    ws.getColumn(1).width = Math.max(ws.getColumn(1).width, 15); // Kode Kolektor
    ws.getColumn(2).width = Math.max(ws.getColumn(2).width, 25); // Nama
    ws.getColumn(3).width = Math.max(ws.getColumn(3).width, 12); // Kupon Keluar
    ws.getColumn(4).width = Math.max(ws.getColumn(4).width, 12); // Kupon Masuk
    ws.getColumn(5).width = Math.max(ws.getColumn(5).width, 15); // Jumlah Tagihan
    ws.getColumn(6).width = Math.max(ws.getColumn(6).width, 22); // Total Tertagih

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `detail_tagihan_kupon_${collector.collector_code}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.dismiss(); // Remove loading toast
      toast.success(`Data tagihan dan kupon ${collector.name} berhasil diekspor`);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.dismiss(); // Remove loading toast
      toast.error("Gagal mengekspor data: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detail Tagihan - {collector?.name}
            <Badge variant="outline">{collector?.collector_code}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {/* Filter Mode Selector */}
              <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>

              {/* Daily Date Picker */}
              {filterMode === "daily" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "dd MMM yyyy", { locale: localeId })
                        : "Pilih Tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={localeId}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Monthly Picker */}
              {filterMode === "monthly" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[180px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedMonth, "MMMM yyyy", { locale: localeId })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => date && setSelectedMonth(date)}
                      locale={localeId}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {totalPayments} transaksi | Total: <span className="font-semibold text-primary">{formatRupiah(totalCollected)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportDetail} disabled={paymentList.length === 0}>
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Payments Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Kode Kontrak</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paymentList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Tidak ada tagihan
                  </TableCell>
                </TableRow>
              ) : (
                paymentList.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.contract_ref}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.payment_date), "dd MMM yyyy", { locale: localeId })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatRupiah(item.amount_paid)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
