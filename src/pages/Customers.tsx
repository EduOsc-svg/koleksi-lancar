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
import { useRoutes } from "@/hooks/useRoutes";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export default function Customers() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { data: customers, isLoading } = useCustomers();
  const { data: agents } = useSalesAgents();
  const { data: routes } = useRoutes();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(customers, 5);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRelations | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    customer_code: "",
    nik: "",
    address: "",
    phone: "",
    route_id: "",
    assigned_sales_id: null as string | null,
  });

  // Handle highlighting item from global search
  useEffect(() => {
    if (highlightId && customers?.length) {
      const targetCustomer = customers.find(c => c.id === highlightId);
      if (targetCustomer) {
        setHighlightedRowId(highlightId);
        
        // Find the page where this customer is located
        const customerIndex = customers.findIndex(c => c.id === highlightId);
        const targetPage = Math.floor(customerIndex / 5) + 1;
        
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
  }, [highlightId, customers, currentPage, goToPage, searchParams, setSearchParams]);

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData({ name: "", customer_code: "", nik: "", address: "", phone: "", route_id: "", assigned_sales_id: null });
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
      route_id: customer.route_id,
      assigned_sales_id: customer.assigned_sales_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.route_id) {
      toast.error(t("customers.selectRoute"));
      return;
    }
    if (!formData.customer_code.trim()) {
      toast.error(t("errors.customerCodeRequired", "Masukkan kode pelanggan"));
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
    try {
      const submitData = {
        ...formData,
        customer_code: formData.customer_code.trim() || null,
        nik: formData.nik.trim(), // NIK is required, no fallback to null
      };
      if (selectedCustomer) {
        await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...submitData });
        toast.success(t("success.updated"));
      } else {
        await createCustomer.mutateAsync(submitData);
        toast.success(t("success.created"));
      }
      setDialogOpen(false);
    } catch (error: any) {
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        if (error?.message?.includes('nik') || error?.message?.includes('unique_nik')) {
          toast.error(t("errors.duplicateNik", "NIK sudah digunakan"));
        } else {
          toast.error(t("errors.duplicateCode", "Kode pelanggan sudah digunakan"));
        }
      } else if (error?.message?.includes('check_nik_format')) {
        toast.error(t("errors.nikMustBe16Digits", "NIK harus 16 digit"));
      } else {
        toast.error(t("errors.saveFailed"));
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customers.customerCode")}</TableHead>
              <TableHead>{t("customers.name")}</TableHead>
              <TableHead>{t("customers.nik")}</TableHead>
              <TableHead>{t("customers.route")}</TableHead>
              <TableHead>{t("customers.salesAgent")}</TableHead>
              <TableHead>{t("customers.phone")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">{t("common.loading")}</TableCell>
              </TableRow>
            ) : customers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((customer) => (
                <TableRow 
                  key={customer.id}
                  ref={highlightedRowId === customer.id ? highlightedRowRef : null}
                  className={cn(
                    highlightedRowId === customer.id && "bg-yellow-100 border-yellow-300 animate-pulse"
                  )}
                >
                  <TableCell>
                    <Badge variant="secondary">{customer.customer_code || "-"}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.nik || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.routes?.code}</Badge>
                  </TableCell>
                  <TableCell>
                    {customer.sales_agents?.name || "-"}
                  </TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell className="text-right">
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
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
                onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                placeholder="16 digit NIK"
                maxLength={16}
                className={formData.nik && formData.nik.length !== 16 ? "border-destructive" : ""}
                required
              />
              <p className={`text-xs mt-1 ${
                !formData.nik ? 'text-destructive' : 
                formData.nik.length === 16 ? 'text-green-600' : 
                'text-muted-foreground'
              }`}>
                {!formData.nik ? 'NIK wajib diisi (16 digit)' :
                 formData.nik.length === 16 ? '✓ NIK valid' :
                 `${formData.nik.length}/16 digit`}
              </p>
            </div>
            <div>
              <Label htmlFor="phone">{t("customers.phone")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("customers.phone")}
              />
            </div>
            <div>
              <Label htmlFor="route">{t("customers.route")} *</Label>
              <Select
                value={formData.route_id}
                onValueChange={(v) => setFormData({ ...formData, route_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("customers.selectRoute")} />
                </SelectTrigger>
                <SelectContent>
                  {routes?.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.code} - {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                placeholder={t("customers.address")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createCustomer.isPending || updateCustomer.isPending}>
              {selectedCustomer ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")} {t("customers.title")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("contracts.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
