import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { formatRupiah } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useCouponsByContract, useGenerateCoupons, InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import { SearchInput } from "@/components/ui/search-input";
import VoucherPage from "@/components/print/VoucherPage";
import "@/styles/Voucher-final.css"; // Pixel-perfect voucher styles (9.5cm x 6.5cm)
import { CurrencyInput } from "@/components/ui/currency-input";

export default function Contracts() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { data: contracts, isLoading } = useContracts();
  const { data: invoiceDetails } = useInvoiceDetails();
  const { data: customers } = useCustomers();
  const { data: salesAgents } = useSalesAgents();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const generateCoupons = useGenerateCoupons();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter contracts based on search query
  // Only search by contract_ref and customer name to avoid confusion
  const filteredContracts = contracts?.filter(contract =>
    contract.contract_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.customers?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const ITEMS_PER_PAGE = 5;
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(filteredContracts, ITEMS_PER_PAGE);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithCustomer | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const [formData, setFormData] = useState({
    contract_ref: "",
    customer_id: "",
    sales_agent_id: "",
    product_type: "",
    total_loan_amount: 0,
    tenor_days: "100",
    daily_installment_amount: 0,
    start_date: new Date().toISOString().split("T")[0],
    status: "active",
    modal: 0,
  });

  // Fetch coupons for selected contract (for detail view and printing)
  const { data: selectedContractCoupons } = useCouponsByContract(selectedContract?.id || null);
  
  // Add pagination for coupons in detail dialog
  const { 
    currentPage: couponsPage, 
    totalPages: couponsTotalPages, 
    paginatedItems: paginatedCoupons, 
    goToPage: goToCouponsPage,
    totalItems: totalCoupons 
  } = usePagination(selectedContractCoupons, 5);
  const [printMode, setPrintMode] = useState(false);

  // Handle highlighting item from global search
  useEffect(() => {
    if (highlightId && contracts?.length) {
      const targetContract = contracts.find(c => c.id === highlightId);
      if (targetContract) {
        setHighlightedRowId(highlightId);
        
        // Find the page where this contract is located
        const contractIndex = contracts.findIndex(c => c.id === highlightId);
        const targetPage = Math.floor(contractIndex / 5) + 1;
        
        // Navigate to the correct page
        if (targetPage !== currentPage) {
          goToPage(targetPage);
        }
        
        // Auto scroll and highlight
        setTimeout(() => {
          if (highlightedRowRef.current) {
            highlightedRowRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedRowId(null);
            // Remove highlight parameter from URL
            searchParams.delete('highlight');
            setSearchParams(searchParams, { replace: true });
          }, 3000);
        }, 100);
      }
    }
  }, [highlightId, contracts, currentPage, goToPage, searchParams, setSearchParams]);

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setFormData({
      contract_ref: "",
      customer_id: "",
      sales_agent_id: "",
      product_type: "",
      total_loan_amount: 0,
      tenor_days: "100",
      daily_installment_amount: 0,
      start_date: new Date().toISOString().split("T")[0],
      status: "active",
      modal: 0,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (contract: ContractWithCustomer) => {
    setSelectedContract(contract);
    setFormData({
      contract_ref: contract.contract_ref,
      customer_id: contract.customer_id,
      sales_agent_id: contract.sales_agent_id || "",
      product_type: contract.product_type || "",
      total_loan_amount: contract.total_loan_amount,
      tenor_days: contract.tenor_days.toString(),
      daily_installment_amount: contract.daily_installment_amount,
      start_date: contract.start_date || new Date().toISOString().split("T")[0],
      status: contract.status,
      modal: (contract as any).omset || 0,
    });
    setDialogOpen(true);
  };

  const handleOpenDetail = (contract: ContractWithCustomer) => {
    setSelectedContract(contract);
    setDetailDialogOpen(true);
  };

  const calculateInstallment = () => {
    const amount = formData.total_loan_amount || 0;
    const tenor = parseInt(formData.tenor_days) || 100;
    return Math.ceil(amount / tenor);
  };

  const handleSubmit = async () => {
    if (!formData.customer_id) {
      toast.error(t("errors.selectCustomer"));
      return;
    }
    if (!formData.start_date) {
      toast.error(t("errors.selectStartDate"));
      return;
    }
    try {
      const dailyAmount = formData.daily_installment_amount || calculateInstallment();
      const tenorDays = parseInt(formData.tenor_days) || 100;

      if (selectedContract) {
        await updateContract.mutateAsync({
          id: selectedContract.id,
          contract_ref: formData.contract_ref,
          customer_id: formData.customer_id,
          sales_agent_id: formData.sales_agent_id || null,
          product_type: formData.product_type || null,
          total_loan_amount: formData.total_loan_amount || 0,
          tenor_days: tenorDays,
          daily_installment_amount: dailyAmount,
          start_date: formData.start_date,
          status: formData.status,
          omset: formData.modal || 0,
        } as any);
        toast.success(t("contracts.updatedSuccess"));
      } else {
        const { data: newContract } = await createContract.mutateAsync({
          contract_ref: formData.contract_ref,
          customer_id: formData.customer_id,
          sales_agent_id: formData.sales_agent_id || null,
          product_type: formData.product_type || null,
          total_loan_amount: formData.total_loan_amount || 0,
          tenor_days: tenorDays,
          daily_installment_amount: dailyAmount,
          start_date: formData.start_date,
          status: formData.status,
          omset: formData.modal || 0,
        } as any);
        
        // Generate installment coupons for new active contracts
        if (formData.status === "active" && newContract?.id) {
          await generateCoupons.mutateAsync({
            contractId: newContract.id,
            startDate: formData.start_date,
            tenorDays: tenorDays,
            dailyAmount: dailyAmount,
          });
          toast.success(t("contracts.createdWithCoupons", { count: tenorDays }));
        } else {
          toast.success(t("contracts.createdSuccess"));
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t("errors.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!selectedContract) return;
    try {
      await deleteContract.mutateAsync(selectedContract.id);
      toast.success(t("contracts.deletedSuccess"));
      setDeleteDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      toast.error(t("contracts.deleteFailed"));
    }
  };

  const handlePrintAllCoupons = () => {
    if (!selectedContractCoupons?.length) {
      toast.error(t("contracts.noCoupons"));
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
      {/* Print Mode: Voucher Print System */}
      {printMode && selectedContract && selectedContractCoupons && (
        <VoucherPage 
          contracts={[{
            id: selectedContract.id,
            contract_ref: selectedContract.contract_ref,
            current_installment_index: selectedContract.current_installment_index,
            daily_installment_amount: selectedContract.daily_installment_amount,
            tenor_days: selectedContract.tenor_days,
            customers: selectedContract.customers ? {
              name: selectedContract.customers.name,
              address: selectedContract.customers.address || null,
              sales_agents: selectedContract.customers.sales_agents || null,
            } : null,
          }]}
        />
      )}

      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">Credit Contracts</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Contract
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex justify-between items-center gap-4 print:hidden">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari kontrak berdasarkan nomor kontrak, nama customer, kode customer, atau jenis produk..."
          className="max-w-lg"
        />
        <div className="text-sm text-gray-500">
          Menampilkan {totalItems} dari {contracts?.length || 0} kontrak
        </div>
      </div>

      <div className="border rounded-lg print:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Ref</TableHead>
              <TableHead>No. Faktur</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Sales Agent</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Modal</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredContracts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  {searchQuery ? `Tidak ada kontrak yang ditemukan dengan kata kunci "${searchQuery}"` : "No contracts found"}
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
                  <TableRow 
                    key={contract.id}
                    ref={highlightedRowId === contract.id ? highlightedRowRef : null}
                    className={cn(
                      highlightedRowId === contract.id && "bg-yellow-100 border-yellow-300 animate-pulse"
                    )}
                  >
                    <TableCell className="font-medium">{contract.contract_ref}</TableCell>
                    <TableCell className="font-mono text-xs">{getNoFaktur(contract.id)}</TableCell>
                    <TableCell>{contract.customers?.name}</TableCell>
                    <TableCell>{salesAgents?.find(a => a.id === contract.sales_agent_id)?.name || "-"}</TableCell>
                    <TableCell>{contract.start_date ? formatDate(contract.start_date) : "-"}</TableCell>
                    <TableCell>{formatRupiah(contract.total_loan_amount)}</TableCell>
                    <TableCell>{formatRupiah(contract.omset || 0)}</TableCell>
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
            <div>
              <Label htmlFor="sales_agent">Sales Agent</Label>
              <Select
                value={formData.sales_agent_id}
                onValueChange={(v) => setFormData({ ...formData, sales_agent_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sales agent" />
                </SelectTrigger>
                <SelectContent>
                  {salesAgents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agent_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Komisi akan otomatis masuk ke sales ini
              </p>
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
                <Label htmlFor="total_loan_amount">{t("contracts.totalLoanAmount")}</Label>
                <CurrencyInput
                  id="total_loan_amount"
                  value={formData.total_loan_amount}
                  onValueChange={(val) => setFormData({ ...formData, total_loan_amount: val || 0 })}
                  placeholder="Rp 500.000"
                />
              </div>
              <div>
                <Label htmlFor="daily_installment_amount">{t("contracts.dailyInstallment")}</Label>
                <CurrencyInput
                  id="daily_installment_amount"
                  value={formData.daily_installment_amount || calculateInstallment()}
                  onValueChange={(val) => setFormData({ ...formData, daily_installment_amount: val || 0 })}
                  placeholder="Auto"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto: {formatRupiah(calculateInstallment())}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="modal">{t("contracts.modal", "Modal")}</Label>
              <CurrencyInput
                id="modal"
                value={formData.modal}
                onValueChange={(val) => setFormData({ ...formData, modal: val || 0 })}
                placeholder="Rp 0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("contracts.modalHint", "Modal awal untuk kontrak ini")}
              </p>
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
                    {paginatedCoupons?.map((coupon) => (
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
              
              {/* Coupons pagination */}
              {couponsTotalPages > 1 && (
                <div className="mt-2">
                  <TablePagination
                    currentPage={couponsPage}
                    totalPages={couponsTotalPages}
                    onPageChange={goToCouponsPage}
                    totalItems={totalCoupons}
                  />
                </div>
              )}
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
