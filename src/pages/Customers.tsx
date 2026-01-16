import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  CustomerWithRelations,
} from "@/hooks/useCustomers";
import { useSalesAgents } from "@/hooks/useSalesAgents";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { SearchInput } from "@/components/ui/search-input";

export default function Customers() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { data: customers, isLoading } = useCustomers();
  const { data: agents } = useSalesAgents();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  
  // Filter customers based on search query
  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.nik?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.address?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(filteredCustomers, 5);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRelations | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    customer_code: "",
    nik: "",
    address: "",
    phone: "",
    assigned_sales_id: null as string | null,
  });

  // Handle highlighting item from global search
  useEffect(() => {
    if (highlightId && customers?.length) {
      const targetCustomer = customers.find(c => c.id === highlightId);
      if (targetCustomer) {
        setHighlightedRowId(highlightId);
        
        // Find the page where this customer is located in filtered results
        const customerIndex = filteredCustomers.findIndex(c => c.id === highlightId);
        if (customerIndex === -1) {
          // Customer not found in filtered results, clear search to show all
          setSearchQuery("");
          // Use original customers array if not found in filtered results
          const originalIndex = customers.findIndex(c => c.id === highlightId);
          const targetPage = Math.floor(originalIndex / 5) + 1;
          if (targetPage !== currentPage) {
            goToPage(targetPage);
          }
        } else {
          const targetPage = Math.floor(customerIndex / 5) + 1;
          // Navigate to the correct page
          if (targetPage !== currentPage) {
            goToPage(targetPage);
          }
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
  }, [highlightId, customers, filteredCustomers, currentPage, goToPage, searchParams, setSearchParams, setSearchQuery]);

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData({ name: "", customer_code: "", nik: "", address: "", phone: "", assigned_sales_id: null });
    setDialogOpen(true);
  };

  const handleOpenEdit = (customer: CustomerWithRelations) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      customer_code: customer.customer_code || "",
      nik: customer.nik || "",
      address: customer.address || "",
      phone: customer.phone || "",
      assigned_sales_id: customer.assigned_sales_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.customer_code.trim()) {
      toast.error(t("errors.customerCodeRequired", "Kode customer wajib diisi"));
      return;
    }
    if (!formData.name.trim()) {
      toast.error(t("errors.nameRequired", "Nama customer wajib diisi"));
      return;
    }
    if (!formData.nik.trim()) {
      toast.error(t("errors.nikRequired", "NIK wajib diisi"));
      return;
    }
    if (formData.nik.trim().length !== 16) {
      toast.error(t("errors.nikMustBe16Digits", "NIK harus 16 digit"));
      return;
    }
    
    // Validate NIK contains only numbers
    if (!/^\d{16}$/.test(formData.nik.trim())) {
      toast.error("NIK harus berisi 16 digit angka");
      return;
    }
    
    // Validate phone number format if provided
    if (formData.phone && formData.phone.trim() && !/^[\d\+\-\s\(\)]+$/.test(formData.phone.trim())) {
      toast.error("Format nomor telepon tidak valid");
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        customer_code: formData.customer_code.trim().toUpperCase(),
        name: formData.name.trim(),
        nik: formData.nik.trim(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
      };
      
      if (selectedCustomer) {
        await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...submitData });
        toast.success(t("success.updated", "Data berhasil diperbarui"));
      } else {
        await createCustomer.mutateAsync(submitData);
        toast.success(t("success.created", "Customer berhasil ditambahkan"));
      }
      setDialogOpen(false);
    } catch (error: any) {
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        if (error?.message?.includes('nik') || error?.message?.includes('unique_nik')) {
          toast.error("NIK sudah digunakan oleh customer lain");
        } else {
          toast.error("Kode customer sudah digunakan");
        }
      } else if (error?.message?.includes('check_nik_format')) {
        toast.error("NIK harus berisi 16 digit angka");
      } else {
        toast.error("Gagal menyimpan data. Silakan coba lagi.");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer.mutateAsync(selectedCustomer.id);
      toast.success(t("success.deleted"));
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t("errors.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("customers.title")}</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("customers.newCustomer")}
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex justify-between items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari customer berdasarkan nama, kode, NIK, telepon, atau alamat..."
          className="max-w-lg"
          onClear={() => setSearchQuery("")}
        />
        <div className="text-sm text-gray-500">
          {searchQuery ? (
            <span>
              Ditemukan <strong>{totalItems}</strong> dari {customers?.length || 0} customer
            </span>
          ) : (
            <span>
              Total <strong>{customers?.length || 0}</strong> customer
            </span>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">{t("customers.customerCode")}</TableHead>
                <TableHead className="min-w-[200px]">{t("customers.name")}</TableHead>
                <TableHead className="min-w-[140px]">{t("customers.nik")}</TableHead>
                <TableHead className="min-w-[150px]">{t("customers.salesAgent")}</TableHead>
                <TableHead className="min-w-[130px]">{t("customers.phone")}</TableHead>
                <TableHead className="text-right min-w-[100px]">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">{t("common.loading")}</TableCell>
                </TableRow>
              ) : filteredCustomers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchQuery ? `Tidak ada customer yang ditemukan dengan kata kunci "${searchQuery}"` : t("common.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    ref={highlightedRowId === customer.id ? highlightedRowRef : null}
                    className={cn(
                      "hover:bg-muted/50",
                      highlightedRowId === customer.id && "bg-yellow-100 border-yellow-300 animate-pulse"
                    )}
                  >
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {customer.customer_code || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {customer.nik || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {customer.sales_agents?.name ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.sales_agents.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {customer.sales_agents.agent_code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? t("customers.editCustomer") : t("customers.newCustomer")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_code">{t("customers.customerCode")} *</Label>
              <Input
                id="customer_code"
                value={formData.customer_code}
                onChange={(e) => setFormData({ ...formData, customer_code: e.target.value.toUpperCase() })}
                placeholder="e.g., C001"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="name">{t("customers.name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("customers.name")}
              />
            </div>
            <div>
              <Label htmlFor="nik">{t("customers.nik")} *</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => {
                  // Only allow numbers and limit to 16 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setFormData({ ...formData, nik: value });
                }}
                placeholder="Masukkan 16 digit NIK"
                maxLength={16}
                pattern="[0-9]{16}"
                className={cn(
                  formData.nik && formData.nik.length !== 16 && "border-destructive focus:border-destructive"
                )}
                required
              />
              <p className={cn(
                "text-xs mt-1",
                !formData.nik ? 'text-destructive' : 
                formData.nik.length === 16 ? 'text-green-600' : 
                'text-muted-foreground'
              )}>
                {!formData.nik ? 'NIK wajib diisi (16 digit angka)' :
                 formData.nik.length === 16 ? '✓ NIK valid (16 digit)' :
                 `${formData.nik.length}/16 digit`}
              </p>
            </div>
            <div>
              <Label htmlFor="phone">{t("customers.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  // Allow numbers, +, -, spaces, and parentheses
                  const value = e.target.value.replace(/[^\d\+\-\s\(\)]/g, '');
                  setFormData({ ...formData, phone: value });
                }}
                placeholder="e.g., 08123456789"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="agent">{t("customers.salesAgent")}</Label>
              <Select
                value={formData.assigned_sales_id || "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, assigned_sales_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("customers.selectAgent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agent_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">{t("customers.address")}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Masukkan alamat lengkap customer..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel", "Batal")}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createCustomer.isPending || updateCustomer.isPending}
              className="min-w-[80px]"
            >
              {createCustomer.isPending || updateCustomer.isPending 
                ? "..." 
                : selectedCustomer 
                  ? t("common.save", "Simpan") 
                  : t("common.create", "Tambah")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus customer "{selectedCustomer?.name}"? 
              <br />
              <strong className="text-destructive">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomer.isPending}
            >
              {deleteCustomer.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}