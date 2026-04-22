import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Printer, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract, useInvoiceDetails, ContractWithCustomer } from "@/hooks/useContracts";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { useCollectors } from "@/hooks/useCollectors";
import { formatRupiah } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useCouponsByContract, useGenerateCoupons, InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import { SearchInput } from "@/components/ui/search-input";
import { PrintCoupon8x5 } from "@/components/print/PrintCoupon8x5";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';
import { CurrencyInput } from "@/components/ui/currency-input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Contracts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const newCustomerId = searchParams.get('newCustomerId');
  const { data: contracts, isLoading } = useContracts();
  const { data: invoiceDetails } = useInvoiceDetails();
  const { data: customers } = useCustomers();
  const { data: salesAgents } = useSalesAgents();
  const { data: collectors } = useCollectors();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const generateCoupons = useGenerateCoupons();
  const queryClient = useQueryClient();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  // Sort state for contracts
  const [contractSort, setContractSort] = useState<string>('start_newest');
  
  // Filter contracts based on search query
  // Only search by contract_ref and customer name to avoid confusion
  const filteredContracts = contracts?.filter(contract =>
    contract.contract_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contract.customers?.name && contract.customers.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const sortedContracts = (() => {
    const arr = [...filteredContracts];
    switch (contractSort) {
      case 'start_newest':
        return arr.sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime());
      case 'start_oldest':
        return arr.sort((a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime());
      case 'ref_asc':
        return arr.sort((a, b) => (a.contract_ref || '').localeCompare(b.contract_ref || ''));
      case 'ref_desc':
        return arr.sort((a, b) => (b.contract_ref || '').localeCompare(a.contract_ref || ''));
      case 'omset_desc':
        return arr.sort((a, b) => (Number(b.total_loan_amount || 0) - Number(a.total_loan_amount || 0)));
      case 'omset_asc':
        return arr.sort((a, b) => (Number(a.total_loan_amount || 0) - Number(b.total_loan_amount || 0)));
      default:
        return arr;
    }
  })();
  
  const ITEMS_PER_PAGE = 5;
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(sortedContracts, ITEMS_PER_PAGE);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithCustomer | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  
  // Combobox state for searchable dropdowns
  const [customerOpen, setCustomerOpen] = useState(false);
  const [salesAgentOpen, setSalesAgentOpen] = useState(false);
  const [collectorOpen, setCollectorOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    contract_ref: "",
    customer_id: "",
    sales_agent_id: "",
    collector_id: "",
    product_type: "",
    total_loan_amount: 0,
    tenor_days: "100",
    daily_installment_amount: 0,
    start_date: new Date().toISOString().split("T")[0],
    status: "active",
    modal: 0,
    dp: 0,
    keuntungan: 0,
  });

  // Fetch coupons for selected contract (for detail view and printing)
  const { data: selectedContractCoupons } = useCouponsByContract(selectedContract?.id || null);
  
  // Generate next contract code (A001, A002, etc.)
  const generateNextContractCode = () => {
    if (!contracts || contracts.length === 0) {
      return "A001";
    }
    
    // Extract all codes that match pattern A followed by digits
    const existingCodes = contracts
      .map(c => c.contract_ref)
      .filter(ref => /^A\d+$/.test(ref))
      .map(ref => parseInt(ref.substring(1), 10))
      .filter(num => !isNaN(num));
    
    if (existingCodes.length === 0) {
      return "A001";
    }
    
    const maxCode = Math.max(...existingCodes);
    const nextNumber = maxCode + 1;
    return `A${nextNumber.toString().padStart(3, '0')}`;
  };

  const [printMode, setPrintMode] = useState(false);
  const [tempPrintedCoupons, setTempPrintedCoupons] = useState<InstallmentCoupon[] | null>(null);
  const [tempPrintedContract, setTempPrintedContract] = useState<ContractWithCustomer | null>(null);

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

  // Auto-open create dialog with pre-selected customer from Customers page
  useEffect(() => {
    if (newCustomerId && customers?.length) {
      const customer = customers.find(c => c.id === newCustomerId);
      if (customer) {
        setSelectedContract(null);
        setFormData({
          contract_ref: generateNextContractCode(),
          customer_id: newCustomerId,
          sales_agent_id: "",
          collector_id: "",
          product_type: "",
          total_loan_amount: 0,
          tenor_days: "100",
          daily_installment_amount: 0,
          start_date: new Date().toISOString().split("T")[0],
          status: "active",
          modal: 0,
          dp: 0,
          keuntungan: 0,
        });
        setDialogOpen(true);
        // Remove param from URL
        searchParams.delete('newCustomerId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [newCustomerId, customers]);

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setFormData({
      contract_ref: generateNextContractCode(),
      customer_id: "",
      sales_agent_id: "",
      collector_id: "",
      product_type: "",
      total_loan_amount: 0,
      tenor_days: "100",
      daily_installment_amount: 0,
      start_date: new Date().toISOString().split("T")[0],
      status: "active",
      modal: 0,
      dp: 0,
      keuntungan: 0,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (contract: ContractWithCustomer) => {
    setSelectedContract(contract);
    setFormData({
      contract_ref: contract.contract_ref,
      customer_id: contract.customer_id,
      sales_agent_id: contract.sales_agent_id || "",
      collector_id: contract.collector_id || "",
      product_type: contract.product_type || "",
      total_loan_amount: contract.total_loan_amount,
      tenor_days: contract.tenor_days.toString(),
      daily_installment_amount: contract.daily_installment_amount,
      start_date: contract.start_date || new Date().toISOString().split("T")[0],
      status: contract.status,
      modal: (contract as any).omset || 0,
      dp: 0,
      keuntungan: (contract as any).keuntungan || 0,
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
    if (!selectedContract && !formData.sales_agent_id) {
      toast.error("Pilih sales agent terlebih dahulu");
      return;
    }
    if (!selectedContract && !formData.collector_id) {
      toast.error("Pilih kolektor terlebih dahulu");
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
          collector_id: formData.collector_id || null,
          product_type: formData.product_type || null,
          total_loan_amount: formData.total_loan_amount || 0,
          tenor_days: tenorDays,
          daily_installment_amount: dailyAmount,
          start_date: formData.start_date,
          status: formData.status,
            omset: Math.max(0, (formData.modal || 0) - (formData.dp || 0)),
            keuntungan: formData.keuntungan || 0,
        } as any);
      } else {
        const { data: newContract } = await createContract.mutateAsync({
          contract_ref: formData.contract_ref,
          customer_id: formData.customer_id,
          sales_agent_id: formData.sales_agent_id || null,
          collector_id: formData.collector_id || null,
          product_type: formData.product_type || null,
          total_loan_amount: formData.total_loan_amount || 0,
          tenor_days: tenorDays,
          daily_installment_amount: dailyAmount,
          start_date: formData.start_date,
          status: formData.status,
            omset: Math.max(0, (formData.modal || 0) - (formData.dp || 0)),
            keuntungan: formData.keuntungan || 0,
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

  // Create contract, generate coupons (if active) and immediately trigger print flow
  const handleCreateAndPrint = async () => {
    if (!formData.customer_id) {
      toast.error("Pilih pelanggan terlebih dahulu");
      return;
    }
    if (!formData.start_date) {
      toast.error("Pilih tanggal mulai terlebih dahulu");
      return;
    }
    if (!formData.sales_agent_id) {
      toast.error("Pilih sales agent terlebih dahulu");
      return;
    }
    if (!formData.collector_id) {
      toast.error("Pilih kolektor terlebih dahulu");
      return;
    }

    try {
      const dailyAmount = formData.daily_installment_amount || calculateInstallment();
      const tenorDays = parseInt(formData.tenor_days) || 100;

      const { data: newContract } = await createContract.mutateAsync({
        contract_ref: formData.contract_ref,
        customer_id: formData.customer_id,
        sales_agent_id: formData.sales_agent_id || null,
        collector_id: formData.collector_id || null,
        product_type: formData.product_type || null,
        total_loan_amount: formData.total_loan_amount || 0,
        tenor_days: tenorDays,
        daily_installment_amount: dailyAmount,
        start_date: formData.start_date,
        status: formData.status,
        omset: Math.max(0, (formData.modal || 0) - (formData.dp || 0)),
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

        console.log('create+generate: newContract ->', newContract);

          // Try to ensure coupons exist before triggering print.
          // We'll poll the installment_coupons table a few times and wait briefly.
          let couponsAvailable: any[] = [];
          try {
            const maxAttempts = 6;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              const { data: couponsData, error: fetchError } = await supabase
                .from('installment_coupons')
                .select('*')
                .eq('contract_id', newContract.id)
                .order('installment_index', { ascending: true });

              if (fetchError) {
                console.error('Error fetching coupons after generate:', fetchError);
                break;
              }

              console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for contract ${newContract.id}: found ${Array.isArray(couponsData) ? (couponsData as any[]).length : 0} coupons`);

              if (couponsData && (couponsData as any[]).length > 0) {
                couponsAvailable = couponsData as any[];
                break;
              }

              // wait 500ms before next attempt
              await new Promise((res) => setTimeout(res, 500));
            }
          } catch (e) {
            console.error('Polling for coupons failed', e);
          }

          // Fetch full contract with related customer/sales/collector so print has names & addresses
          let fullContract: ContractWithCustomer | null = null;
          try {
            const { data: contractFullData, error: contractFetchError } = await supabase
              .from('credit_contracts')
              .select('*, customers(name, address, business_address, phone), sales_agents(name, agent_code), collectors(name, collector_code)')
              .eq('id', newContract.id)
              .single();
            if (contractFetchError) {
              console.error('Failed to fetch full contract for printing:', contractFetchError);
            } else {
              fullContract = contractFullData as ContractWithCustomer;
            }
          } catch (e) {
            console.error('Error fetching full contract for printing', e);
          }

          // Close modal and set selected contract so print component can load coupons
          setDialogOpen(false);
          setSelectedContract((fullContract || newContract) as ContractWithCustomer);

          if (couponsAvailable.length === 0) {
            // If coupons still not available, inform the user but still keep contract selected.
            toast.warning('Kupon belum tersedia untuk dicetak. Coba cetak manual setelah beberapa saat.');
            // Also invalidate queries to ensure hook will refetch when user opens detail
            try { queryClient.invalidateQueries({ queryKey: ['installment_coupons', 'contract', newContract.id] }); } catch (e) { /* noop */ }
            return;
          }

          // Prime React Query cache for the coupons so useCouponsByContract sees them immediately
          try {
            queryClient.setQueryData(['installment_coupons', 'contract', newContract.id], couponsAvailable);
          } catch (e) {
            console.error('Failed to set query data for coupons:', e);
          }

          console.log('Coupons available after generate:', couponsAvailable.length, couponsAvailable?.slice?.(0,3));

          // Coupons are available — trigger print flow using enriched contract if available
          try {
            // Use direct print helper with the coupons we fetched to avoid race with hook state
            doPrint(couponsAvailable, (fullContract || newContract) as ContractWithCustomer);
          } catch (e) {
            console.error('Print trigger failed', e);
          }
          return;
      }

      toast.success("Kontrak berhasil dibuat");
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
    // Default print path uses currently loaded coupons from hook
    if (!selectedContractCoupons?.length) {
      toast.error("Tidak ada kupon untuk dicetak");
      return;
    }
    doPrint(selectedContractCoupons, selectedContract);
  };

  // Centralized print helper that accepts coupons + contract directly.
  const doPrint = (coupons: InstallmentCoupon[] | undefined | null, contract: ContractWithCustomer | null) => {
    if (!coupons || coupons.length === 0 || !contract) {
      console.error('doPrint called but coupons or contract missing', { coupons, contract });
      toast.error("Tidak ada kupon untuk dicetak");
      return;
    }

    // Deduplicate coupons by id (defensive) and sort by installment_index
    const uniqueMap = new Map<string, InstallmentCoupon>();
    (coupons || []).forEach((c) => {
      if (c && c.id) uniqueMap.set(c.id, c);
    });
    const uniqueCoupons = Array.from(uniqueMap.values()).sort((a, b) => (a.installment_index || 0) - (b.installment_index || 0));

    console.info('doPrint: deduped coupons count', uniqueCoupons.length);
    console.debug('doPrint: sample coupons', uniqueCoupons.slice(0,3));

    // Show instruction to user
    toast.info("Pastikan print dialog menggunakan orientasi Landscape dan ukuran A4", {
      duration: 4000,
    });

    // Use temporary state so PrintCoupon8x5 can render the coupons immediately
  setTempPrintedCoupons(uniqueCoupons as InstallmentCoupon[]);
    setTempPrintedContract(contract);
    setPrintMode(true);

    // Force add print styles for landscape
    const printStyleId = 'force-landscape-print';
    const existingStyle = document.getElementById(printStyleId);
    if (existingStyle) existingStyle.remove();

    const printStyle = document.createElement('style');
    printStyle.id = printStyleId;
    printStyle.textContent = `
      @media print {
        @page { 
          size: A4 landscape; 
          margin: 0; 
        }
        html, body { 
          width: 297mm; 
          margin: 0; 
          padding: 0;
          background: white !important;
        }
        body > *:not(.print-coupon-wrapper) {
          display: none !important;
        }
        .print-coupon-wrapper {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    // Add class to body for print mode
    document.body.classList.add('printing-coupons');

    // Give more time for the component to render via portal
    setTimeout(() => {
      console.log("Triggering print dialog with A4 landscape settings (direct)");
      window.print();

      // Clean up after printing with onafterprint or timeout
      const cleanup = () => {
        setPrintMode(false);
        setTempPrintedCoupons(null);
        setTempPrintedContract(null);
        document.body.classList.remove('printing-coupons');
        const style = document.getElementById(printStyleId);
        if (style) style.remove();
      };

      // Listen for print dialog close
      window.addEventListener('afterprint', cleanup, { once: true });

      // Fallback cleanup after delay
      setTimeout(cleanup, 2000);
    }, 500);
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

      {printMode && tempPrintedContract && tempPrintedCoupons && (
        <PrintCoupon8x5
          coupons={tempPrintedCoupons}
          contract={{
            contract_ref: tempPrintedContract.contract_ref,
            tenor_days: tempPrintedContract.tenor_days,
            customers: tempPrintedContract.customers ? {
              name: tempPrintedContract.customers.name,
              address: tempPrintedContract.customers.address || null,
              business_address: tempPrintedContract.customers.business_address || null,
              phone: tempPrintedContract.customers.phone || null,
            } : null,
            sales_agents: tempPrintedContract.sales_agents || null,
            collectors: tempPrintedContract.collectors || null,
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
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select onValueChange={(v) => setContractSort(v)} defaultValue={contractSort}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start_newest">Mulai: Terbaru</SelectItem>
                <SelectItem value="start_oldest">Mulai: Terlama</SelectItem>
                <SelectItem value="ref_asc">Kode Kontrak A → Z</SelectItem>
                <SelectItem value="ref_desc">Kode Kontrak Z → A</SelectItem>
                <SelectItem value="omset_desc">Omset Tertinggi</SelectItem>
                <SelectItem value="omset_asc">Omset Terendah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
              <TableHead>Kode Sales</TableHead>
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
                    <TableCell>{salesAgents?.find(a => a.id === contract.sales_agent_id)?.agent_code || "-"}</TableCell>
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

      {/* Create/Edit Dialog - Enhanced with Scrolling Mechanism */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>{selectedContract ? "Edit Kontrak" : "Kontrak Kredit Baru"}</DialogTitle>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contract_ref">Kode Kontrak</Label>
                    <Input
                      id="contract_ref"
                      value={formData.contract_ref}
                      onChange={(e) => setFormData({ ...formData, contract_ref: e.target.value.toUpperCase() })}
                      placeholder="Contoh: A001"
                    />
                    {!selectedContract && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Kode otomatis: A001, A002, dst.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customer">Pelanggan</Label>
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={customerOpen}
                          className="w-full justify-between font-normal"
                        >
                          {formData.customer_id
                            ? customers?.find((c) => c.id === formData.customer_id)?.name
                            : "Cari pelanggan..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Ketik nama pelanggan..." />
                          <CommandList>
                            <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {customers?.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => {
                                    setFormData({ ...formData, customer_id: customer.id });
                                    setCustomerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.customer_id === customer.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {customer.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="sales_agent">Sales Agent</Label>
                  <Popover open={salesAgentOpen} onOpenChange={setSalesAgentOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={salesAgentOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.sales_agent_id
                          ? (() => {
                              const agent = salesAgents?.find((a) => a.id === formData.sales_agent_id);
                              return agent ? `${agent.name} (${agent.agent_code})` : "Cari sales agent...";
                            })()
                          : "Cari sales agent..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Ketik nama atau kode agent..." />
                        <CommandList>
                          <CommandEmpty>Sales agent tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {salesAgents?.map((agent) => (
                              <CommandItem
                                key={agent.id}
                                value={`${agent.name} ${agent.agent_code}`}
                                onSelect={() => {
                                  setFormData({ ...formData, sales_agent_id: agent.id });
                                  setSalesAgentOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.sales_agent_id === agent.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {agent.name} ({agent.agent_code})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Komisi akan otomatis masuk ke sales ini
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="collector">Kolektor</Label>
                  <Popover open={collectorOpen} onOpenChange={setCollectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={collectorOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.collector_id
                          ? (() => {
                              const collector = collectors?.find((c) => c.id === formData.collector_id);
                              return collector ? `${collector.name} (${collector.collector_code})` : "Cari kolektor...";
                            })()
                          : "Cari kolektor..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Ketik nama atau kode kolektor..." />
                        <CommandList>
                          <CommandEmpty>Kolektor tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {collectors?.map((collector) => (
                              <CommandItem
                                key={collector.id}
                                value={`${collector.name} ${collector.collector_code}`}
                                onSelect={() => {
                                  setFormData({ ...formData, collector_id: collector.id });
                                  setCollectorOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.collector_id === collector.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {collector.name} ({collector.collector_code})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kode kolektor akan tampil pada No Faktur kupon
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
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="product_type">Jenis Produk</Label>
                    <Textarea
                      id="product_type"
                      value={formData.product_type}
                      onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                      placeholder="Contoh: Elektronik"
                      className="max-h-40 resize-y overflow-auto"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Tuliskan jenis produk. Jika panjang, kotak ini dapat digulir.</p>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modal">Modal Awal</Label>
                    <CurrencyInput
                      id="modal"
                      value={formData.modal}
                      onValueChange={(val) => setFormData({ ...formData, modal: val || 0 })}
                      placeholder="Rp 0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Modal awal sebelum dikurangi DP
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="dp">DP (Down Payment)</Label>
                    <CurrencyInput
                      id="dp"
                      value={formData.dp}
                      onValueChange={(val) => setFormData({ ...formData, dp: val || 0 })}
                      placeholder="Rp 0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Modal efektif: {formatRupiah(Math.max(0, (formData.modal || 0) - (formData.dp || 0)))}
                    </p>
                  </div>
                </div>
                  <div>
                    <Label htmlFor="keuntungan">Keuntungan (opsional)</Label>
                    <CurrencyInput
                      id="keuntungan"
                      value={formData.keuntungan}
                      onValueChange={(val) => setFormData({ ...formData, keuntungan: val || 0 })}
                      placeholder="Rp 0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Jika tidak diisi, keuntungan akan dihitung otomatis dari Omset - Modal Efektif
                    </p>
                  </div>
            </div>
          </div>
          
          <DialogFooter className="shrink-0 p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            {/** New combined action: create+generate+print */}
            {!selectedContract && (
              <Button
                variant="secondary"
                onClick={handleCreateAndPrint}
                disabled={createContract.isPending || generateCoupons.isPending}
                className="mr-2"
              >
                <Printer className="mr-2 h-4 w-4" />
                Buat & Cetak Kupon
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={createContract.isPending || updateContract.isPending || generateCoupons.isPending}>
              {selectedContract ? "Perbarui" : "Buat & Generate Kupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog - Progress & Info */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>Detail Kontrak: {selectedContract?.contract_ref}</DialogTitle>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-6 pb-4">
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
                    <>
                      {/* Customer & Contract Info */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Pelanggan</p>
                          <p className="font-medium">
                            {selectedContract.customers?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">No. Faktur</p>
                          <p className="font-medium font-mono">{getNoFaktur(selectedContract.id)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sales Agent</p>
                          <p className="font-medium">
                            {salesAgents?.find(a => a.id === selectedContract.sales_agent_id)?.name || "-"}
                            {(() => {
                              const agent = salesAgents?.find(a => a.id === selectedContract.sales_agent_id);
                              return agent?.agent_code ? <span className="ml-2 text-muted-foreground">({agent.agent_code})</span> : null;
                            })()}
                          </p>
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
                            <p className="text-sm text-muted-foreground">Keuntungan</p>
                            <p className="font-semibold text-lg">{formatRupiah((selectedContract as any).keuntungan || ((selectedContract.total_loan_amount || 0) - (selectedContract.omset || 0)))}</p>
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

                      {/* Customer Contracts Table - show all contracts for this customer with payment summary */}
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-3">Daftar Kontrak Pelanggan</h4>
                        {(() => {
                          const customerContracts = (contracts || []).filter(c => c.customer_id === selectedContract.customer_id);
                          if (!customerContracts || customerContracts.length === 0) {
                            return <div className="text-sm text-muted-foreground">Tidak ada kontrak lain untuk pelanggan ini.</div>;
                          }

                          return (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                      <TableHead className="text-sm">Kode</TableHead>
                                      <TableHead className="text-sm">Mulai</TableHead>
                                      <TableHead className="text-sm text-right">Tenor</TableHead>
                                      <TableHead className="text-sm text-right">Cicilan/Hari</TableHead>
                                      <TableHead className="text-sm text-center">Terbayar</TableHead>
                                      <TableHead className="text-sm text-center">Belum</TableHead>
                                      <TableHead className="text-sm text-right">Sisa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {customerContracts.map((c) => {
                                    const paidCount = c.current_installment_index || 0;
                                    const totalCount = c.tenor_days || 0;
                                    const unpaidCount = Math.max(0, totalCount - paidCount);
                                    const perInstallment = c.daily_installment_amount || (c.total_loan_amount && totalCount ? Math.ceil(c.total_loan_amount / totalCount) : 0);
                                    const remainingAmount = unpaidCount * perInstallment;

                                    return (
                                      <TableRow key={c.id} className="hover:bg-muted/30">
                                        <TableCell className="py-2 text-sm font-medium">{c.contract_ref}</TableCell>
                                        <TableCell className="py-2 text-sm">{c.start_date ? new Date(c.start_date).toLocaleDateString('id-ID') : '-'}</TableCell>
                                        <TableCell className="py-2 text-right text-sm">{totalCount} hari</TableCell>
                                        <TableCell className="py-2 text-right text-sm">{formatRupiah(perInstallment)}</TableCell>
                                        <TableCell className="py-2 text-center text-sm">{paidCount}</TableCell>
                                        <TableCell className="py-2 text-center text-sm">{unpaidCount}</TableCell>
                                        <TableCell className="py-2 text-right text-sm">{formatRupiah(remainingAmount)}</TableCell>
                                        {/* aksi column removed */}
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          );
                        })()}
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
                    </>
                  );
                })()}
              </div>
          </div>
          
          <div className="shrink-0 p-6 pt-4 border-t flex justify-end">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Tutup</Button>
          </div>
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