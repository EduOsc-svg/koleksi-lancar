import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAggregatedPayments } from "@/hooks/useAggregatedPayments";
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { formatRupiah, formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export default function Reports() {
  const { data: agents } = useSalesAgents();
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [collectorId, setCollectorId] = useState<string>("");

  const { data: payments, isLoading } = useAggregatedPayments(
    dateFrom,
    dateTo,
    collectorId || undefined
  );

  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(payments);
  const totalAmount = payments?.reduce((sum, p) => sum + p.total_amount, 0) ?? 0;

  const handleExport = () => {
    if (!payments?.length) return;

    const headers = ["Date", "Customer", "Contract", "Coupons Paid", "Total Amount", "Collector"];
    const rows = payments.map((p) => [
      p.payment_date,
      p.customer_name,
      p.contract_ref,
      p.coupon_count,
      p.total_amount,
      p.collector_name || "",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-report-${dateFrom}-${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Reports</h2>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label>Collector</Label>
              <Select value={collectorId} onValueChange={(v) => setCollectorId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All collectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead>Coupons Paid</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Collector</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedItems.map((payment, idx) => (
                  <TableRow key={`${payment.customer_id}-${payment.payment_date}-${idx}`}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{payment.customer_name}</TableCell>
                    <TableCell>{payment.contract_ref}</TableCell>
                    <TableCell>
                      <span className="font-medium">{payment.coupon_count} coupon{payment.coupon_count > 1 ? 's' : ''}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        (#{payment.coupon_indices.join(', #')})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(payment.total_amount)}
                    </TableCell>
                    <TableCell>{payment.collector_name || "-"}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">{formatRupiah(totalAmount)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
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
