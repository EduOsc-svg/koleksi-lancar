import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Wallet, TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function Collector() {
  const { t } = useTranslation();
  const { data: collectors } = useCollectors();
  
  // Month selection
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));
  
  // Filter by collector
  const [selectedCollector, setSelectedCollector] = useState<string>("");
  
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
  }).sort((a, b) => b.totalCollected - a.totalCollected) || [];
  
  // Pagination for collector stats
  const {
    paginatedItems: paginatedCollectors,
    currentPage: collectorPage,
    goToPage: setCollectorPage,
    totalPages: collectorTotalPages,
    totalItems: collectorTotalItems
  } = usePagination(collectorStats, 5);
  
  // Pagination for payment history
  const {
    paginatedItems: paginatedPayments,
    currentPage: paymentPage,
    goToPage: setPaymentPage,
    totalPages: paymentTotalPages,
    totalItems: paymentTotalItems
  } = usePagination(aggregatedPayments || [], 10);
  
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("Kolektor", "Kolektor")}</h2>
        
        <div className="flex gap-4">
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
                    Belum ada data kolektor
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCollectors.map((collector, i) => (
                  <TableRow key={collector.id}>
                    <TableCell>{(collectorPage - 1) * 5 + i + 1}</TableCell>
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