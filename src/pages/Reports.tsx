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
import { usePayments } from "@/hooks/usePayments";
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { formatRupiah, formatDate } from "@/lib/format";

export default function Reports() {
  const { data: agents } = useSalesAgents();
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [collectorId, setCollectorId] = useState<string>("");

  const { data: payments, isLoading } = usePayments(
    dateFrom,
    dateTo,
    collectorId || undefined
  );

  const totalAmount = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) ?? 0;

  const handleExport = () => {
    if (!payments?.length) return;

    const headers = ["Date", "Customer", "Contract", "Coupon #", "Amount", "Collector", "Notes"];
    const rows = payments.map((p) => [
      p.payment_date,
      p.credit_contracts?.customers?.name || "",
      p.credit_contracts?.contract_ref || "",
      p.installment_index,
      p.amount_paid,
      p.sales_agents?.name || "",
      p.notes || "",
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
              <TableHead>Coupon #</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
                {payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{payment.credit_contracts?.customers?.name}</TableCell>
                    <TableCell>{payment.credit_contracts?.contract_ref}</TableCell>
                    <TableCell>{payment.installment_index}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(Number(payment.amount_paid))}
                    </TableCell>
                    <TableCell>{payment.sales_agents?.name || "-"}</TableCell>
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
      </div>
    </div>
  );
}
