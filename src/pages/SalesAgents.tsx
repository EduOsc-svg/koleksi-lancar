import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import {
  useSalesAgents,
  useCreateSalesAgent,
  useUpdateSalesAgent,
  useDeleteSalesAgent,
  SalesAgent,
} from "@/hooks/useSalesAgents";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export default function SalesAgents() {
  const { data: agents, isLoading } = useSalesAgents();
  const createAgent = useCreateSalesAgent();
  const updateAgent = useUpdateSalesAgent();
  const deleteAgent = useDeleteSalesAgent();
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(agents);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<SalesAgent | null>(null);
  const [formData, setFormData] = useState({ agent_code: "", name: "", phone: "" });

  const handleOpenCreate = () => {
    setSelectedAgent(null);
    setFormData({ agent_code: "", name: "", phone: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (agent: SalesAgent) => {
    setSelectedAgent(agent);
    setFormData({
      agent_code: agent.agent_code,
      name: agent.name,
      phone: agent.phone || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedAgent) {
        await updateAgent.mutateAsync({ id: selectedAgent.id, ...formData });
        toast.success("Sales agent updated successfully");
      } else {
        await createAgent.mutateAsync(formData);
        toast.success("Sales agent created successfully");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save sales agent");
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    try {
      await deleteAgent.mutateAsync(selectedAgent.id);
      toast.success("Sales agent deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete sales agent");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Agents</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Agent
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : agents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No sales agents found
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.agent_code}</TableCell>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(agent)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedAgent(agent);
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
            <DialogTitle>{selectedAgent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent_code">Agent Code</Label>
              <Input
                id="agent_code"
                value={formData.agent_code}
                onChange={(e) => setFormData({ ...formData, agent_code: e.target.value })}
                placeholder="e.g., S, B, D"
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createAgent.isPending || updateAgent.isPending}>
              {selectedAgent ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agent.
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
