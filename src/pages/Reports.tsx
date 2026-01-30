import { useState } from "react";
import { FileSpreadsheet, Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { useAggregatedPayments } from "@/hooks/useAggregatedPayments";
import { useCustomers } from "@/hooks/useCustomers";
import { formatRupiah, formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { cn } from "@/lib/utils";

export default function Reports() {
  const { t } = useTranslation();
  const { data: customers } = useCustomers();
  
  // Month selection - use Date object for dynamic calendar
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Calculate date range from selected date
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const dateFrom = format(monthStart, "yyyy-MM-dd");
  const dateTo = format(monthEnd, "yyyy-MM-dd");
  
  // Customer combobox state
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  

  const { data: payments, isLoading } = useAggregatedPayments(
    dateFrom,
    dateTo
  );

  // Get selected customer info
  const selectedCustomer = customers?.find(c => c.id === customerId);

  // Client-side filtering untuk customer
  const filteredPayments = payments?.filter(payment => {
    if (customerId && payment.customer_id !== customerId) return false;
    return true;
  });
  
  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

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
    
    worksheet.mergeCells('A3:H3');
    const filterCell = worksheet.getCell('A3');
    let filterText = 'Filter: ';
    if (selectedCustomerInfo) {
      filterText += `Customer: ${selectedCustomerInfo.customer_code} - ${selectedCustomerInfo.name}`;
    } else {
      filterText += 'Semua Customer';
    }
    filterCell.value = filterText;
    filterCell.font = { size: 11 };
    filterCell.alignment = { horizontal: 'center' };

    // Empty row
    worksheet.addRow([]);

    // Header row
    const headerRow = worksheet.addRow([
      'Tanggal',
      'Pelanggan',
      'Kode Customer',
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
        
        // Center align for Jumlah Coupon and Kode Customer
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
      { width: 15 },  // Kode Customer
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("reports.title")}</h2>
        
        <div className="flex gap-4">
          <Button onClick={handleExportExcel} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
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
          
          {/* Searchable Customer Combobox */}
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerOpen}
                className="w-[280px] justify-between"
              >
                {selectedCustomer
                  ? `${selectedCustomer.customer_code} - ${selectedCustomer.name}`
                  : "Semua Customer"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput placeholder="Cari customer..." />
                <CommandList>
                  <CommandEmpty>Customer tidak ditemukan</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setCustomerId("");
                        setCustomerOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !customerId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Semua Customer
                    </CommandItem>
                    {customers?.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.customer_code} ${customer.name}`}
                        onSelect={() => {
                          setCustomerId(customer.id);
                          setCustomerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {customer.customer_code} - {customer.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="w-full">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              📅 {format(monthStart, "d MMM", { locale: localeId })} - {format(monthEnd, "d MMM yyyy", { locale: localeId })}
              {selectedCustomer && (
                <span className="ml-2">• 👤 {selectedCustomer.customer_code} - {selectedCustomer.name}</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{formatRupiah(totalAmount)}</div>
              <div className="text-xs text-muted-foreground">{filteredPayments?.length || 0} Transaksi</div>
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
              <TableHead>Kode Customer</TableHead>
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
