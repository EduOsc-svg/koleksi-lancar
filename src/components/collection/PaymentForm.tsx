import { useState, useEffect } from "react";
import { CreditCard, AlertTriangle, CheckCircle2, Info, Check, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { useLastPaymentDate, useNextCouponDueDate, calculateLateNoteFromDueDate } from "@/hooks/useLastPaymentDate";
import { toast } from "sonner";

interface Contract {
  id: string;
  contract_ref: string;
  current_installment_index: number;
  daily_installment_amount: number;
  total_loan_amount: number;
  tenor_days: number;
  customers: { name: string } | null;
}

interface Collector {
  id: string;
  collector_code: string;
  name: string;
}

interface PaymentFormProps {
  contracts: Contract[] | undefined;
  collectors: Collector[] | undefined;
  onSubmit: (data: {
    contract_id: string;
    payment_date: string;
    installment_index: number;
    amount_paid: number;
    collector_id: string | null;
    notes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function PaymentForm({ contracts, collectors, onSubmit, isSubmitting }: PaymentFormProps) {
  const { t } = useTranslation();
  
  const [selectedContract, setSelectedContract] = useState("");
  const [contractOpen, setContractOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>(undefined);
  const [paymentCollector, setPaymentCollector] = useState("");
  const [collectorOpen, setCollectorOpen] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");

  const selectedContractData = contracts?.find((c) => c.id === selectedContract);
  const nextCoupon = selectedContractData ? selectedContractData.current_installment_index + 1 : 1;

  const { data: lastPaymentDate } = useLastPaymentDate(selectedContract || null);
  const { data: nextCouponDueDate } = useNextCouponDueDate(selectedContract || null, nextCoupon);

  const [lateInfo, setLateInfo] = useState<{
    isLate: boolean;
    lateDays: number;
    note: string | null;
    dueDate: string | null;
  }>({ isLate: false, lateDays: 0, note: null, dueDate: null });

  useEffect(() => {
    if (selectedContract && nextCouponDueDate && paymentDate) {
      const info = calculateLateNoteFromDueDate(nextCouponDueDate, paymentDate);
      setLateInfo(info);
      if (info.isLate && info.note && !paymentNotes) {
        setPaymentNotes(info.note);
      }
    } else {
      setLateInfo({ isLate: false, lateDays: 0, note: null, dueDate: null });
    }
  }, [selectedContract, nextCouponDueDate, paymentDate]);

  const handleAmountChange = (value: number | undefined) => {
    setPaymentAmount(value);
  };

  const getNumericAmount = () => {
    return paymentAmount || 0;
  };

  const handleSubmit = async () => {
    if (!selectedContract) {
      toast.error(t("errors.selectContract"));
      return;
    }

    const amount = getNumericAmount() || selectedContractData?.daily_installment_amount || 0;
    const defaultNote = `Pembayaran ke-${nextCoupon}`;
    const finalNotes = paymentNotes.trim() || defaultNote;

    try {
      await onSubmit({
        contract_id: selectedContract,
        payment_date: paymentDate,
        installment_index: nextCoupon,
        amount_paid: amount,
        collector_id: paymentCollector || null,
        notes: finalNotes,
      });

      // Reset form
      setSelectedContract("");
      setPaymentAmount(undefined);
      setPaymentNotes("");
      setPaymentCollector("");
    } catch {
      // Error handled by parent
    }
  };

  const progress = selectedContractData
    ? (selectedContractData.current_installment_index / selectedContractData.tenor_days) * 100
    : 0;

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t("collection.recordPayment")}
        </CardTitle>
        <CardDescription>{t("collection.recordPaymentDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("collection.selectContract")}</Label>
            <Popover open={contractOpen} onOpenChange={setContractOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={contractOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedContract
                    ? (() => {
                        const contract = contracts?.find((c) => c.id === selectedContract);
                        return contract ? `${contract.contract_ref} - ${contract.customers?.name}` : t("collection.chooseContract");
                      })()
                    : t("collection.chooseContract")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kontrak atau nama pelanggan..." />
                  <CommandList>
                    <CommandEmpty>Kontrak tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {contracts?.map((contract) => (
                        <CommandItem
                          key={contract.id}
                          value={`${contract.contract_ref} ${contract.customers?.name || ''}`}
                          onSelect={() => {
                            setSelectedContract(contract.id);
                            setContractOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedContract === contract.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="font-mono">{contract.contract_ref}</span>
                          <span className="text-muted-foreground ml-2">- {contract.customers?.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("collection.paymentDate")}</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        </div>

        {/* Contract Details */}
        {selectedContractData && (
          <>
            <Separator />
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{t("collection.contractDetails")}</h4>
                <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                  #{nextCoupon}
                </Badge>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("collection.customer")}</span>
                  <span className="font-medium">{selectedContractData.customers?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("contracts.loanAmount")}</span>
                  <span className="font-medium">{formatRupiah(selectedContractData.total_loan_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("contracts.installmentAmount")}</span>
                  <span className="font-semibold text-primary">{formatRupiah(selectedContractData.daily_installment_amount)}</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("contracts.progress")}</span>
                    <span className="font-medium">
                      {selectedContractData.current_installment_index}/{selectedContractData.tenor_days}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {lastPaymentDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("collection.lastPayment")}</span>
                    <span className="font-medium">
                      {new Date(lastPaymentDate).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )}

                {nextCouponDueDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("collection.dueDate")}</span>
                    <span className={`font-medium ${lateInfo.isLate ? "text-destructive" : ""}`}>
                      {new Date(nextCouponDueDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Late Payment Warning */}
            {lateInfo.isLate && lateInfo.note && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <span className="font-semibold">{t("collection.latePayment")}: </span>
                  {lateInfo.lateDays} hari terlambat
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Payment Details */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Jumlah Bayar</Label>
            <CurrencyInput
              value={paymentAmount}
              onValueChange={handleAmountChange}
              placeholder={
                selectedContractData
                  ? formatRupiah(selectedContractData.daily_installment_amount)
                  : "Rp 0"
              }
            />
            {selectedContractData && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {t("collection.expected")}: {formatRupiah(selectedContractData.daily_installment_amount)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("collection.collector")}</Label>
            <Popover open={collectorOpen} onOpenChange={setCollectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={collectorOpen}
                  className="w-full justify-between font-normal"
                >
                  {paymentCollector
                    ? (() => {
                        const collector = collectors?.find((c) => c.id === paymentCollector);
                        return collector ? `${collector.collector_code} - ${collector.name}` : t("collection.selectSales");
                      })()
                    : t("collection.selectSales")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari kolektor..." />
                  <CommandList>
                    <CommandEmpty>Kolektor tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {collectors?.map((collector) => (
                        <CommandItem
                          key={collector.id}
                          value={`${collector.collector_code} ${collector.name}`}
                          onSelect={() => {
                            setPaymentCollector(collector.id);
                            setCollectorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              paymentCollector === collector.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {collector.collector_code} - {collector.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("collection.notes")}</Label>
          <Textarea
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder={
              lateInfo.isLate
                ? t("collection.lateNotePlaceholder")
                : `Default: Pembayaran ke-${nextCoupon}`
            }
            rows={2}
            className={lateInfo.isLate ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {lateInfo.isLate && (
            <p className="text-xs text-destructive">{t("collection.lateNoteRequired")}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedContract || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {t("common.processing")}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t("collection.recordPayment")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
