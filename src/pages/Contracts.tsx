import { useState, useEffect, useRef } from "react";
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
import { PrintCoupon8x5 } from "@/components/print/PrintCoupon8x5";
import { CurrencyInput } from "@/components/ui/currency-input";

export default function Contracts() {
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
    (contract.customers?.name && contract.customers.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
      toast.error("Pilih pelanggan terlebih dahulu");
      return;
    }
    if (!formData.start_date) {
      toast.error("Pilih tanggal mulai terlebih dahulu");
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
        toast.success("Kontrak berhasil diperbarui");
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
          toast.success(`Kontrak dibuat dengan ${tenorDays} kupon`);
        } else {
          toast.success("Kontrak berhasil dibuat");
        }
      }
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data");
    }
  };

  const handleDelete = async () => {
    if (!selectedContract) return;
    try {
      await deleteContract.mutateAsync(selectedContract.id);
      toast.success("Kontrak berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedContract(null);
    } catch (error) {
      toast.error("Gagal menghapus kontrak");
    }
  };

  const handlePrintAllCoupons = () => {
    if (!selectedContractCoupons?.length) {
      toast.error("Tidak ada kupon untuk dicetak");
      return;
    }
    
    console.log("Starting print mode with", selectedContractCoupons.length, "coupons");
    
    // Show instruction to user
    toast.info("Print dialog akan terbuka dengan setting A4 Landscape otomatis. Jika masih portrait, ubah ke Landscape di print dialog.", {
      duration: 3000,
    });
    
    setPrintMode(true);
    
    // Force add print styles for landscape
    const printStyleId = 'force-landscape-print';
    const existingStyle = document.getElementById(printStyleId);
    if (existingStyle) existingStyle.remove();
    
    const printStyle = document.createElement('style');
    printStyle.id = printStyleId;
    printStyle.textContent = `
      @media print {
        @page { size: A4 landscape; margin: 0mm; }
        body { width: 297mm; height: 210mm; margin: 0; padding: 0; }
        html { width: 297mm; height: 210mm; }
      }
    `;
    document.head.appendChild(printStyle);
    
    // Give more time for the component to render
    setTimeout(() => {
      console.log("Triggering print dialog with A4 landscape settings");
      window.print();
      
      // Clean up after printing
      setTimeout(() => {
        setPrintMode(false);
        const style = document.getElementById(printStyleId);
        if (style) style.remove();
      }, 1000);
    }, 800);
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
      {/* Print Mode: High Precision Coupon Print System */}
      {printMode && selectedContract && selectedContractCoupons && (
        <PrintCoupon8x5 
          coupons={selectedContractCoupons}
          contract={{
            contract_ref: selectedContract.contract_ref,
            tenor_days: selectedContract.tenor_days,
            daily_installment_amount: selectedContract.daily_installment_amount,
            customers: selectedContract.customers ? {
              name: selectedContract.customers.name,
              address: selectedContract.customers.address || null,
              sales_agents: selectedContract.customers.sales_agents || null,
            } : null,
          }}
        />
      )}

      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">Kontrak Kredit</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Kontrak Baru
        </Button>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari kontrak berdasarkan nomor kontrak atau nama pelanggan..."
          className="max-w-lg"
        />
        <div className="text-sm text-muted-foreground">
          Menampilkan {totalItems} dari {contracts?.length || 0} kontrak
        </div>
      </div>

      <div className="border rounded-lg print:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Kontrak</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Sales Agent</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Memuat...</TableCell>
                  </TableRow>
            ) : filteredContracts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? `Tidak ada kontrak yang ditemukan dengan kata kunci "${searchQuery}"` : "Tidak ada data kontrak"}
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
                  statusLabel = "Selesai";
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
                    <TableCell>{contract.customers?.name}</TableCell>
                    <TableCell>{salesAgents?.find(a => a.id === contract.sales_agent_id)?.name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {contract.current_installment_index}/{contract.tenor_days}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(contract)} title="Lihat Detail">
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
            <DialogTitle>{selectedContract ? "Edit Kontrak" : "Kontrak Kredit Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_ref">Kode Kontrak</Label>
                <Input
                  id="contract_ref"
                  value={formData.contract_ref}
                  onChange={(e) => setFormData({ ...formData, contract_ref: e.target.value })}
                  placeholder="Contoh: A4146"
                />
              </div>
              <div>
                <Label htmlFor="customer">Pelanggan</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(v) => setFormData({ ...formData, customer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pelanggan" />
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
                <Label htmlFor="start_date">Tanggal Mulai</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Kupon akan dibuat mulai dari tanggal ini
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
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_type">Jenis Produk</Label>
                <Input
                  id="product_type"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  placeholder="Contoh: Elektronik"
                />
              </div>
              <div>
                <Label htmlFor="tenor_days">Tenor (Hari)</Label>
                <Input
                  id="tenor_days"
                  type="number"
                  value={formData.tenor_days}
                  onChange={(e) => setFormData({ ...formData, tenor_days: e.target.value })}
                  placeholder="Contoh: 100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_loan_amount">Total Pinjaman</Label>
                <CurrencyInput
                  id="total_loan_amount"
                  value={formData.total_loan_amount}
                  onValueChange={(val) => setFormData({ ...formData, total_loan_amount: val || 0 })}
                  placeholder="Rp 500.000"
                />
              </div>
              <div>
                <Label htmlFor="daily_installment_amount">Cicilan Harian</Label>
                <CurrencyInput
                  id="daily_installment_amount"
                  value={formData.daily_installment_amount || calculateInstallment()}
                  onValueChange={(val) => setFormData({ ...formData, daily_installment_amount: val || 0 })}
                  placeholder="Otomatis"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Otomatis: {formatRupiah(calculateInstallment())}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="modal">Modal</Label>
              <CurrencyInput
                id="modal"
                value={formData.modal}
                onValueChange={(val) => setFormData({ ...formData, modal: val || 0 })}
                placeholder="Rp 0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Modal awal untuk kontrak ini
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={createContract.isPending || updateContract.isPending || generateCoupons.isPending}>
              {selectedContract ? "Perbarui" : "Buat & Generate Kupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog - Progress & Info */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Kontrak: {selectedContract?.contract_ref}</DialogTitle>
          </DialogHeader>
          {selectedContract && (() => {
            const progress = (selectedContract.current_installment_index / selectedContract.tenor_days) * 100;
            const paidAmount = selectedContract.current_installment_index * selectedContract.daily_installment_amount;
            const remainingAmount = (selectedContract.tenor_days - selectedContract.current_installment_index) * selectedContract.daily_installment_amount;
            const createdAt = new Date(selectedContract.created_at);
            const today = new Date();
            const daysElapsed = Math.max(1, Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
            const daysPerDue = selectedContract.current_installment_index > 0 
              ? (daysElapsed / selectedContract.current_installment_index).toFixed(1) 
              : "0";

            return (
              <div className="space-y-6">
                {/* Customer & Contract Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Pelanggan</p>
                    <p className="font-medium">{selectedContract.customers?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No. Faktur</p>
                    <p className="font-medium font-mono">{getNoFaktur(selectedContract.id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sales Agent</p>
                    <p className="font-medium">{salesAgents?.find(a => a.id === selectedContract.sales_agent_id)?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                    <p className="font-medium">{selectedContract.start_date ? formatDate(selectedContract.start_date) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jenis Produk</p>
                    <p className="font-medium">{selectedContract.product_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedContract.status === "active" ? "default" : "secondary"}>
                      {selectedContract.status === "active" ? "Aktif" : selectedContract.status}
                    </Badge>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pinjaman</p>
                    <p className="font-semibold text-lg">{formatRupiah(selectedContract.total_loan_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modal</p>
                    <p className="font-semibold text-lg">{formatRupiah(selectedContract.omset || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cicilan Harian</p>
                    <p className="font-medium">{formatRupiah(selectedContract.daily_installment_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenor</p>
                    <p className="font-medium">{selectedContract.tenor_days} hari</p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="p-4 border rounded-lg space-y-4">
                  <h4 className="font-semibold">Progress Pembayaran</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cicilan ke-{selectedContract.current_installment_index} dari {selectedContract.tenor_days}</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Terbayar</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">{formatRupiah(paidAmount)}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Sisa</p>
                      <p className="font-semibold text-orange-600 dark:text-orange-400">{formatRupiah(remainingAmount)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Rata-rata</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">{daysPerDue} hari/cicilan</p>
                    </div>
                  </div>
                </div>

                {/* Print Coupons Section */}
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Cetak Kupon</h4>
                    <p className="text-sm text-muted-foreground">{selectedContractCoupons?.length || 0} kupon tersedia</p>
                  </div>
                  <Button onClick={handlePrintAllCoupons} disabled={!selectedContractCoupons?.length}>
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Kupon (A4)
                  </Button>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kontrak?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua kupon yang terkait juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
