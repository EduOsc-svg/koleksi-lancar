import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, Printer } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract, useInvoiceDetails, ContractWithCustomer } from "@/hooks/useContracts";
import { useCustomers } from "@/hooks/useCustomers";
import { formatRupiah } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useCouponsByContract, useGenerateCoupons, InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import { PrintAllCoupons } from "@/components/print/PrintAllCoupons";
import "@/styles/print-a4-coupons.css";

export default function Contracts() {
  const { data: contracts, isLoading } = useContracts();
  const { data: invoiceDetails } = useInvoiceDetails();
  const { data: customers } = useCustomers();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const generateCoupons = useGenerateCoupons();
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(contracts);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithCustomer | null>(null);
  const [formData, setFormData] = useState({
    contract_ref: "",
    customer_id: "",
    product_type: "",
    total_loan_amount: "",
    tenor_days: "100",
    daily_installment_amount: "",
    start_date: new Date().toISOString().split("T")[0],
    status: "active",
  });

  // Fetch coupons for selected contract (for detail view and printing)
  const { data: selectedContractCoupons } = useCouponsByContract(selectedContract?.id || null);
  const [printMode, setPrintMode] = useState(false);

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setFormData({
      contract_ref: "",
      customer_id: "",
      product_type: "",
      total_loan_amount: "",
      tenor_days: "100",
      daily_installment_amount: "",
      start_date: new Date().toISOString().split("T")[0],
      status: "active",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (contract: ContractWithCustomer) => {
    setSelectedContract(contract);
    setFormData({
      contract_ref: contract.contract_ref,
      customer_id: contract.customer_id,
      product_type: contract.product_type || "",
      total_loan_amount: contract.total_loan_amount.toString(),
      tenor_days: contract.tenor_days.toString(),
      daily_installment_amount: contract.daily_installment_amount.toString(),
      start_date: (contract as any).start_date || new Date().toISOString().split("T")[0],
      status: contract.status,
    });
    setDialogOpen(true);
  };

  const handleOpenDetail = (contract: ContractWithCustomer) => {
    setSelectedContract(contract);
    setDetailDialogOpen(true);
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
    if (!formData.start_date) {
      toast.error("Please select a start date");
      return;
    }
    try {
      const dailyAmount = parseFloat(formData.daily_installment_amount) || calculateInstallment();
      const tenorDays = parseInt(formData.tenor_days) || 100;

      if (selectedContract) {
        await updateContract.mutateAsync({
          id: selectedContract.id,
          contract_ref: formData.contract_ref,
          customer_id: formData.customer_id,
          product_type: formData.product_type || null,
          total_loan_amount: parseFloat(formData.total_loan_amount) || 0,
          tenor_days: tenorDays,
          daily_installment_amount: dailyAmount,
          start_date: formData.start_date,
          status: formData.status,
        } as any);
        toast.success("Contract updated successfully");
      } else {
        const { data: newContract } = await createContract.mutateAsync({
          contract_ref: formData.contract_ref,
          customer_id: formData.customer_id,
          product_type: formData.product_type || null,
          total_loan_amount: parseFloat(formData.total_loan_amount) || 0,
          tenor_days: tenorDays,
          daily_installment_amount: dailyAmount,
          start_date: formData.start_date,
          status: formData.status,
        } as any);
        
        // Generate installment coupons for new active contracts
        if (formData.status === "active" && newContract?.id) {
          await generateCoupons.mutateAsync({
            contractId: newContract.id,
            startDate: formData.start_date,
            tenorDays: tenorDays,
            dailyAmount: dailyAmount,
          });
          toast.success(`Contract created with ${tenorDays} coupons generated`);
        } else {
          toast.success("Contract created successfully");
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save contract");
    }
  };

  const handleDelete = async () => {
    if (!selectedContract) return;
    try {
      await deleteContract.mutateAsync(selectedContract.id);
      toast.success("Contract deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      toast.error("Failed to delete contract. It may have payment records.");
    }
  };

  const handlePrintAllCoupons = () => {
    if (!selectedContractCoupons?.length) {
      toast.error("No coupons to print");
      return;
    }
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const getNoFaktur = (contractId: string) => {
    const invoice = invoiceDetails?.find((i) => i.id === contractId);
    return invoice?.no_faktur || "-";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Print Mode: All Coupons for selected contract */}
      {printMode && selectedContract && selectedContractCoupons && (
        <PrintAllCoupons 
          coupons={selectedContractCoupons} 
          contract={{
            contract_ref: selectedContract.contract_ref,
            tenor_days: selectedContract.tenor_days,
            daily_installment_amount: selectedContract.daily_installment_amount,
            customers: selectedContract.customers ? {
              name: selectedContract.customers.name,
              address: selectedContract.customers.address,
              sales_agents: selectedContract.customers.sales_agents,
            } : null,
          }}
        />
      )}

      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">Credit Contracts</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Contract
        </Button>
      </div>

      <div className="border rounded-lg print:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Ref</TableHead>
              <TableHead>No. Faktur</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : contracts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No contracts found
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((contract) => {
                const progress = (contract.current_installment_index / contract.tenor_days) * 100;
                const paidAmount = contract.current_installment_index * contract.daily_installment_amount;
                const remainingAmount = (contract.tenor_days - contract.current_installment_index) * contract.daily_installment_amount;
                
                const createdAt = new Date(contract.created_at);
                const today = new Date();
                const daysElapsed = Math.max(1, Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
                const daysPerDue = contract.current_installment_index > 0 
                  ? (daysElapsed / contract.current_installment_index).toFixed(1) 
                  : "0";
                const daysPerDueNum = parseFloat(daysPerDue);
                
                let statusVariant: "default" | "secondary" | "destructive" | "outline" = "default";
                let statusLabel = "Lancar";
                if (contract.status !== "active") {
                  statusVariant = "secondary";
                  statusLabel = "Completed";
                } else if (daysPerDueNum <= 1.2) {
                  statusVariant = "default";
                  statusLabel = "Lancar";
                } else if (daysPerDueNum <= 2.0) {
                  statusVariant = "outline";
                  statusLabel = "Kurang Lancar";
                } else {
                  statusVariant = "destructive";
                  statusLabel = "Macet";
                }
                
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contract_ref}</TableCell>
                    <TableCell className="font-mono text-xs">{getNoFaktur(contract.id)}</TableCell>
                    <TableCell>{contract.customers?.name}</TableCell>
                    <TableCell>{(contract as any).start_date ? formatDate((contract as any).start_date) : "-"}</TableCell>
                    <TableCell>{formatRupiah(contract.total_loan_amount)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {contract.current_installment_index}/{contract.tenor_days}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Terbayar: {formatRupiah(paidAmount)} | Sisa: {formatRupiah(remainingAmount)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={statusVariant}>
                          {statusLabel}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {daysPerDue} hari/cicilan
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(contract)} title="View & Print Coupons">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(contract)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedContract(contract);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedContract ? "Edit Contract" : "New Credit Contract"}</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Coupons will be generated from this date
                </p>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_type">Product Type</Label>
                <Input
                  id="product_type"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  placeholder="e.g., Electronics"
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
                <Label htmlFor="daily_installment_amount">Daily Installment (Rp)</Label>
                <Input
                  id="daily_installment_amount"
                  type="number"
                  value={formData.daily_installment_amount || calculateInstallment()}
                  onChange={(e) => setFormData({ ...formData, daily_installment_amount: e.target.value })}
                  placeholder="Auto-calculated"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto: {formatRupiah(calculateInstallment())}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createContract.isPending || updateContract.isPending || generateCoupons.isPending}>
              {selectedContract ? "Update" : "Create & Generate Coupons"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog with Print Option */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Details: {selectedContract?.contract_ref}</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedContract.customers?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{(selectedContract as any).start_date ? formatDate((selectedContract as any).start_date) : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Amount</p>
                  <p className="font-medium">{formatRupiah(selectedContract.total_loan_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Installment</p>
                  <p className="font-medium">{formatRupiah(selectedContract.daily_installment_amount)} × {selectedContract.tenor_days} days</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Generated Coupons ({selectedContractCoupons?.length || 0})</h4>
                <Button onClick={handlePrintAllCoupons} disabled={!selectedContractCoupons?.length}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print All Coupons (A4)
                </Button>
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedContractCoupons?.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium">Ke-{coupon.installment_index}</TableCell>
                        <TableCell>{formatDate(coupon.due_date)}</TableCell>
                        <TableCell>{formatRupiah(coupon.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={coupon.status === "paid" ? "default" : "outline"}>
                            {coupon.status === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!selectedContractCoupons || selectedContractCoupons.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No coupons generated yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All generated coupons will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
