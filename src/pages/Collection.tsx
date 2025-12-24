import { useState, useRef, useEffect } from "react";
import { CreditCard, FileText, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/styles/print-a4-landscape.css";
import { PrintA4LandscapeCoupons } from "@/components/print/PrintA4LandscapeCoupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { useCustomers } from "@/hooks/useCustomers";
import { useRoutes } from "@/hooks/useRoutes";
import { useContracts } from "@/hooks/useContracts";
import { useCreatePayment } from "@/hooks/usePayments";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useLastPaymentDate, calculateLateNote } from "@/hooks/useLastPaymentDate";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Collection() {
  const { t } = useTranslation();
  const { data: agents } = useSalesAgents();
  const { data: customers } = useCustomers();
  const { data: routes } = useRoutes();
  const { data: contracts } = useContracts("active");
  const createPayment = useCreatePayment();
  const printRef = useRef<HTMLDivElement>(null);

  // Manifest state
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedSales, setSelectedSales] = useState<string>("");

  // Payment state
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSales, setPaymentSales] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const selectedContractData = contracts?.find((c) => c.id === selectedContract);
  const nextCoupon = selectedContractData
    ? selectedContractData.current_installment_index + 1
    : 1;

  // Fetch last payment date for late notes calculation
  const { data: lastPaymentDate } = useLastPaymentDate(selectedContract || null);
  const [autoLateNote, setAutoLateNote] = useState<string | null>(null);

  // Calculate late note when payment date or contract changes
  useEffect(() => {
    if (selectedContract && lastPaymentDate && paymentDate) {
      const lateNote = calculateLateNote(lastPaymentDate, paymentDate);
      setAutoLateNote(lateNote);
      if (lateNote && !paymentNotes) {
        setPaymentNotes(lateNote);
      }
    } else {
      setAutoLateNote(null);
    }
  }, [selectedContract, lastPaymentDate, paymentDate]);

  const manifestContracts = contracts?.filter((c) => {
    // Filter by route
    if (selectedRoute) {
      const routeMatch = c.customers?.routes && routes?.find(r => r.id === selectedRoute)?.code === c.customers.routes.code;
      if (!routeMatch) return false;
    }
    
    // Filter by customer
    const matchesCustomer = !selectedCustomer || c.customer_id === selectedCustomer;
    
    // Filter by sales agent
    if (selectedSales) {
      const salesMatch = c.customers?.sales_agents && agents?.find(a => a.id === selectedSales)?.agent_code === c.customers.sales_agents.agent_code;
      if (!salesMatch) return false;
    }
    
    return matchesCustomer;
  });

  const selectedCustomerName = selectedCustomer 
    ? customers?.find(c => c.id === selectedCustomer)?.name
    : null;
  const selectedSalesName = selectedSales
    ? agents?.find(a => a.id === selectedSales)?.name
    : null;

  const [printMode, setPrintMode] = useState<"a4-landscape" | null>(null);

  const handlePrintCoupons = () => {
    if (!manifestContracts?.length) {
      toast.error(t("collection.noContracts"));
      return;
    }
    setPrintMode("a4-landscape");
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

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

  const handleSubmitPayment = async () => {
    if (!selectedContract) {
      toast.error(t("errors.selectContract"));
      return;
    }
    
    const amount = getNumericAmount() || selectedContractData?.daily_installment_amount || 0;
    const defaultNote = `Pembayaran ke-${nextCoupon}`;
    const finalNotes = paymentNotes.trim() || defaultNote;
    
    try {
      await createPayment.mutateAsync({
        contract_id: selectedContract,
        payment_date: paymentDate,
        installment_index: nextCoupon,
        amount_paid: amount,
        collector_id: paymentSales || null,
        notes: finalNotes,
      });
      
      toast.success(t("collection.paymentRecorded", { coupon: nextCoupon }));
      
      setSelectedContract("");
      setPaymentAmount("");
      setPaymentNotes("");
    } catch (error) {
      toast.error(t("errors.saveFailed"));
    }
  };

  return (
    <div className="space-y-6 print:space-y-0" ref={printRef}>
      {printMode === "a4-landscape" && manifestContracts && (
        <PrintA4LandscapeCoupons contracts={manifestContracts} />
      )}

      <h2 className="text-2xl font-bold print:hidden">{t("collection.title")}</h2>

      <Tabs defaultValue="manifest" className="w-full print:block">
        <TabsList className="grid w-full grid-cols-2 max-w-md print:hidden">
          <TabsTrigger value="manifest">
            <FileText className="mr-2 h-4 w-4" />
            {t("collection.generateManifest")}
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            {t("collection.inputPayment")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manifest" className="space-y-4 print:space-y-0 print:block">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>{t("collection.filterManifest")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>{t("collection.filterByRoute")}</Label>
                  <Select value={selectedRoute} onValueChange={(v) => {
                    setSelectedRoute(v === "all" ? "" : v);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("collection.allRoutes")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("collection.allRoutes")}</SelectItem>
                      {routes?.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name} ({route.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("collection.filterByCustomer")}</Label>
                  <Select value={selectedCustomer} onValueChange={(v) => {
                    setSelectedCustomer(v === "all" ? "" : v);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("collection.allCustomers")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("collection.allCustomers")}</SelectItem>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("collection.filterBySales")}</Label>
                  <Select value={selectedSales} onValueChange={(v) => {
                    setSelectedSales(v === "all" ? "" : v);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("collection.allSales")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("collection.allSales")}</SelectItem>
                      {agents?.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.agent_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handlePrintCoupons} className="flex-1 print:hidden">
                    <FileText className="mr-2 h-4 w-4" />
                    {t("collection.printCoupons")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className={`border rounded-lg ${printMode === "a4-landscape" ? "print:hidden" : "print:border-0 print:rounded-none print:w-full print:m-0"}`}>
            <Table className="print:w-full">
              <TableHeader>
                <TableRow className="print:break-inside-avoid">
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">#</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">{t("collection.customer")}</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">{t("routes.title")}</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">{t("contracts.contractRef")}</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">{t("contracts.couponIndex")}</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">{t("contracts.amount")}</TableHead>
                  <TableHead className="hidden print:table-cell print:text-black print:border print:border-black print:bg-gray-100">{t("collection.collected", "Terkumpul")}</TableHead>
                  <TableHead className="hidden print:table-cell print:text-black print:border print:border-black print:bg-gray-100">{t("collection.notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifestContracts?.length === 0 ? (
                  <TableRow className="print:hidden">
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {t("collection.noContracts")}
                    </TableCell>
                  </TableRow>
                ) : (
                  manifestContracts?.map((contract, i) => (
                    <TableRow key={contract.id} className="print:break-inside-avoid">
                      <TableCell className="print:text-black print:border print:border-black">{i + 1}</TableCell>
                      <TableCell className="font-medium print:text-black print:border print:border-black">{contract.customers?.name}</TableCell>
                      <TableCell className="print:text-black print:border print:border-black">
                        <Badge variant="outline" className="print:border-black print:text-black">{contract.customers?.routes?.code}</Badge>
                      </TableCell>
                      <TableCell className="print:text-black print:border print:border-black">{contract.contract_ref}</TableCell>
                      <TableCell className="print:text-black print:border print:border-black">
                        <Badge className="print:bg-transparent print:text-black print:border print:border-black">{contract.current_installment_index + 1}</Badge>
                      </TableCell>
                      <TableCell className="print:text-black print:border print:border-black">{formatRupiah(contract.daily_installment_amount)}</TableCell>
                      <TableCell className="hidden print:table-cell print:text-black print:border print:border-black print:min-w-[80px]"></TableCell>
                      <TableCell className="hidden print:table-cell print:text-black print:border print:border-black print:min-w-[100px]"></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>{t("collection.recordPayment")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("collection.selectContract")}</Label>
                  <Select value={selectedContract} onValueChange={setSelectedContract}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("collection.chooseContract")} />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts?.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_ref} - {contract.customers?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("collection.paymentDate")}</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedContractData && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("collection.customer")}:</span>
                    <span className="font-medium">{selectedContractData.customers?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("contracts.progress")}:</span>
                    <span className="font-medium">
                      {selectedContractData.current_installment_index}/{selectedContractData.tenor_days} {t("contracts.paid")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("collection.nextCoupon")}:</span>
                    <Badge className="text-lg">{nextCoupon}</Badge>
                  </div>
                  {lastPaymentDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("collection.lastPayment")}:</span>
                      <span className="font-medium">{lastPaymentDate}</span>
                    </div>
                  )}
                </div>
              )}

              {autoLateNote && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">{t("collection.latePayment")}: </span>
                    {autoLateNote}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("collection.amount")} (Rp)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={paymentAmount}
                    onChange={handleAmountChange}
                    placeholder={selectedContractData ? formatRupiah(selectedContractData.daily_installment_amount).replace("Rp ", "") : "0"}
                  />
                  {selectedContractData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("collection.expected")}: {formatRupiah(selectedContractData.daily_installment_amount)}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t("collection.collector")}</Label>
                  <Select value={paymentSales} onValueChange={setPaymentSales}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("collection.selectSales")} />
                    </SelectTrigger>
                    <SelectContent>
                      {agents?.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{t("collection.notes")}</Label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={`Default: Pembayaran ke-${nextCoupon}`}
                />
              </div>

              <Button
                onClick={handleSubmitPayment}
                disabled={!selectedContract || createPayment.isPending}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t("collection.recordPayment")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
