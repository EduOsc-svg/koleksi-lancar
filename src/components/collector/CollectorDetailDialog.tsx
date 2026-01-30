import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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
              name,
              customer_code
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

  return (
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

            <div className="text-sm text-muted-foreground">
              {totalPayments} transaksi | Total: <span className="font-semibold text-primary">{formatRupiah(totalCollected)}</span>
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
