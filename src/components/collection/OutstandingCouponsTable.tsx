import { useState } from "react";
import { FileX, Download, Clock, UserCheck, FileText, DollarSign, TrendingUp, Calendar, AlertTriangle, CheckCircle2, BarChart3, Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/TablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatRupiah } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { OutstandingCouponSummary } from "@/hooks/useOutstandingCoupons";
import { exportOutstandingCouponsToExcel } from "@/lib/exportOutstandingCoupons";
import { toast } from "sonner";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CouponHandover } from "@/hooks/useCouponHandovers";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  data: OutstandingCouponSummary[] | undefined;
  isLoading: boolean;
  handovers?: CouponHandover[];
}

// Helper to calculate paid/unpaid coupons within a handover range
function getHandoverStatus(handover: CouponHandover, outstandingData: OutstandingCouponSummary[]) {
  const contractData = outstandingData.find(d => d.contract_id === handover.contract_id);
  const totalPaidInContract = contractData?.coupons_paid || 0;
  
  // Since payments are sequential, coupons 1..totalPaidInContract are paid
  const paidInRange = Math.max(0, Math.min(totalPaidInContract, handover.end_index) - handover.start_index + 1);
  const unpaidInRange = handover.coupon_count - paidInRange;
  
  let status: 'fully_paid' | 'partially_paid' | 'unpaid' = 'unpaid';
  if (paidInRange >= handover.coupon_count) status = 'fully_paid';
  else if (paidInRange > 0) status = 'partially_paid';
  
  return { paidInRange, unpaidInRange, status };
}

