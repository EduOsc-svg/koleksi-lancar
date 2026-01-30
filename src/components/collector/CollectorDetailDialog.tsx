import { useState } from "react";
import { format } from "date-fns";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['collector_detail_payments', collector?.id, selectedDate ? format(selectedDate, "yyyy-MM-dd") : 'all'],
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

      // Filter by date only if selectedDate is set
      if (selectedDate) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        query = query.eq('payment_date', dateStr);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!collector?.id,
  });

  // Group payments by customer for the same date
  const groupedPayments = payments?.reduce((acc, payment) => {
    const customerId = payment.credit_contracts?.customer_id;
    if (!customerId) return acc;

    const key = `${customerId}-${payment.credit_contracts?.contract_ref}`;
    if (!acc[key]) {
      acc[key] = {
        customer_name: payment.credit_contracts?.customers?.name || 'Unknown',
        customer_code: payment.credit_contracts?.customers?.customer_code || '-',
        contract_ref: payment.credit_contracts?.contract_ref || '-',
        daily_amount: Number(payment.credit_contracts?.daily_installment_amount) || 0,
        total_paid: 0,
        coupon_count: 0,
        coupon_indices: [] as number[],
      };
    }
    acc[key].total_paid += Number(payment.amount_paid);
    acc[key].coupon_count += 1;
    acc[key].coupon_indices.push(payment.installment_index);
    return acc;
  }, {} as Record<string, {
    customer_name: string;
    customer_code: string;
    contract_ref: string;
    daily_amount: number;
    total_paid: number;
    coupon_count: number;
    coupon_indices: number[];
  }>) || {};

  const groupedList = Object.values(groupedPayments).map(item => ({
    ...item,
    coupon_indices: item.coupon_indices.sort((a, b) => a - b),
  }));

  const totalCollected = groupedList.reduce((sum, item) => sum + item.total_paid, 0);
  const totalCustomers = groupedList.length;

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
          {/* Date Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                    {selectedDate
                      ? format(selectedDate, "dd MMMM yyyy", { locale: localeId })
                      : "Semua Tanggal"}
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
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {totalCustomers} pelanggan | Total: <span className="font-semibold text-primary">{formatRupiah(totalCollected)}</span>
            </div>
          </div>

          {/* Payments Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Kontrak</TableHead>
                <TableHead className="text-center">Kupon</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : groupedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Tidak ada tagihan pada tanggal ini
                  </TableCell>
                </TableRow>
              ) : (
                groupedList.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.customer_code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.contract_ref}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge>{item.coupon_count}x</Badge>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({item.coupon_indices.join(', ')})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatRupiah(item.total_paid)}
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
