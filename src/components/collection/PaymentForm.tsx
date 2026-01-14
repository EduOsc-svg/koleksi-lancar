import { useState, useEffect } from "react";
import { CreditCard, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Agent {
  id: string;
  agent_code: string;
  name: string;
}

interface PaymentFormProps {
  contracts: Contract[] | undefined;
  agents: Agent[] | undefined;
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

export function PaymentForm({ contracts, agents, onSubmit, isSubmitting }: PaymentFormProps) {
  const { t } = useTranslation();
  
  const [selectedContract, setSelectedContract] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSales, setPaymentSales] = useState("");
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

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(numericValue));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setPaymentAmount(formatted);
  };

  const getNumericAmount = () => {
    return parseFloat(paymentAmount.replace(/\./g, "")) || 0;
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
        collector_id: paymentSales || null,
        notes: finalNotes,
      });

      // Reset form
      setSelectedContract("");
      setPaymentAmount("");
      setPaymentNotes("");
      setPaymentSales("");
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
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("collection.chooseContract")} />
              </SelectTrigger>
              <SelectContent>
                {contracts?.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    <span className="font-mono">{contract.contract_ref}</span>
                    <span className="text-muted-foreground ml-2">- {contract.customers?.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label className="text-sm font-medium">{t("collection.amount")} (Rp)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={paymentAmount}
              onChange={handleAmountChange}
              placeholder={
                selectedContractData
                  ? formatRupiah(selectedContractData.daily_installment_amount).replace("Rp ", "")
                  : "0"
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
            <Select value={paymentSales} onValueChange={setPaymentSales}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("collection.selectSales")} />
              </SelectTrigger>
              <SelectContent>
                {agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.agent_code} - {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
