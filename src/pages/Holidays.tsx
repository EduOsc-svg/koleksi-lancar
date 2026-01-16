import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday, Holiday } from "@/hooks/useHolidays";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";

type HolidayType = 'specific_date' | 'recurring_weekday';

export default function Holidays() {
  const { t } = useTranslation();
  const { data: holidays, isLoading } = useHolidays();
  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday();
  const deleteHoliday = useDeleteHoliday();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter holidays based on search query
  const filteredHolidays = holidays?.filter(holiday =>
    holiday.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (holiday.holiday_date && holiday.holiday_date.includes(searchQuery)) ||
    (holiday.day_of_week !== null && DAY_NAMES[holiday.day_of_week].toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  const ITEMS_PER_PAGE = 10;
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(filteredHolidays, ITEMS_PER_PAGE);

  const DAY_NAMES = [
    t("holidays.sunday"),
    t("holidays.monday"),
    t("holidays.tuesday"),
    t("holidays.wednesday"),
    t("holidays.thursday"),
    t("holidays.friday"),
    t("holidays.saturday"),
  ];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<{
    holiday_type: HolidayType;
    holiday_date: string;
    day_of_week: number;
    description: string;
  }>({
    holiday_type: "specific_date",
    holiday_date: "",
    day_of_week: 0,
    description: "",
  });

  const handleOpenCreate = () => {
    setSelectedHoliday(null);
    setFormData({ 
      holiday_type: "specific_date", 
      holiday_date: "", 
      day_of_week: 0,
      description: "" 
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      holiday_type: holiday.holiday_type,
      holiday_date: holiday.holiday_date || "",
      day_of_week: holiday.day_of_week ?? 0,
      description: holiday.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (formData.holiday_type === "specific_date" && !formData.holiday_date) {
      toast.error(t("holidays.selectDate", "Pilih tanggal"));
      return;
    }
    try {
      const payload = formData.holiday_type === "specific_date" 
        ? {
            holiday_type: formData.holiday_type,
            holiday_date: formData.holiday_date,
            day_of_week: null,
            description: formData.description || null,
          }
        : {
            holiday_type: formData.holiday_type,
            holiday_date: null,
            day_of_week: formData.day_of_week,
            description: formData.description || null,
          };

      if (selectedHoliday) {
        await updateHoliday.mutateAsync({
          id: selectedHoliday.id,
          ...payload,
        });
        toast.success(t("success.updated"));
      } else {
        await createHoliday.mutateAsync(payload);
        toast.success(t("success.created"));
      }
      setDialogOpen(false);
    } catch (error: any) {
      if (error?.message?.includes("duplicate") || error?.message?.includes("unique")) {
        toast.error(formData.holiday_type === "specific_date" 
          ? t("errors.duplicateDate", "Tanggal ini sudah ditandai sebagai libur")
          : t("errors.duplicateDay", "Hari ini sudah diatur sebagai libur berulang"));
      } else {
        toast.error(t("errors.saveFailed"));
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedHoliday) return;
    try {
      await deleteHoliday.mutateAsync(selectedHoliday.id);
      toast.success(t("success.deleted"));
      setDeleteDialogOpen(false);
      setSelectedHoliday(null);
    } catch (error) {
      toast.error(t("errors.deleteFailed"));
    }
  };

  const getHolidayDisplayText = (holiday: Holiday) => {
    if (holiday.holiday_type === "recurring_weekday") {
      return t("holidays.everyWeek", { day: DAY_NAMES[holiday.day_of_week ?? 0] });
    }
    return holiday.holiday_date || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t("holidays.title")}</h2>
          <p className="text-muted-foreground">
            {t("holidays.subtitle", "Kelola tanggal yang dilewati saat pembuatan kupon")}
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("holidays.newHoliday")}
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex justify-between items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari holiday berdasarkan deskripsi, tanggal, atau hari..."
          className="max-w-md"
        />
        <div className="text-sm text-gray-500">
          Menampilkan {totalItems} dari {holidays?.length || 0} holiday
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("holidays.holidayType")}</TableHead>
              <TableHead>{t("holidays.date")} / {t("holidays.dayOfWeek")}</TableHead>
              <TableHead>{t("holidays.description")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">{t("common.loading")}</TableCell>
              </TableRow>
            ) : filteredHolidays?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {searchQuery ? `Tidak ada holiday yang ditemukan dengan kata kunci "${searchQuery}"` : t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell>
                    {holiday.holiday_type === "recurring_weekday" ? (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <RotateCcw className="h-3 w-3" /> {t("holidays.recurring")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Calendar className="h-3 w-3" /> {t("holidays.specificDate")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getHolidayDisplayText(holiday)}
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
            <DialogTitle>{selectedHoliday ? t("holidays.editHoliday") : t("holidays.newHoliday")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("holidays.holidayType")}</Label>
              <Select
                value={formData.holiday_type}
                onValueChange={(v: HolidayType) => setFormData({ ...formData, holiday_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specific_date">{t("holidays.specificDate")}</SelectItem>
                  <SelectItem value="recurring_weekday">{t("holidays.recurringWeekday")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.holiday_type === "specific_date" ? (
              <div>
                <Label htmlFor="holiday_date">{t("holidays.date")}</Label>
                <Input
                  id="holiday_date"
                  type="date"
                  value={formData.holiday_date}
                  onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                />
              </div>
            ) : (
              <div>
                <Label>{t("holidays.dayOfWeek")}</Label>
                <Select
                  value={String(formData.day_of_week)}
                  onValueChange={(v) => setFormData({ ...formData, day_of_week: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((day, index) => (
                      <SelectItem key={index} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="description">{t("holidays.description")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("holidays.descriptionPlaceholder", "e.g., Natal, Akhir Pekan")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createHoliday.isPending || updateHoliday.isPending}>
              {selectedHoliday ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")} {t("holidays.title")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("holidays.deleteWarning", "Ini akan menghapus libur dari kalender. Kupon yang sudah ada tidak akan terpengaruh.")}
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
