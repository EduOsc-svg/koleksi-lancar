import { useState } from "react";
import { FileX, Download } from "lucide-react";
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

interface Props {
  data: OutstandingCouponSummary[] | undefined;
  isLoading: boolean;
}

export function OutstandingCouponsTable({ data, isLoading }: Props) {
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

  const handleExport = async () => {
    if (filteredData.length === 0) return;
    try {
      await exportOutstandingCouponsToExcel(filteredData);
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
              <TableHead className="text-right">Nominal Angsuran</TableHead>
              <TableHead className="text-center">Terbayar</TableHead>
              <TableHead className="text-center">Belum Bayar</TableHead>
              <TableHead className="text-right">Total Belum Bayar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(8)].map((_, j) => (
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
              <TableHead className="font-semibold text-right">Nominal Angsuran</TableHead>
              <TableHead className="font-semibold text-center">Terbayar</TableHead>
              <TableHead className="font-semibold text-center">Belum Bayar</TableHead>
              <TableHead className="font-semibold text-right">Total Belum Bayar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((row, i) => (
              <TableRow key={row.contract_id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-muted-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                </TableCell>
                <TableCell className="font-medium">{row.customer_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">{row.contract_ref}</Badge>
                </TableCell>
                <TableCell className="text-center">{row.total_coupons_issued}</TableCell>
                <TableCell className="text-right">{formatRupiah(row.daily_installment_amount)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{row.coupons_paid}</Badge>
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
              </TableRow>
            ))}
            {/* Footer totals */}
            <TableRow className="bg-muted/50 font-semibold border-t-2">
              <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
              <TableCell className="text-center">{totalCouponsOut}</TableCell>
              <TableCell />
              <TableCell className="text-center">{totalPaid}</TableCell>
              <TableCell className="text-center">{totalUnpaid}</TableCell>
              <TableCell className="text-right">{formatRupiah(totalUnpaidAmount)}</TableCell>
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
    </div>
  );
}
