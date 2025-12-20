import { useState, useRef } from "react";
import { CreditCard, FileText } from "lucide-react";
import "@/styles/print-coupon.css";
import { PrintableCoupons } from "@/components/print/PrintableCoupon";
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
import { useRoutes } from "@/hooks/useRoutes";
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { useContracts } from "@/hooks/useContracts";
import { useCreatePayment } from "@/hooks/usePayments";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default function Collection() {
  const { data: routes } = useRoutes();
  const { data: agents } = useSalesAgents();
  const { data: contracts } = useContracts("active");
  const createPayment = useCreatePayment();
  const printRef = useRef<HTMLDivElement>(null);

  // Manifest state
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [selectedCollector, setSelectedCollector] = useState<string>("");

  // Payment state
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCollector, setPaymentCollector] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const selectedContractData = contracts?.find((c) => c.id === selectedContract);
  const nextCoupon = selectedContractData
    ? selectedContractData.current_installment_index + 1
    : 1;

  const filteredContracts = contracts?.filter((c) => {
    if (selectedRoute && c.customers?.routes?.code) {
      return true; // Filter by route if needed
    }
    return true;
  });

  const manifestContracts = contracts?.filter((c) => {
    if (selectedRoute) {
      // Filter by customer's route
      return c.customers?.routes && routes?.find(r => r.id === selectedRoute)?.code === c.customers.routes.code;
    }
    if (selectedCollector) {
      return c.customers?.sales_agents && agents?.find(a => a.id === selectedCollector)?.agent_code === c.customers.sales_agents.agent_code;
    }
    return true;
  });

  // Get filter labels for print header
  const selectedRouteName = selectedRoute 
    ? routes?.find(r => r.id === selectedRoute)?.name || routes?.find(r => r.id === selectedRoute)?.code
    : null;
  const selectedCollectorName = selectedCollector
    ? agents?.find(a => a.id === selectedCollector)?.name
    : null;

  const [printMode, setPrintMode] = useState<"coupons" | null>(null);

  const handlePrintCoupons = () => {
    if (!manifestContracts?.length) {
      toast.error("No contracts to print");
      return;
    }
    setPrintMode("coupons");
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

  // Format number as currency
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
      toast.error("Please select a contract");
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
        collector_id: paymentCollector || null,
        notes: finalNotes,
      });
      
      toast.success(`Payment recorded for Coupon #${nextCoupon}`);
      
      // Reset form
      setSelectedContract("");
      setPaymentAmount("");
      setPaymentNotes("");
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };

  return (
    <div className="space-y-6 print:space-y-0" ref={printRef}>
      {/* Coupon Print Mode - Hidden on screen, visible only when printing coupons */}
      {printMode === "coupons" && manifestContracts && (
        <PrintableCoupons contracts={manifestContracts} />
      )}


      <h2 className="text-2xl font-bold print:hidden">Collection & Billing</h2>

      <Tabs defaultValue="manifest" className="w-full print:block">
        <TabsList className="grid w-full grid-cols-2 max-w-md print:hidden">
          <TabsTrigger value="manifest">
            <FileText className="mr-2 h-4 w-4" />
            Generate Manifest
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Input Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manifest" className="space-y-4 print:space-y-0 print:block">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Filter Manifest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Filter by Route</Label>
                  <Select value={selectedRoute} onValueChange={(v) => {
                    setSelectedRoute(v === "all" ? "" : v);
                    setSelectedCollector("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All routes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Routes</SelectItem>
                      {routes?.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.code} - {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Filter by Collector</Label>
                  <Select value={selectedCollector} onValueChange={(v) => {
                    setSelectedCollector(v === "all" ? "" : v);
                    setSelectedRoute("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All collectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Collectors</SelectItem>
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
                    Print Coupons
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Printable Table - Only show in manifest mode */}
          <div className={`border rounded-lg ${printMode === "coupons" ? "print:hidden" : "print:border-0 print:rounded-none print:w-full print:m-0"}`}>
            <Table className="print:w-full">
              <TableHeader>
                <TableRow className="print:break-inside-avoid">
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">#</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">Customer</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">Route</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">Contract</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">Coupon #</TableHead>
                  <TableHead className="print:text-black print:border print:border-black print:bg-gray-100">Amount</TableHead>
                  <TableHead className="hidden print:table-cell print:text-black print:border print:border-black print:bg-gray-100">Collected</TableHead>
                  <TableHead className="hidden print:table-cell print:text-black print:border print:border-black print:bg-gray-100">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifestContracts?.length === 0 ? (
                  <TableRow className="print:hidden">
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No contracts found
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
              <CardTitle>Record Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Contract</Label>
                  <Select value={selectedContract} onValueChange={setSelectedContract}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose contract" />
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
                  <Label>Payment Date</Label>
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
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{selectedContractData.customers?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="font-medium">
                      {selectedContractData.current_installment_index}/{selectedContractData.tenor_days} paid
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Coupon #:</span>
                    <Badge className="text-lg">{nextCoupon}</Badge>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Amount (Rp)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={paymentAmount}
                    onChange={handleAmountChange}
                    placeholder={selectedContractData ? formatRupiah(selectedContractData.daily_installment_amount).replace("Rp ", "") : "0"}
                  />
                  {selectedContractData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected: {formatRupiah(selectedContractData.daily_installment_amount)}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Collector</Label>
                  <Select value={paymentCollector} onValueChange={setPaymentCollector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select collector" />
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
                <Label>Notes</Label>
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
                Record Payment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
