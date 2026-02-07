import { useState } from "react";
import { Plus, Pencil, Trash2, Settings, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatRupiah } from "@/lib/format";
import { useCommissionTiers, CommissionTier } from "@/hooks/useCommissionTiers";
import {
  useCreateCommissionTier,
  useUpdateCommissionTier,
  useDeleteCommissionTier,
} from "@/hooks/useCommissionTiersMutations";

interface CommissionTiersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommissionTiersDialog({
  open,
  onOpenChange,
}: CommissionTiersDialogProps) {
  const { data: tiers, isLoading } = useCommissionTiers();
  const createTier = useCreateCommissionTier();
  const updateTier = useUpdateCommissionTier();
  const deleteTier = useDeleteCommissionTier();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<CommissionTier | null>(null);
  const [formData, setFormData] = useState({
    min_amount: "",
    max_amount: "",
    percentage: "",
  });

  const handleOpenCreate = () => {
    setSelectedTier(null);
    setFormData({ min_amount: "", max_amount: "", percentage: "" });
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (tier: CommissionTier) => {
    setSelectedTier(tier);
    setFormData({
      min_amount: tier.min_amount.toString(),
      max_amount: tier.max_amount?.toString() || "",
      percentage: tier.percentage.toString(),
    });
    setFormDialogOpen(true);
  };

  const handleSubmit = async () => {
    const minAmount = parseFloat(formData.min_amount);
    const maxAmount = formData.max_amount ? parseFloat(formData.max_amount) : null;
    const percentage = parseFloat(formData.percentage);

    if (isNaN(minAmount) || isNaN(percentage)) {
      toast.error("Nominal minimum dan persentase harus diisi");
      return;
    }

    if (percentage < 0 || percentage > 100) {
      toast.error("Persentase harus antara 0 dan 100");
      return;
    }

    if (maxAmount !== null && maxAmount <= minAmount) {
      toast.error("Nominal maksimum harus lebih besar dari minimum");
      return;
    }

    try {
      if (selectedTier) {
        await updateTier.mutateAsync({
          id: selectedTier.id,
          min_amount: minAmount,
          max_amount: maxAmount,
          percentage,
        });
        toast.success("Ketentuan komisi berhasil diperbarui");
      } else {
        await createTier.mutateAsync({
          min_amount: minAmount,
          max_amount: maxAmount,
          percentage,
        });
        toast.success("Ketentuan komisi berhasil ditambahkan");
      }
      setFormDialogOpen(false);
    } catch (error) {
      toast.error("Gagal menyimpan ketentuan komisi");
    }
  };

  const handleDelete = async () => {
    if (!selectedTier) return;

    try {
      await deleteTier.mutateAsync(selectedTier.id);
      toast.success("Ketentuan komisi berhasil dihapus");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus ketentuan komisi");
    }
  };

  const formatRange = (min: number, max: number | null) => {
    if (max === null) {
      return `≥ ${formatRupiah(min)}`;
    }
    return `${formatRupiah(min)} - ${formatRupiah(max)}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ketentuan Komisi Berjenjang
            </DialogTitle>
            <DialogDescription>
              Atur persentase komisi berdasarkan nominal omset kontrak. Komisi akan otomatis dihitung berdasarkan ketentuan ini.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Persentase komisi ditentukan berdasarkan nilai <strong>Omset per kontrak</strong>. 
              Jika nilai kontrak tidak cocok dengan tier manapun, akan menggunakan tier tertinggi.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Ketentuan
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rentang Omset</TableHead>
                  <TableHead className="text-center">Persentase Komisi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Memuat...
                    </TableCell>
                  </TableRow>
                ) : tiers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada ketentuan komisi. Tambahkan ketentuan baru untuk memulai.
                    </TableCell>
                  </TableRow>
                ) : (
                  tiers?.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">
                        {formatRange(tier.min_amount, tier.max_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                          {tier.percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(tier)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTier(tier);
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

          <div className="text-sm text-muted-foreground">
            <strong>Contoh:</strong> Jika omset kontrak Rp 50.000.000 dan tier menunjukkan 6% untuk rentang Rp 30.000.000 - Rp 70.000.000, 
            maka komisi = Rp 50.000.000 × 6% = Rp 3.000.000
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTier ? "Edit Ketentuan Komisi" : "Tambah Ketentuan Komisi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="min_amount">Nominal Minimum (Rp)</Label>
              <Input
                id="min_amount"
                type="number"
                value={formData.min_amount}
                onChange={(e) =>
                  setFormData({ ...formData, min_amount: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="max_amount">Nominal Maksimum (Rp)</Label>
              <Input
                id="max_amount"
                type="number"
                value={formData.max_amount}
                onChange={(e) =>
                  setFormData({ ...formData, max_amount: e.target.value })
                }
                placeholder="Kosongkan untuk tidak ada batas"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Kosongkan jika ini adalah tier tertinggi (tanpa batas maksimum)
              </p>
            </div>
            <div>
              <Label htmlFor="percentage">Persentase Komisi (%)</Label>
              <Input
                id="percentage"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={formData.percentage}
                onChange={(e) =>
                  setFormData({ ...formData, percentage: e.target.value })
                }
                placeholder="5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTier.isPending || updateTier.isPending}
            >
              {selectedTier ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ketentuan Komisi?</AlertDialogTitle>
            <AlertDialogDescription>
              Ketentuan komisi ini akan dihapus. Pastikan tidak ada overlap atau gap pada rentang omset setelah penghapusan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
