import { useState } from "react";
import { FileX, Download, Clock, UserCheck, FileText, DollarSign, TrendingUp, Calendar, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
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

function SummaryCards({ data, handoverTotal }: { data: OutstandingCouponSummary[]; handoverTotal: number }) {
  const totalContracts = data.length;
  const contractsWithArrears = data.filter(r => r.coupons_unpaid > 0).length;
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
  const handoverTotal = Array.from(handoverMap.values()).reduce((sum, count) => sum + count, 0);

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

      {/* Riwayat Serah Terima */}
      {handovers && handovers.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Riwayat Serah Terima Kupon (Lengkap)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {handovers.length} transaksi serah terima • Semua riwayat ditampilkan
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    Dokumentasi lengkap seluruh penyerahan kupon untuk tracking dan audit
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline">Dokumentasi</Badge>
                <Badge variant="secondary" className="text-xs">Semua Status</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                        Kontrak
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Konsumen
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Kupon
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Status
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Nominal
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handovers.map((h, index) => {
                    const amount = h.credit_contracts?.daily_installment_amount || 0;
                    const totalAmount = h.coupon_count * amount;
                    const isRecent = index < 3;
                    
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
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {h.collectors?.collector_code}
                                </Badge>
                                {h.notes && (
                                  <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50 border-blue-200">
                                    📝 Catatan
                                  </Badge>
                                )}
                              </div>
                              {h.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic max-w-32 truncate" title={h.notes}>
                                  {h.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <Badge variant="outline" className="font-mono text-xs">
                            {h.credit_contracts?.contract_ref}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="py-4">
                          <span className="text-sm font-medium">
                            {h.credit_contracts?.customers?.name || '-'}
                          </span>
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
                          <div className="flex flex-col items-center gap-1">
                            <Badge 
                              variant="outline"
                              className="text-xs bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
                            >
                              Diserahkan
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(h.handover_date)}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right py-4">
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-sm font-bold">
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
            
            {/* Documentation Note */}
            <div className="mt-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Dokumentasi Lengkap Penyerahan Kupon
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    Riwayat ini menampilkan <strong>semua transaksi penyerahan kupon</strong> kepada kolektor, 
                    baik yang sudah lunas maupun yang masih tertunggak. Data ini berguna untuk:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1 ml-4">
                    <li>• <strong>Tracking lengkap</strong> alur penyerahan kupon</li>
                    <li>• <strong>Audit trail</strong> untuk keperluan pengendalian</li>
                    <li>• <strong>Dokumentasi</strong> tanggung jawab kolektor</li>
                    <li>• <strong>Analisis</strong> performa dan pola pembayaran</li>
                  </ul>
                </div>
              </div>
            </div>

            {handovers.length > 50 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    Menampilkan {handovers.length} transaksi lengkap. Untuk performa yang lebih baik, pertimbangkan menggunakan filter atau pagination.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
