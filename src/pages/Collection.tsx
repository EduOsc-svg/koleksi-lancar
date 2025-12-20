import { useState } from "react";
import { Printer, CreditCard } from "lucide-react";
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

  const handlePrintManifest = () => {
    if (!manifestContracts?.length) {
      toast.error("No contracts to print");
      return;
    }
    
    const printContent = manifestContracts.map((c) => ({
      customer: c.customers?.name,
      route: c.customers?.routes?.code,
      contractRef: c.contract_ref,
      nextCoupon: c.current_installment_index + 1,
      amount: c.daily_installment_amount,
    }));

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Collection Manifest</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; }
              h1 { text-align: center; }
              .date { text-align: right; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>Collection Manifest</h1>
            <p class="date">Date: ${new Date().toLocaleDateString('id-ID')}</p>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Contract</th>
                  <th>Coupon #</th>
                  <th>Amount</th>
                  <th>Collected</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${printContent.map((item, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${item.customer}</td>
                    <td>${item.route}</td>
                    <td>${item.contractRef}</td>
                    <td>${item.nextCoupon}</td>
                    <td>Rp ${item.amount?.toLocaleString('id-ID')}</td>
                    <td></td>
                    <td></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success("Manifest generated");
  };

  const handleSubmitPayment = async () => {
    if (!selectedContract) {
      toast.error("Please select a contract");
      return;
    }
    
    const amount = parseFloat(paymentAmount) || selectedContractData?.daily_installment_amount || 0;
    
    try {
      await createPayment.mutateAsync({
        contract_id: selectedContract,
        payment_date: paymentDate,
        installment_index: nextCoupon,
        amount_paid: amount,
        collector_id: paymentCollector || null,
        notes: paymentNotes || null,
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Collection & Billing</h2>

      <Tabs defaultValue="manifest" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="manifest">
            <Printer className="mr-2 h-4 w-4" />
            Generate Manifest
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Input Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manifest" className="space-y-4">
          <Card>
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
                  <Button onClick={handlePrintManifest} className="w-full">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Manifest
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Next Coupon</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifestContracts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No contracts found
                    </TableCell>
                  </TableRow>
                ) : (
                  manifestContracts?.map((contract, i) => (
                    <TableRow key={contract.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{contract.customers?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.customers?.routes?.code}</Badge>
                      </TableCell>
                      <TableCell>{contract.contract_ref}</TableCell>
                      <TableCell>
                        <Badge>{contract.current_installment_index + 1}</Badge>
                      </TableCell>
                      <TableCell>{formatRupiah(contract.daily_installment_amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
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
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={selectedContractData?.daily_installment_amount?.toString() || "0"}
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
                  placeholder="Optional notes"
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
