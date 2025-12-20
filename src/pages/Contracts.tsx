import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useContracts, useCreateContract, useInvoiceDetails } from "@/hooks/useContracts";
import { useCustomers } from "@/hooks/useCustomers";
import { formatRupiah } from "@/lib/format";

export default function Contracts() {
  const { data: contracts, isLoading } = useContracts();
  const { data: invoiceDetails } = useInvoiceDetails();
  const { data: customers } = useCustomers();
  const createContract = useCreateContract();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    contract_ref: "",
    customer_id: "",
    product_type: "",
    total_loan_amount: "",
    tenor_days: "100",
    daily_installment_amount: "",
    status: "active",
  });

  const handleOpenCreate = () => {
    setFormData({
      contract_ref: "",
      customer_id: "",
      product_type: "",
      total_loan_amount: "",
      tenor_days: "100",
      daily_installment_amount: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const calculateInstallment = () => {
    const amount = parseFloat(formData.total_loan_amount) || 0;
    const tenor = parseInt(formData.tenor_days) || 100;
    return Math.ceil(amount / tenor);
  };

  const handleSubmit = async () => {
    if (!formData.customer_id) {
      toast.error("Please select a customer");
      return;
    }
    try {
      await createContract.mutateAsync({
        contract_ref: formData.contract_ref,
        customer_id: formData.customer_id,
        product_type: formData.product_type || null,
        total_loan_amount: parseFloat(formData.total_loan_amount) || 0,
        tenor_days: parseInt(formData.tenor_days) || 100,
        daily_installment_amount: parseFloat(formData.daily_installment_amount) || calculateInstallment(),
        status: formData.status,
      });
      toast.success("Contract created successfully");
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create contract");
    }
  };

  const getNoFaktur = (contractId: string) => {
    const invoice = invoiceDetails?.find((i) => i.id === contractId);
    return invoice?.no_faktur || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Credit Contracts</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Contract
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Ref</TableHead>
              <TableHead>No. Faktur</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : contracts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No contracts found
                </TableCell>
              </TableRow>
            ) : (
              contracts?.map((contract) => {
                const progress = (contract.current_installment_index / contract.tenor_days) * 100;
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contract_ref}</TableCell>
                    <TableCell className="font-mono text-xs">{getNoFaktur(contract.id)}</TableCell>
                    <TableCell>{contract.customers?.name}</TableCell>
                    <TableCell>{formatRupiah(contract.total_loan_amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {contract.current_installment_index}/{contract.tenor_days}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                        {contract.status === "active" ? "Lancar" : "Completed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Credit Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_ref">Contract Ref</Label>
                <Input
                  id="contract_ref"
                  value={formData.contract_ref}
                  onChange={(e) => setFormData({ ...formData, contract_ref: e.target.value })}
                  placeholder="e.g., A4146"
                />
              </div>
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(v) => setFormData({ ...formData, customer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="product_type">Product Type</Label>
              <Input
                id="product_type"
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                placeholder="e.g., Electronics, Furniture"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_loan_amount">Total Loan Amount (Rp)</Label>
                <Input
                  id="total_loan_amount"
                  type="number"
                  value={formData.total_loan_amount}
                  onChange={(e) => setFormData({ ...formData, total_loan_amount: e.target.value })}
                  placeholder="e.g., 500000"
                />
              </div>
              <div>
                <Label htmlFor="tenor_days">Tenor (Days)</Label>
                <Input
                  id="tenor_days"
                  type="number"
                  value={formData.tenor_days}
                  onChange={(e) => setFormData({ ...formData, tenor_days: e.target.value })}
                  placeholder="e.g., 100"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="daily_installment_amount">Daily Installment (Rp)</Label>
              <Input
                id="daily_installment_amount"
                type="number"
                value={formData.daily_installment_amount || calculateInstallment()}
                onChange={(e) => setFormData({ ...formData, daily_installment_amount: e.target.value })}
                placeholder="Auto-calculated"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-calculated: {formatRupiah(calculateInstallment())}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createContract.isPending}>
              Create Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
