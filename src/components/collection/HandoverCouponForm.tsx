import { useState } from "react";
import { Check, ChevronsUpDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";

interface Contract {
  id: string;
  contract_ref: string;
  current_installment_index: number;
  daily_installment_amount: number;
  tenor_days: number;
  customers: { name: string } | null;
}

interface Collector {
  id: string;
  collector_code: string;
  name: string;
}

interface Props {
  contracts: Contract[] | undefined;
  collectors: Collector[] | undefined;
  onSubmit: (data: {
    collector_id: string;
    contract_id: string;
    coupon_count: number;
    start_index: number;
    end_index: number;
    handover_date: string;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function HandoverCouponForm({ contracts, collectors, onSubmit, isSubmitting }: Props) {
  const [collectorId, setCollectorId] = useState("");
  const [contractId, setContractId] = useState("");
  const [couponCount, setCouponCount] = useState<number>(1);
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [collectorOpen, setCollectorOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  const selectedContract = contracts?.find(c => c.id === contractId);
  const startIndex = selectedContract ? selectedContract.current_installment_index + 1 : 1;
  const endIndex = startIndex + couponCount - 1;
  const maxCoupons = selectedContract ? selectedContract.tenor_days - selectedContract.current_installment_index : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectorId || !contractId || couponCount < 1) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }
    if (couponCount > maxCoupons) {
      toast.error(`Maksimal kupon yang bisa diambil: ${maxCoupons}`);
      return;
    }
    await onSubmit({
      collector_id: collectorId,
      contract_id: contractId,
      coupon_count: couponCount,
      start_index: startIndex,
      end_index: endIndex,
      handover_date: handoverDate,
      notes: notes || undefined,
    });
    // Reset
    setContractId("");
    setCouponCount(1);
    setNotes("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Serah Terima Kupon
        </CardTitle>
        <CardDescription>
          Catat kupon yang diambil kolektor untuk ditagihkan ke konsumen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collector */}
          <div className="space-y-2">
            <Label>Kolektor *</Label>
            <Popover open={collectorOpen} onOpenChange={setCollectorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {collectorId
                    ? (() => { const c = collectors?.find(c => c.id === collectorId); return c ? `${c.name} (${c.collector_code})` : "Pilih kolektor..."; })()
                    : "Pilih kolektor..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kolektor..." />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {collectors?.map(c => (
                        <CommandItem key={c.id} value={`${c.name} ${c.collector_code}`} onSelect={() => { setCollectorId(c.id); setCollectorOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", collectorId === c.id ? "opacity-100" : "opacity-0")} />
                          {c.name} ({c.collector_code})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Contract */}
          <div className="space-y-2">
            <Label>Kontrak *</Label>
            <Popover open={contractOpen} onOpenChange={setContractOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {contractId
                    ? (() => { const c = selectedContract; return c ? `${c.contract_ref} - ${c.customers?.name || '-'}` : "Pilih kontrak..."; })()
                    : "Pilih kontrak..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kontrak atau konsumen..." />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {contracts?.map(c => (
                        <CommandItem key={c.id} value={`${c.contract_ref} ${c.customers?.name || ''}`} onSelect={() => { setContractId(c.id); setContractOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", contractId === c.id ? "opacity-100" : "opacity-0")} />
                          <div>
                            <span className="font-mono text-sm">{c.contract_ref}</span>
                            <span className="text-muted-foreground text-sm ml-2">{c.customers?.name || '-'}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Contract info */}
          {selectedContract && (
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
              <p>Angsuran: <span className="font-medium">{formatRupiah(selectedContract.daily_installment_amount)}</span> /kupon</p>
              <p>Kupon saat ini: <span className="font-medium">#{selectedContract.current_installment_index}</span> dari {selectedContract.tenor_days}</p>
              <p>Sisa kupon: <span className="font-medium">{maxCoupons}</span></p>
            </div>
          )}

          {/* Coupon count */}
          <div className="space-y-2">
            <Label>Jumlah Kupon Diambil *</Label>
            <Input
              type="number"
              min={1}
              max={maxCoupons || 999}
              value={couponCount}
              onChange={e => setCouponCount(parseInt(e.target.value) || 1)}
            />
            {selectedContract && couponCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Kupon #{startIndex} s/d #{endIndex} — Total: {formatRupiah(couponCount * selectedContract.daily_installment_amount)}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Tanggal Serah Terima</Label>
            <Input type="date" value={handoverDate} onChange={e => setHandoverDate(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)" rows={2} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !collectorId || !contractId}>
            {isSubmitting ? "Menyimpan..." : "Simpan Serah Terima"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