function SummaryCards({ data, handoverTotal }: { data: OutstandingCouponSummary[]; handoverTotal: number }) {
  const contractsWithArrears = data.filter(r => r.coupons_unpaid > 0).length;
  const totalContracts = data.length;
  const totalCouponsIssued = data.reduce((s, r) => s + r.total_coupons_issued, 0);
  const totalPaid = data.reduce((s, r) => s + r.coupons_paid, 0);
  const totalUnpaid = data.reduce((s, r) => s + r.coupons_unpaid, 0);
  const totalUnpaidAmount = data.reduce((s, r) => s + r.total_unpaid_amount, 0);
  const totalPaidAmount = data.reduce((s, r) => s + r.coupons_paid * r.daily_installment_amount, 0);
  const collectionRate = totalCouponsIssued > 0 ? (totalPaid / totalCouponsIssued) * 100 : 0;

  const cards = [
    {
      title: "Total Tunggakan",
      value: formatRupiah(totalUnpaidAmount),
      subtitle: `${totalUnpaid} kupon belum bayar`,
      icon: AlertTriangle,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
    },
    {
      title: "Total Terbayar",
      value: formatRupiah(totalPaidAmount),
      subtitle: `${totalPaid} kupon lunas`,
      icon: CheckCircle2,
      iconColor: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-500/10",
    },
    {
      title: "Tingkat Koleksi",
      value: `${collectionRate.toFixed(1)}%`,
      subtitle: `${totalPaid}/${totalCouponsIssued} kupon`,
      icon: BarChart3,
      iconColor: collectionRate >= 80 ? "text-green-600 dark:text-green-400" : collectionRate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive",
      iconBg: collectionRate >= 80 ? "bg-green-500/10" : collectionRate >= 50 ? "bg-yellow-500/10" : "bg-destructive/10",
      progress: collectionRate,
    },
    {
      title: "Kontrak Bermasalah",
      value: `${contractsWithArrears}`,
      subtitle: `dari ${totalContracts} kontrak aktif`,
      icon: FileText,
      iconColor: contractsWithArrears > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400",
      iconBg: contractsWithArrears > 0 ? "bg-orange-500/10" : "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.title} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
              <div className={cn("rounded-full p-1.5", card.iconBg)}>
                <card.icon className={cn("h-3.5 w-3.5", card.iconColor)} />
              </div>
            </div>
            <p className="text-lg font-bold tracking-tight">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
            {card.progress !== undefined && (
              <Progress value={card.progress} className="h-1.5 mt-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Handover summary cards
function HandoverSummaryCards({ handovers, outstandingData }: { handovers: CouponHandover[]; outstandingData: OutstandingCouponSummary[] }) {
  const totalHandovers = handovers.length;
  const totalCouponsHandedOver = handovers.reduce((s, h) => s + h.coupon_count, 0);
  
  let totalPaidInHandovers = 0;
  let totalUnpaidInHandovers = 0;
  let fullyPaidHandovers = 0;
  
  for (const h of handovers) {
    const { paidInRange, unpaidInRange, status } = getHandoverStatus(h, outstandingData);
    totalPaidInHandovers += paidInRange;
    totalUnpaidInHandovers += unpaidInRange;
    if (status === 'fully_paid') fullyPaidHandovers++;
  }
  
  const handoverCollectionRate = totalCouponsHandedOver > 0 
    ? (totalPaidInHandovers / totalCouponsHandedOver) * 100 
    : 0;

  // Calculate total nominal
  const totalNominalHandedOver = handovers.reduce((s, h) => {
    const amount = h.credit_contracts?.daily_installment_amount || 0;
    return s + h.coupon_count * amount;
  }, 0);
  const totalNominalCollected = handovers.reduce((s, h) => {
    const amount = h.credit_contracts?.daily_installment_amount || 0;
    const { paidInRange } = getHandoverStatus(h, outstandingData);
    return s + paidInRange * amount;
  }, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Total Serah Terima</p>
            <div className="rounded-full p-1.5 bg-primary/10">
              <Package className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <p className="text-lg font-bold tracking-tight">{totalHandovers}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalCouponsHandedOver} kupon diserahkan</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Kupon Tertagih</p>
            <div className="rounded-full p-1.5 bg-green-500/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-lg font-bold tracking-tight">{totalPaidInHandovers}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatRupiah(totalNominalCollected)}</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Kupon Belum Tertagih</p>
            <div className="rounded-full p-1.5 bg-destructive/10">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
          </div>
          <p className="text-lg font-bold tracking-tight">{totalUnpaidInHandovers}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatRupiah(totalNominalHandedOver - totalNominalCollected)}</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Tingkat Penagihan</p>
            <div className={cn("rounded-full p-1.5", handoverCollectionRate >= 80 ? "bg-green-500/10" : handoverCollectionRate >= 50 ? "bg-yellow-500/10" : "bg-destructive/10")}>
              <BarChart3 className={cn("h-3.5 w-3.5", handoverCollectionRate >= 80 ? "text-green-600 dark:text-green-400" : handoverCollectionRate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive")} />
            </div>
          </div>
          <p className="text-lg font-bold tracking-tight">{handoverCollectionRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">{fullyPaidHandovers} batch lunas dari {totalHandovers}</p>
          <Progress value={handoverCollectionRate} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: 'fully_paid' | 'partially_paid' | 'unpaid' }) {
  if (status === 'fully_paid') {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">Lunas</Badge>;
  }
  if (status === 'partially_paid') {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">Sebagian</Badge>;
  }
  return <Badge variant="destructive">Belum Bayar</Badge>;
}

export function OutstandingCouponsTable({ data, isLoading, handovers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAllHandovers, setShowAllHandovers] = useState(false);
  const [handoverFilter, setHandoverFilter] = useState<string>("all");

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
  const handoverTotal = Array.from(handoverMap.values()).reduce((sum, count) => sum + count, 0);

  // Filter handovers by status
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(10)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const FiltersRow = () => (
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
  );

  if (!data || filteredData.length === 0) {
    return (
      <div className="space-y-4">
        {data && data.length > 0 && <SummaryCards data={data} handoverTotal={handoverTotal} />}
        <FiltersRow />
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
        {/* Still show handover history even if no outstanding */}
        {handovers && handovers.length > 0 && (
          <HandoverHistorySection
            handovers={handovers}
            filteredHandovers={filteredHandovers}
            displayedHandovers={displayedHandovers}
            outstandingData={data || []}
            handoverFilter={handoverFilter}
            setHandoverFilter={setHandoverFilter}
            showAllHandovers={showAllHandovers}
            setShowAllHandovers={setShowAllHandovers}
          />
        )}
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
      {/* Summary Cards */}
      <SummaryCards data={data || []} handoverTotal={handoverTotal} />

      {/* Filters */}
      <FiltersRow />

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((row, i) => {
              const handoverCount = handoverMap.get(row.contract_id) || 0;
              const rowCollectionRate = row.total_coupons_issued > 0 
                ? (row.coupons_paid / row.total_coupons_issued) * 100 
                : 0;

              return (
                <TableRow key={row.contract_id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-muted-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.customer_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Progress value={rowCollectionRate} className="h-1 w-16" />
                        <span className="text-[10px] text-muted-foreground">{rowCollectionRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </TableCell>
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
                    {row.total_unpaid_amount > 0 ? (
                      <span className="text-destructive">{formatRupiah(row.total_unpaid_amount)}</span>
                    ) : (
                      <span className="text-muted-foreground">{formatRupiah(0)}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Footer totals */}
            <TableRow className="bg-muted/50 font-semibold border-t-2">
              <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
              <TableCell className="text-center">{totalCouponsOut}</TableCell>
              <TableCell className="text-center">{handoverTotal}</TableCell>
              <TableCell />
              <TableCell className="text-center">{totalPaid}</TableCell>
              <TableCell className="text-right">{formatRupiah(filteredData.reduce((sum, row) => sum + (row.coupons_paid * row.daily_installment_amount), 0))}</TableCell>
              <TableCell className="text-center">{totalUnpaid}</TableCell>
              <TableCell className="text-right text-destructive">{formatRupiah(totalUnpaidAmount)}</TableCell>
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

      {/* Comprehensive Handover History */}
      {handovers && handovers.length > 0 && (
        <HandoverHistorySection
          handovers={handovers}
          filteredHandovers={filteredHandovers}
          displayedHandovers={displayedHandovers}
          outstandingData={data || []}
          handoverFilter={handoverFilter}
          setHandoverFilter={setHandoverFilter}
          showAllHandovers={showAllHandovers}
          setShowAllHandovers={setShowAllHandovers}
        />
      )}
    </div>
  );
}

// Extracted handover history section
function HandoverHistorySection({
  handovers,
  filteredHandovers,
  displayedHandovers,
  outstandingData,
  handoverFilter,
  setHandoverFilter,
  showAllHandovers,
  setShowAllHandovers,
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
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Dokumentasi Serah Terima Kupon
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {handovers.length} transaksi serah terima • Tracking status pembayaran per batch
              </p>
            </div>
          </div>
          <Badge variant="outline">Riwayat</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Handover Summary Cards */}
        <HandoverSummaryCards handovers={handovers} outstandingData={outstandingData} />

        {/* Handover filter */}
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-muted-foreground">Filter Status:</p>
          <Select value={handoverFilter} onValueChange={setHandoverFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua ({handovers.length})</SelectItem>
              <SelectItem value="fully_paid">
                Lunas ({handovers.filter(h => getHandoverStatus(h, outstandingData).status === 'fully_paid').length})
              </SelectItem>
              <SelectItem value="partially_paid">
                Sebagian ({handovers.filter(h => getHandoverStatus(h, outstandingData).status === 'partially_paid').length})
              </SelectItem>
              <SelectItem value="unpaid">
                Belum Bayar ({handovers.filter(h => getHandoverStatus(h, outstandingData).status === 'unpaid').length})
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground ml-auto">
            Menampilkan {displayedHandovers.length} dari {filteredHandovers.length} transaksi
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tanggal
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Kolektor
                  </div>
                </TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Kontrak / Konsumen
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-center">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Kupon
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-center">
                  Status Tagihan
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <div className="flex items-center justify-end gap-2">
                    <DollarSign className="h-4 w-4" />
                    Nominal
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedHandovers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data serah terima dengan filter ini
                  </TableCell>
                </TableRow>
              ) : (
                displayedHandovers.map((h, index) => {
                  const amount = h.credit_contracts?.daily_installment_amount || 0;
                  const totalAmount = h.coupon_count * amount;
                  const { paidInRange, unpaidInRange, status } = getHandoverStatus(h, outstandingData);
                  const paidAmount = paidInRange * amount;
                  const unpaidAmount = unpaidInRange * amount;
                  const progressRate = h.coupon_count > 0 ? (paidInRange / h.coupon_count) * 100 : 0;
                  const isRecent = index < 3 && handoverFilter === 'all';

                  return (
                    <TableRow
                      key={h.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            isRecent ? "bg-green-500" : "bg-muted-foreground/30"
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
                          <UserCheck className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{h.collectors?.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {h.collectors?.collector_code}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {h.credit_contracts?.contract_ref}
                          </Badge>
                          <p className="text-sm font-medium">
                            {h.credit_contracts?.customers?.name || '-'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-4">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={isRecent ? "default" : "secondary"}
                            className="text-xs font-mono"
                          >
                            #{h.start_index}-#{h.end_index}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {h.coupon_count} kupon
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <StatusBadge status={status} />
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-green-600 dark:text-green-400 font-medium">{paidInRange}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-destructive font-medium">{unpaidInRange}</span>
                          </div>
                          <Progress value={progressRate} className="h-1 w-20" />
                        </div>
                      </TableCell>

                      <TableCell className="text-right py-4">
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-sm font-bold">
                            {formatRupiah(totalAmount)}
                          </p>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-green-600 dark:text-green-400">{formatRupiah(paidAmount)}</span>
                          </div>
                          {unpaidAmount > 0 && (
                            <span className="text-xs text-destructive">{formatRupiah(unpaidAmount)} sisa</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* Handover totals footer */}
              {displayedHandovers.length > 0 && (() => {
                let footerTotalCoupons = 0;
                let footerPaid = 0;
                let footerUnpaid = 0;
                let footerTotalAmount = 0;
                let footerPaidAmount = 0;
                
                for (const h of filteredHandovers) {
                  const amount = h.credit_contracts?.daily_installment_amount || 0;
                  const { paidInRange, unpaidInRange } = getHandoverStatus(h, outstandingData);
                  footerTotalCoupons += h.coupon_count;
                  footerPaid += paidInRange;
                  footerUnpaid += unpaidInRange;
                  footerTotalAmount += h.coupon_count * amount;
                  footerPaidAmount += paidInRange * amount;
                }
                
                return (
                  <TableRow className="bg-muted/50 font-semibold border-t-2">
                    <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                    <TableCell className="text-center">{footerTotalCoupons} kupon</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <span className="text-green-600 dark:text-green-400">{footerPaid} lunas</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-destructive">{footerUnpaid} belum</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <p>{formatRupiah(footerTotalAmount)}</p>
                        <p className="text-xs font-normal text-destructive">{formatRupiah(footerTotalAmount - footerPaidAmount)} sisa</p>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })()}
            </TableBody>
          </Table>
        </div>

        {filteredHandovers.length > 20 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {showAllHandovers
                    ? `Menampilkan semua ${filteredHandovers.length} transaksi`
                    : `Menampilkan 20 dari ${filteredHandovers.length} total transaksi`}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllHandovers(!showAllHandovers)}
              >
                {showAllHandovers ? "Tampilkan 20 Terbaru" : "Lihat Semua"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
