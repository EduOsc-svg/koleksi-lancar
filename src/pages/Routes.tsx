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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useRoutes,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  RouteWithCollector,
} from "@/hooks/useRoutes";
import { useSalesAgents } from "@/hooks/useSalesAgents";

export default function Routes() {
  const { data: routes, isLoading } = useRoutes();
  const { data: agents } = useSalesAgents();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithCollector | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    default_collector_id: null as string | null,
  });

  const handleOpenCreate = () => {
    setSelectedRoute(null);
    setFormData({ code: "", name: "", default_collector_id: null });
    setDialogOpen(true);
  };

  const handleOpenEdit = (route: RouteWithCollector) => {
    setSelectedRoute(route);
    setFormData({
      code: route.code,
      name: route.name,
      default_collector_id: route.default_collector_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedRoute) {
        await updateRoute.mutateAsync({ id: selectedRoute.id, ...formData });
        toast.success("Route updated successfully");
      } else {
        await createRoute.mutateAsync(formData);
        toast.success("Route created successfully");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save route");
    }
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    try {
      await deleteRoute.mutateAsync(selectedRoute.id);
      toast.success("Route deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete route. It may have associated customers.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Routes (Jalur)</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Route
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Default Collector</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : routes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No routes found
                </TableCell>
              </TableRow>
            ) : (
              routes?.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">{route.code}</TableCell>
                  <TableCell>{route.name}</TableCell>
                  <TableCell>{route.sales_agents?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(route)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedRoute(route);
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRoute ? "Edit Route" : "Add New Route"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Route Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., A1, B2"
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Route name / area"
              />
            </div>
            <div>
              <Label htmlFor="collector">Default Collector</Label>
              <Select
                value={formData.default_collector_id || "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, default_collector_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collector" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createRoute.isPending || updateRoute.isPending}>
              {selectedRoute ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Make sure no customers are assigned to this route.
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
