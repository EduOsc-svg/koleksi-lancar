import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
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
import { useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday, Holiday } from "@/hooks/useHolidays";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export default function Holidays() {
  const { data: holidays, isLoading } = useHolidays();
  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday();
  const deleteHoliday = useDeleteHoliday();
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(holidays);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    holiday_date: "",
    description: "",
  });

  const handleOpenCreate = () => {
    setSelectedHoliday(null);
    setFormData({ holiday_date: "", description: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      holiday_date: holiday.holiday_date,
      description: holiday.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.holiday_date) {
      toast.error("Please select a date");
      return;
    }
    try {
      if (selectedHoliday) {
        await updateHoliday.mutateAsync({
          id: selectedHoliday.id,
          holiday_date: formData.holiday_date,
          description: formData.description || null,
        });
        toast.success("Holiday updated successfully");
      } else {
        await createHoliday.mutateAsync({
          holiday_date: formData.holiday_date,
          description: formData.description || null,
        });
        toast.success("Holiday added successfully");
      }
      setDialogOpen(false);
    } catch (error: any) {
      if (error?.message?.includes("duplicate")) {
        toast.error("This date is already marked as a holiday");
      } else {
        toast.error("Failed to save holiday");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedHoliday) return;
    try {
      await deleteHoliday.mutateAsync(selectedHoliday.id);
      toast.success("Holiday deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedHoliday(null);
    } catch (error) {
      toast.error("Failed to delete holiday");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Holidays</h2>
          <p className="text-muted-foreground">
            Manage dates that should be skipped during coupon generation
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Holiday
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : holidays?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No holidays defined. Add holidays to skip during coupon generation.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {holiday.holiday_date}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(holiday.holiday_date).toLocaleDateString("id-ID", { weekday: "long" })}
                  </TableCell>
                  <TableCell>{holiday.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(holiday)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedHoliday(holiday);
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
            <DialogTitle>{selectedHoliday ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="holiday_date">Date</Label>
              <Input
                id="holiday_date"
                type="date"
                value={formData.holiday_date}
                onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Christmas, New Year"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createHoliday.isPending || updateHoliday.isPending}>
              {selectedHoliday ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the holiday from the calendar. Existing coupons will not be affected.
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
