import { useState } from "react";
import { FileX, Download, Clock, UserCheck, FileText, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/TablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatRupiah, formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { OutstandingCouponSummary } from "@/hooks/useOutstandingCoupons";
import { exportOutstandingCouponsToExcel } from "@/lib/exportOutstandingCoupons";
import { toast } from "sonner";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CouponHandover } from "@/hooks/useCouponHandovers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  data: OutstandingCouponSummary[] | undefined;
  isLoading: boolean;
  handovers?: CouponHandover[];
}

function getHandoverStatus(handover: CouponHandover, outstandingData: OutstandingCouponSummary[]) {
  const currentIndex = handover.credit_contracts?.current_installment_index || 0;
  const paidInRange = Math.max(0, Math.min(currentIndex, handover.end_index) - handover.start_index + 1);
  const unpaidInRange = handover.coupon_count - Math.max(0, paidInRange);
  
  let status: 'fully_paid' | 'partially_paid' | 'unpaid' = 'unpaid';
  if (paidInRange >= handover.coupon_count) status = 'fully_paid';
  else if (paidInRange > 0) status = 'partially_paid';
  
  return { paidInRange: Math.max(0, paidInRange), unpaidInRange: Math.max(0, unpaidInRange), status };
}

/* ─── Summary Cards ─── */
function SummaryCards({ data, handoverTotal }: { data: OutstandingCouponSummary[]; handoverTotal: number }) {
  const contractsWithArrears = data.filter(r => r.coupons_unpaid > 0).length;
  const totalContracts = data.length;
  const totalCouponsIssued = data.reduce((s, r) => s + r.total_coupons_issued, 0);
  const totalPaid = data.reduce((s, r) => s + r.coupons_paid, 0);
  const totalUnpaid = data.reduce((s, r) => s + r.coupons_unpaid, 0);
  const totalUnpaidAmount = data.reduce((s, r) => s + r.total_unpaid_amount, 0);
  const totalPaidAmount = data.reduce((s, r) => s + r.coupons_paid * r.daily_installment_amount, 0);
  const collectionRate = totalCouponsIssued > 0 ? (totalPaid / totalCouponsIssued) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Tunggakan */}
      <Card className="shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm font-medium text-muted-foreground">Tunggakan</p>
          </div>
          <p className="text-xl font-bold tracking-tight text-destructive">{formatRupiah(totalUnpaidAmount)}</p>
          <p className="text-xs text-muted-foreground">{totalUnpaid} kupon dari {totalCouponsIssued}</p>
        </CardContent>
      </Card>

      {/* Terbayar */}
      <Card className="shadow-sm border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-muted-foreground">Terbayar</p>
          </div>
          <p className="text-xl font-bold tracking-tight">{formatRupiah(totalPaidAmount)}</p>
          <p className="text-xs text-muted-foreground">{totalPaid} kupon lunas</p>
        </CardContent>
      </Card>

      {/* Tingkat Koleksi */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className={cn("h-4 w-4", collectionRate >= 80 ? "text-green-600 dark:text-green-400" : collectionRate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive")} />
            <p className="text-sm font-medium text-muted-foreground">Koleksi</p>
          </div>
          <p className="text-xl font-bold tracking-tight">{collectionRate.toFixed(1)}%</p>
          <Progress value={collectionRate} className="h-2 mt-1.5" />
        </CardContent>
      </Card>

      {/* Kontrak Bermasalah */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className={cn("h-4 w-4", contractsWithArrears > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400")} />
            <p className="text-sm font-medium text-muted-foreground">Bermasalah</p>
          </div>
          <p className="text-xl font-bold tracking-tight">{contractsWithArrears}<span className="text-base font-normal text-muted-foreground">/{totalContracts}</span></p>
          <p className="text-xs text-muted-foreground">kontrak aktif</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: 'fully_paid' | 'partially_paid' | 'unpaid' }) {
  if (status === 'fully_paid') {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800 text-xs px-2 py-0.5">Lunas</Badge>;
  }
  if (status === 'partially_paid') {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 text-xs px-2 py-0.5">Sebagian</Badge>;
  }
  return <Badge variant="destructive" className="text-xs px-2 py-0.5">Belum</Badge>;
}

/* ─── Main Component ─── */
export function OutstandingCouponsTable({ data, isLoading, handovers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAllHandovers, setShowAllHandovers] = useState(false);
  const [handoverFilter, setHandoverFilter] = useState<string>("all");

  const filteredData = (data || []).filter((row) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      if (!row.customer_name.toLowerCase().includes(q) && !row.contract_ref.toLowerCase().includes(q)) return false;
    }
    if (statusFilter === "unpaid_only") return row.coupons_unpaid > 0;
    if (statusFilter === "fully_paid") return row.coupons_unpaid === 0;
    return true;
  });

  const ITEMS_PER_PAGE = 10;
  const { paginatedItems, currentPage, goToPage, totalPages, totalItems } = usePagination(filteredData, ITEMS_PER_PAGE);

  const handoverMap = new Map<string, number>();
  if (handovers) {
    for (const h of handovers) {
      handoverMap.set(h.contract_id, (handoverMap.get(h.contract_id) || 0) + h.coupon_count);
    }
  }
  const handoverTotal = Array.from(handoverMap.values()).reduce((sum, count) => sum + count, 0);

  const filteredHandovers = (handovers || []).filter(h => {
    if (handoverFilter === 'all') return true;
    const { status } = getHandoverStatus(h, data || []);
    return status === handoverFilter;
  });
  const displayedHandovers = showAllHandovers ? filteredHandovers : filteredHandovers.slice(0, 20);

  const handleExport = async () => {
    if (filteredData.length === 0) return;
    try {
      await exportOutstandingCouponsToExcel(filteredData, handovers);
      toast.success("File Excel berhasil diunduh");
    } catch {
      toast.error("Gagal mengekspor Excel");
    }
  };

  /* ─── Loading State ─── */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader><TableRow>
              {[...Array(6)].map((_, j) => <TableHead key={j}><Skeleton className="h-4 w-16" /></TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  /* ─── Filters ─── */
  const FiltersRow = () => (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari konsumen atau kontrak..." />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua</SelectItem>
          <SelectItem value="unpaid_only">Ada Tunggakan</SelectItem>
          <SelectItem value="fully_paid">Lunas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  /* ─── Empty State ─── */
  if (!data || filteredData.length === 0) {
    return (
      <div className="space-y-4">
        {data && data.length > 0 && <SummaryCards data={data} handoverTotal={handoverTotal} />}
        <FiltersRow />
        <div className="border rounded-lg p-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <FileX className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1">Tidak Ada Kupon Tertunggak</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {searchQuery || statusFilter !== "all" ? "Tidak ada data yang cocok dengan filter." : "Semua kupon yang jatuh tempo sudah terbayar."}
            </p>
          </div>
        </div>
        {handovers && handovers.length > 0 && (
          <HandoverHistorySection handovers={handovers} filteredHandovers={filteredHandovers} displayedHandovers={displayedHandovers} outstandingData={data || []} handoverFilter={handoverFilter} setHandoverFilter={setHandoverFilter} showAllHandovers={showAllHandovers} setShowAllHandovers={setShowAllHandovers} />
        )}
      </div>
    );
  }

  const totalCouponsOut = filteredData.reduce((s, r) => s + r.total_coupons_issued, 0);
  const totalPaid = filteredData.reduce((s, r) => s + r.coupons_paid, 0);
  const totalUnpaid = filteredData.reduce((s, r) => s + r.coupons_unpaid, 0);
  const totalUnpaidAmount = filteredData.reduce((s, r) => s + r.total_unpaid_amount, 0);
  const totalPaidAmount = filteredData.reduce((s, r) => s + r.coupons_paid * r.daily_installment_amount, 0);

  return (
    <div className="space-y-4">
      <SummaryCards data={data || []} handoverTotal={handoverTotal} />
      <FiltersRow />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{totalItems} kontrak</p>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 h-9 text-sm">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* ─── Main Table ─── */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 text-sm">#</TableHead>
              <TableHead className="text-sm">Konsumen / Kontrak</TableHead>
              <TableHead className="text-sm text-center">Progress</TableHead>
              <TableHead className="text-sm text-center">Kolektor</TableHead>
              <TableHead className="text-sm text-right">Terbayar</TableHead>
              <TableHead className="text-sm text-right">Tunggakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((row, i) => {
              const handoverCount = handoverMap.get(row.contract_id) || 0;
              const rate = row.total_coupons_issued > 0 ? (row.coupons_paid / row.total_coupons_issued) * 100 : 0;
              const hasArrears = row.coupons_unpaid > 0;

              return (
                <TableRow key={row.contract_id} className="hover:bg-muted/30">
                  <TableCell className="text-sm text-muted-foreground py-3">
                    {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                  </TableCell>

                  {/* Merged: name + contract ref */}
                  <TableCell className="py-3">
                    <p className="text-base font-medium leading-tight">{row.customer_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">{row.contract_ref}</Badge>
                      <span className="text-xs text-muted-foreground">{formatRupiah(row.daily_installment_amount)}/hari</span>
                    </div>
                  </TableCell>

                  {/* Progress: bar + counts */}
                  <TableCell className="text-center py-3">
                    <div className="flex flex-col items-center gap-1 min-w-[90px]">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span className="text-green-600 dark:text-green-400">{row.coupons_paid}</span>
                        <span className="text-muted-foreground">/</span>
                        <span>{row.total_coupons_issued}</span>
                      </div>
                      <Progress value={rate} className="h-2 w-20" />
                      <span className={cn("text-xs font-medium", rate >= 80 ? "text-green-600 dark:text-green-400" : rate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive")}>{rate.toFixed(0)}%</span>
                    </div>
                  </TableCell>

                  {/* Handover count */}
                  <TableCell className="text-center py-3">
                    {handoverCount > 0 ? (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">{handoverCount}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Paid amount */}
                  <TableCell className="text-right py-3">
                    <p className="text-sm font-medium">{formatRupiah(row.coupons_paid * row.daily_installment_amount)}</p>
                  </TableCell>

                  {/* Unpaid amount */}
                  <TableCell className="text-right py-3">
                    {hasArrears ? (
                      <div>
                        <p className="text-sm font-bold text-destructive">{formatRupiah(row.total_unpaid_amount)}</p>
                        <span className="text-xs text-muted-foreground">{row.coupons_unpaid} kupon</span>
                      </div>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800 text-xs px-2 py-0.5">Lunas</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Footer */}
            <TableRow className="bg-muted/50 font-semibold border-t-2">
              <TableCell colSpan={2} className="text-right text-sm py-3">TOTAL</TableCell>
              <TableCell className="text-center text-sm py-3">
                <span className="text-green-600 dark:text-green-400">{totalPaid}</span>
                <span className="text-muted-foreground"> / {totalCouponsOut}</span>
              </TableCell>
              <TableCell className="text-center text-sm py-3">{handoverTotal}</TableCell>
              <TableCell className="text-right text-sm py-3">{formatRupiah(totalPaidAmount)}</TableCell>
              <TableCell className="text-right text-sm py-3 text-destructive">{formatRupiah(totalUnpaidAmount)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} totalItems={totalItems} />
      )}

      {handovers && handovers.length > 0 && (
        <HandoverHistorySection handovers={handovers} filteredHandovers={filteredHandovers} displayedHandovers={displayedHandovers} outstandingData={data || []} handoverFilter={handoverFilter} setHandoverFilter={setHandoverFilter} showAllHandovers={showAllHandovers} setShowAllHandovers={setShowAllHandovers} />
      )}
    </div>
  );
}

/* ─── Handover History Section ─── */
function HandoverHistorySection({
  handovers, filteredHandovers, displayedHandovers, outstandingData,
  handoverFilter, setHandoverFilter, showAllHandovers, setShowAllHandovers,
}: {
  handovers: CouponHandover[];
  filteredHandovers: CouponHandover[];
  displayedHandovers: CouponHandover[];
  outstandingData: OutstandingCouponSummary[];
  handoverFilter: string;
  setHandoverFilter: (v: string) => void;
  showAllHandovers: boolean;
  setShowAllHandovers: (v: boolean) => void;
}) {
  // Compute handover stats
  let totalCouponsHanded = 0, totalPaidH = 0, totalUnpaidH = 0;
  let totalAmountH = 0, totalPaidAmountH = 0;
  let fullyPaidCount = 0;

  for (const h of handovers) {
    const amt = h.credit_contracts?.daily_installment_amount || 0;
    const { paidInRange, unpaidInRange, status } = getHandoverStatus(h, outstandingData);
    totalCouponsHanded += h.coupon_count;
    totalPaidH += paidInRange;
    totalUnpaidH += unpaidInRange;
    totalAmountH += h.coupon_count * amt;
    totalPaidAmountH += paidInRange * amt;
    if (status === 'fully_paid') fullyPaidCount++;
  }

  const handoverRate = totalCouponsHanded > 0 ? (totalPaidH / totalCouponsHanded) * 100 : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Serah Terima Kupon</CardTitle>
              <p className="text-sm text-muted-foreground">{handovers.length} transaksi • {totalCouponsHanded} kupon</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mini stats row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xl font-bold">{handovers.length}</p>
            <p className="text-xs text-muted-foreground">Serah Terima</p>
          </div>
          <div className="rounded-lg bg-green-500/10 p-3 text-center">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalPaidH}</p>
            <p className="text-xs text-muted-foreground">Tertagih</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <p className="text-xl font-bold text-destructive">{totalUnpaidH}</p>
            <p className="text-xs text-muted-foreground">Belum Tagih</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-xl font-bold">{handoverRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Tingkat Tagih</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between gap-2">
          <Select value={handoverFilter} onValueChange={setHandoverFilter}>
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua ({handovers.length})</SelectItem>
              <SelectItem value="fully_paid">Lunas ({handovers.filter(h => getHandoverStatus(h, outstandingData).status === 'fully_paid').length})</SelectItem>
              <SelectItem value="partially_paid">Sebagian ({handovers.filter(h => getHandoverStatus(h, outstandingData).status === 'partially_paid').length})</SelectItem>
              <SelectItem value="unpaid">Belum ({handovers.filter(h => getHandoverStatus(h, outstandingData).status === 'unpaid').length})</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{displayedHandovers.length}/{filteredHandovers.length}</span>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-sm">Tanggal</TableHead>
                <TableHead className="text-sm">Kolektor</TableHead>
                <TableHead className="text-sm">Kontrak</TableHead>
                <TableHead className="text-sm text-center">Kupon</TableHead>
                <TableHead className="text-sm text-center">Status</TableHead>
                <TableHead className="text-sm text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedHandovers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                displayedHandovers.map((h) => {
                  const amt = h.credit_contracts?.daily_installment_amount || 0;
                  const total = h.coupon_count * amt;
                  const { paidInRange, unpaidInRange, status } = getHandoverStatus(h, outstandingData);
                  const paidAmt = paidInRange * amt;
                  const rate = h.coupon_count > 0 ? (paidInRange / h.coupon_count) * 100 : 0;

                  return (
                    <TableRow key={h.id} className="hover:bg-muted/30">
                      <TableCell className="py-3">
                        <p className="text-sm font-medium">{formatDate(h.handover_date)}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium leading-tight">{h.collectors?.name}</p>
                            <span className="text-xs text-muted-foreground">{h.collectors?.collector_code}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm font-medium">{h.credit_contracts?.customers?.name || '-'}</p>
                        <Badge variant="outline" className="font-mono text-xs px-1.5 py-0 mt-0.5">{h.credit_contracts?.contract_ref}</Badge>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">#{h.start_index}-#{h.end_index}</Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.coupon_count} kpn</p>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={status} />
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-green-600 dark:text-green-400">{paidInRange}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-destructive">{unpaidInRange}</span>
                          </div>
                          <Progress value={rate} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <p className="text-sm font-bold">{formatRupiah(total)}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{formatRupiah(paidAmt)}</p>
                        {unpaidInRange > 0 && (
                          <p className="text-xs text-destructive">{formatRupiah(total - paidAmt)} sisa</p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* Footer */}
              {displayedHandovers.length > 0 && (() => {
                let fCoupons = 0, fPaid = 0, fUnpaid = 0, fTotal = 0, fPaidAmt = 0;
                for (const h of filteredHandovers) {
                  const amt = h.credit_contracts?.daily_installment_amount || 0;
                  const { paidInRange, unpaidInRange } = getHandoverStatus(h, outstandingData);
                  fCoupons += h.coupon_count;
                  fPaid += paidInRange;
                  fUnpaid += unpaidInRange;
                  fTotal += h.coupon_count * amt;
                  fPaidAmt += paidInRange * amt;
                }
                return (
                  <TableRow className="bg-muted/50 font-semibold border-t-2">
                    <TableCell colSpan={3} className="text-right text-sm py-3">TOTAL</TableCell>
                    <TableCell className="text-center text-sm py-3">{fCoupons}</TableCell>
                    <TableCell className="text-center py-3">
                      <span className="text-xs text-green-600 dark:text-green-400">{fPaid}</span>
                      <span className="text-xs text-muted-foreground"> / </span>
                      <span className="text-xs text-destructive">{fUnpaid}</span>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <p className="text-sm">{formatRupiah(fTotal)}</p>
                      <p className="text-xs text-destructive">{formatRupiah(fTotal - fPaidAmt)} sisa</p>
                    </TableCell>
                  </TableRow>
                );
              })()}
            </TableBody>
          </Table>
        </div>

        {filteredHandovers.length > 20 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {showAllHandovers ? `Semua ${filteredHandovers.length} transaksi` : `20 dari ${filteredHandovers.length}`}
            </span>
            <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={() => setShowAllHandovers(!showAllHandovers)}>
              {showAllHandovers ? "Tampilkan 20" : "Lihat Semua"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
