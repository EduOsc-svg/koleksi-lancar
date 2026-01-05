import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
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
import { toast } from "sonner";
import {
  useRoutes,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  RouteWithSales,
} from "@/hooks/useRoutes";
import { useSalesAgents } from "@/hooks/useSalesAgents";

// Hook to get only collectors (agent_code starts with 'K')
const useCollectors = () => {
  const { data: agents, ...rest } = useSalesAgents();
  const collectors = agents?.filter(agent => agent.agent_code.startsWith('K'));
  return { data: collectors, ...rest };
};
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export default function Routes() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { data: routes, isLoading } = useRoutes();
  const { data: collectors } = useCollectors();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(routes, 5);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithSales | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    default_collector_id: null as string | null,
  });

  // Handle highlighting item from global search
  useEffect(() => {
    if (highlightId && routes?.length) {
      const targetRoute = routes.find(r => r.id === highlightId);
      if (targetRoute) {
        setHighlightedRowId(highlightId);
        
        // Find the page where this route is located
        const routeIndex = routes.findIndex(r => r.id === highlightId);
        const targetPage = Math.floor(routeIndex / 5) + 1;
        
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
  }, [highlightId, routes, currentPage, goToPage, searchParams, setSearchParams]);

  const handleOpenCreate = () => {
    setSelectedRoute(null);
    setFormData({ code: "", name: "", default_collector_id: null });
    setDialogOpen(true);
  };

  const handleOpenEdit = (route: RouteWithSales) => {
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
        toast.success(t("success.updated"));
      } else {
        await createRoute.mutateAsync(formData);
        toast.success(t("success.created"));
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(t("errors.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!selectedRoute) return;
    try {
      await deleteRoute.mutateAsync(selectedRoute.id);
      toast.success(t("success.deleted"));
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t("errors.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("routes.title")}</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("routes.newRoute")}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("routes.code")}</TableHead>
              <TableHead>{t("routes.name")}</TableHead>
              <TableHead>{t("routes.defaultCollector")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">{t("common.loading")}</TableCell>
              </TableRow>
            ) : routes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((route) => (
                <TableRow 
                  key={route.id}
                  ref={highlightedRowId === route.id ? highlightedRowRef : null}
                  className={cn(
                    highlightedRowId === route.id && "bg-yellow-100 border-yellow-300 animate-pulse"
                  )}
                >
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
            <DialogTitle>{selectedRoute ? t("routes.editRoute") : t("routes.newRoute")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">{t("routes.code")}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., A1, B2"
              />
            </div>
            <div>
              <Label htmlFor="name">{t("routes.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("routes.name")}
              />
            </div>
            <div>
              <Label htmlFor="collector">{t("routes.defaultCollector")}</Label>
              <Select
                value={formData.default_collector_id || "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, default_collector_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("routes.selectCollector")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {collectors?.map((collector) => (
                    <SelectItem key={collector.id} value={collector.id}>
                      {collector.name} ({collector.agent_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createRoute.isPending || updateRoute.isPending}>
              {selectedRoute ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")} {t("routes.title")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("routes.deleteWarning", "Pastikan tidak ada pelanggan yang terhubung ke jalur ini.")}
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
