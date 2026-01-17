import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Plus, Download, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";

import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import {
  useCollectors,
  useCreateCollector,
  useUpdateCollector,
  useDeleteCollector,
  Collector,
} from "@/hooks/useCollectors";

const ITEMS_PER_PAGE = 10;

export default function Collectors() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlightId");

  const { data: collectors, isLoading } = useCollectors();
  const createCollector = useCreateCollector();
  const updateCollector = useUpdateCollector();
  const deleteCollector = useDeleteCollector();

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    collector_code: "",
    name: "",
    phone: "",
  });

  // Filter collectors based on search query
  const filteredCollectors = collectors?.filter((collector) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collector.name.toLowerCase().includes(query) ||
      collector.collector_code.toLowerCase().includes(query) ||
      collector.phone?.toLowerCase().includes(query)
    );
  }) || [];

  // Pagination
  const {
    paginatedItems,
    currentPage,
    goToPage,
    totalPages,
    totalItems,
  } = usePagination(filteredCollectors, ITEMS_PER_PAGE);

  // Highlight effect for navigation from other pages
  useEffect(() => {
    if (highlightId && collectors) {
      setHighlightedRow(highlightId);
      const element = document.getElementById(`collector-row-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const timer = setTimeout(() => setHighlightedRow(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId, collectors]);

  const handleOpenCreate = () => {
    setFormData({ collector_code: "", name: "", phone: "" });
    setSelectedCollector(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (collector: Collector) => {
    setFormData({
      collector_code: collector.collector_code,
      name: collector.name,
      phone: collector.phone || "",
    });
    setSelectedCollector(collector);
    setDialogOpen(true);
  };

  const handleOpenDelete = (collector: Collector) => {
    setSelectedCollector(collector);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.collector_code.trim() || !formData.name.trim()) {
      toast.error("Kode dan nama kolektor wajib diisi");
      return;
    }

    try {
      if (selectedCollector) {
        await updateCollector.mutateAsync({
          id: selectedCollector.id,
          ...formData,
          phone: formData.phone || null,
        });
        toast.success("Kolektor berhasil diperbarui");
      } else {
        await createCollector.mutateAsync({
          ...formData,
          phone: formData.phone || null,
        });
        toast.success("Kolektor berhasil ditambahkan");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan data kolektor");
    }
  };

  const handleDelete = async () => {
    if (!selectedCollector) return;

    try {
      await deleteCollector.mutateAsync(selectedCollector.id);
      toast.success("Kolektor berhasil dihapus");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus kolektor");
    }
  };

  const handleExportExcel = async () => {
    if (!collectors || collectors.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Kolektor");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Kode Kolektor", key: "collector_code", width: 15 },
      { header: "Nama", key: "name", width: 30 },
      { header: "No. Telepon", key: "phone", width: 20 },
      { header: "Tanggal Dibuat", key: "created_at", width: 20 },
    ];

    // Style header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    });

    collectors.forEach((collector, index) => {
      worksheet.addRow({
        no: index + 1,
        collector_code: collector.collector_code,
        name: collector.name,
        phone: collector.phone || "-",
        created_at: new Date(collector.created_at).toLocaleDateString("id-ID"),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kolektor_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("Master Kolektor", "Master Kolektor")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Kolektor Baru
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari kolektor berdasarkan nama, kode, atau telepon..."
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          Menampilkan {totalItems} dari {collectors?.length || 0} kolektor
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>No. Telepon</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {searchQuery
                    ? `Tidak ada kolektor dengan kata kunci "${searchQuery}"`
                    : "Belum ada data kolektor"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((collector, index) => (
                <TableRow
                  key={collector.id}
                  id={`collector-row-${collector.id}`}
                  className={
                    highlightedRow === collector.id
                      ? "bg-primary/10 transition-colors duration-300"
                      : ""
                  }
                >
                  <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{collector.collector_code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{collector.name}</TableCell>
                  <TableCell>{collector.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(collector)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(collector)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          totalItems={totalItems}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCollector ? "Edit Kolektor" : "Kolektor Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedCollector
                ? "Perbarui informasi kolektor"
                : "Tambahkan kolektor baru ke sistem"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collector_code">Kode Kolektor *</Label>
              <Input
                id="collector_code"
                value={formData.collector_code}
                onChange={(e) =>
                  setFormData({ ...formData, collector_code: e.target.value })
                }
                placeholder="Contoh: KOL001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nama lengkap kolektor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCollector.isPending || updateCollector.isPending}
            >
              {createCollector.isPending || updateCollector.isPending
                ? "Menyimpan..."
                : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kolektor?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kolektor{" "}
              <strong>{selectedCollector?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCollector.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
