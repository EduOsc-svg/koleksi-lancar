import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  const { data: customers, isLoading } = useCustomers();
  const { data: agents } = useSalesAgents();
  const { data: routes } = useRoutes();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(customers);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRelations | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    customer_code: "",
    address: "",
    phone: "",
    route_id: "",
    assigned_sales_id: null as string | null,
  });

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData({ name: "", customer_code: "", address: "", phone: "", route_id: "", assigned_sales_id: null });
    setDialogOpen(true);
  };

  const handleOpenEdit = (customer: CustomerWithRelations) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      customer_code: customer.customer_code || "",
      address: customer.address || "",
      phone: customer.phone || "",
      route_id: customer.route_id,
      assigned_sales_id: customer.assigned_sales_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.route_id) {
      toast.error("Please select a route");
      return;
    }
    if (!formData.customer_code.trim()) {
      toast.error("Please enter a customer code");
      return;
    }
    try {
      const submitData = {
        ...formData,
        customer_code: formData.customer_code.trim() || null,
      };
      if (selectedCustomer) {
        await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...submitData });
        toast.success("Customer updated successfully");
      } else {
        await createCustomer.mutateAsync(submitData);
        toast.success("Customer created successfully");
      }
      setDialogOpen(false);
    } catch (error: any) {
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        toast.error("Customer code already exists. Please use a unique code.");
      } else {
        toast.error("Failed to save customer");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer.mutateAsync(selectedCustomer.id);
      toast.success("Customer deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete customer. They may have contracts.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Sales Agent</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : customers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Badge variant="secondary">{customer.customer_code || "-"}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer_code">Customer Code *</Label>
              <Input
                id="customer_code"
                value={formData.customer_code}
                onChange={(e) => setFormData({ ...formData, customer_code: e.target.value.toUpperCase() })}
                placeholder="e.g., C001"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">Unique identifier for the customer</p>
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="route">Route (Jalur) *</Label>
              <Select
                value={formData.route_id}
                onValueChange={(v) => setFormData({ ...formData, route_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
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
              <Label htmlFor="agent">Sales Agent</Label>
              <Select
                value={formData.assigned_sales_id || "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, assigned_sales_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.agent_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createCustomer.isPending || updateCustomer.isPending}>
              {selectedCustomer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Make sure they have no active contracts.
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
