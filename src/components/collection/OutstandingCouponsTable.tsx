import { useState } from "react";
import { FileX, Download, Clock, UserCheck, FileText, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/TablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { OutstandingCouponSummary } from "@/hooks/useOutstandingCoupons";
import { exportOutstandingCouponsToExcel } from "@/lib/exportOutstandingCoupons";
import { toast } from "sonner";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CouponHandover } from "@/hooks/useCouponHandovers";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  data: OutstandingCouponSummary[] | undefined;
  isLoading: boolean;
  handovers?: CouponHandover[];
}

export function OutstandingCouponsTable({ data, isLoading, handovers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter data
  const filteredData = (data || []).filter((row) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      if (
        !row.customer_name.toLowerCase().includes(q) &&
        !row.contract_ref.toLowerCase().includes(q)
      ) return false;
    }
    if (statusFilter === "unpaid_only") return row.coupons_unpaid > 0;
    if (statusFilter === "fully_paid") return row.coupons_unpaid === 0;
    return true;
  });

  const ITEMS_PER_PAGE = 10;
  const {
    paginatedItems,
    currentPage,
    goToPage,
    totalPages,
    totalItems,
  } = usePagination(filteredData, ITEMS_PER_PAGE);

  // Create handover map for quick lookup
  const handoverMap = new Map<string, number>();
  if (handovers) {
    for (const h of handovers) {
      handoverMap.set(h.contract_id, (handoverMap.get(h.contract_id) || 0) + h.coupon_count);
    }
  }

  const handleExport = async () => {
    if (filteredData.length === 0) return;
    try {
      await exportOutstandingCouponsToExcel(filteredData, handovers);
      toast.success("File Excel berhasil diunduh");
    } catch {
      toast.error("Gagal mengekspor Excel");
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama Konsumen</TableHead>
              <TableHead>Kode Kontrak</TableHead>
              <TableHead className="text-center">Kupon Keluar</TableHead>
              <TableHead className="text-center">Kupon di Kolektor</TableHead>
              <TableHead className="text-right">Nominal Angsuran</TableHead>
              <TableHead className="text-center">Terbayar</TableHead>
              <TableHead className="text-right">Telah Dibayar</TableHead>
              <TableHead className="text-center">Belum Bayar</TableHead>
              <TableHead className="text-right">Total Belum Bayar</TableHead>
              <TableHead className="text-center">Persentase</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(12)].map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || filteredData.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filters even when empty */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari nama konsumen atau kode kontrak..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="unpaid_only">Ada Tunggakan</SelectItem>
                <SelectItem value="fully_paid">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="border rounded-lg p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Tidak Ada Kupon Tertunggak</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {searchQuery || statusFilter !== "all"
                ? "Tidak ada data yang cocok dengan filter."
                : "Semua kupon yang jatuh tempo sudah terbayar."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Totals based on filtered data
  const totalCouponsOut = filteredData.reduce((s, r) => s + r.total_coupons_issued, 0);
  const totalPaid = filteredData.reduce((s, r) => s + r.coupons_paid, 0);
  const totalUnpaid = filteredData.reduce((s, r) => s + r.coupons_unpaid, 0);
  const totalUnpaidAmount = filteredData.reduce((s, r) => s + r.total_unpaid_amount, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama konsumen atau kode kontrak..."
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="unpaid_only">Ada Tunggakan</SelectItem>
              <SelectItem value="fully_paid">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {totalItems} kontrak dengan kupon jatuh tempo
        </p>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 font-semibold">#</TableHead>
              <TableHead className="font-semibold">Nama Konsumen</TableHead>
              <TableHead className="font-semibold">Kode Kontrak</TableHead>
              <TableHead className="font-semibold text-center">Kupon Keluar</TableHead>
              <TableHead className="font-semibold text-center">Kupon di Kolektor</TableHead>
              <TableHead className="font-semibold text-right">Nominal Angsuran</TableHead>
              <TableHead className="font-semibold text-center">Terbayar</TableHead>
              <TableHead className="font-semibold text-right">Telah Dibayar</TableHead>
              <TableHead className="font-semibold text-center">Belum Bayar</TableHead>
              <TableHead className="font-semibold text-right">Total Belum Bayar</TableHead>
              <TableHead className="font-semibold text-center">Persentase</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((row, i) => {
              const handoverCount = handoverMap.get(row.contract_id) || 0;
              const paymentPercentage = row.total_coupons_issued > 0 ? (row.coupons_paid / row.total_coupons_issued) * 100 : 0;
              const getStatus = (percentage: number) => {
                if (percentage >= 90) return { text: 'Lancar', variant: 'default' as const };
                if (percentage >= 70) return { text: 'Kurang Lancar', variant: 'secondary' as const };
                return { text: 'Bermasalah', variant: 'destructive' as const };
              };
              const status = getStatus(paymentPercentage);

              return (
                <TableRow key={row.contract_id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-muted-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{row.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{row.contract_ref}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{row.total_coupons_issued}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{handoverCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatRupiah(row.daily_installment_amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{row.coupons_paid}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(row.coupons_paid * row.daily_installment_amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.coupons_unpaid > 0 ? (
                      <Badge variant="destructive">{row.coupons_unpaid}</Badge>
                    ) : (
                      <Badge variant="secondary">0</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(row.total_unpaid_amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{paymentPercentage.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Footer totals */}
            <TableRow className="bg-muted/50 font-semibold border-t-2">
              <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
              <TableCell className="text-center">{totalCouponsOut}</TableCell>
              <TableCell className="text-center">{Array.from(handoverMap.values()).reduce((sum, count) => sum + count, 0)}</TableCell>
              <TableCell />
              <TableCell className="text-center">{totalPaid}</TableCell>
              <TableCell className="text-right">{formatRupiah(filteredData.reduce((sum, row) => sum + (row.coupons_paid * row.daily_installment_amount), 0))}</TableCell>
              <TableCell className="text-center">{totalUnpaid}</TableCell>
              <TableCell className="text-right">{formatRupiah(totalUnpaidAmount)}</TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
        />
      )}

      {/* Enhanced Riwayat Serah Terima */}
      {handovers && handovers.length > 0 && (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                    Riwayat Serah Terima Kupon
                  </CardTitle>
                  <p className="text-sm text-indigo-600/70 dark:text-indigo-300/70 mt-1">
                    {handovers.length} transaksi serah terima • Menampilkan 20 terbaru
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                Riwayat
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
                    <TableHead className="font-semibold text-indigo-800 dark:text-indigo-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-indigo-800 dark:text-indigo-200">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Kolektor
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-indigo-800 dark:text-indigo-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Kontrak
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-indigo-800 dark:text-indigo-200">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Konsumen
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center text-indigo-800 dark:text-indigo-200">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Kupon
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-right text-indigo-800 dark:text-indigo-200">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Nominal
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handovers.slice(0, 20).map((h, index) => {
                    const amount = h.credit_contracts?.daily_installment_amount || 0;
                    const totalAmount = h.coupon_count * amount;
                    const isRecent = index < 3; // Mark first 3 as recent
                    
                    return (
                      <TableRow 
                        key={h.id} 
                        className={cn(
                          "hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors",
                          isRecent && "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20"
                        )}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              isRecent ? "bg-green-500" : "bg-gray-400"
                            )}></div>
                            <div>
                              <p className="text-sm font-medium">{formatDate(h.handover_date)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(h.created_at).toLocaleTimeString('id-ID', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">{h.collectors?.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {h.collectors?.collector_code}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <Badge variant="outline" className="font-mono text-xs bg-white dark:bg-gray-800">
                            {h.credit_contracts?.contract_ref}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">
                              {h.credit_contracts?.customers?.name || '-'}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center py-4">
                          <div className="flex flex-col items-center gap-1">
                            <Badge 
                              variant={isRecent ? "default" : "secondary"} 
                              className={cn(
                                "text-xs font-mono",
                                isRecent && "bg-blue-500 hover:bg-blue-600"
                              )}
                            >
                              #{h.start_index}-#{h.end_index}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {h.coupon_count} kupon
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right py-4">
                          <div className="flex flex-col items-end gap-1">
                            <p className={cn(
                              "text-sm font-bold",
                              isRecent ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                            )}>
                              {formatRupiah(totalAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRupiah(amount)}/kupon
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {handovers.length > 20 && (
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm text-indigo-700 dark:text-indigo-300">
                      Menampilkan 20 dari {handovers.length} total transaksi
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700">
                    Lihat Semua
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
