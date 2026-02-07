import { useState } from "react";
import { Plus, Pencil, Trash2, Settings, Info } from "lucide-react";
import { toast } from "sonner";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  const [formData, setFormData] = useState<{
    min_amount: number | undefined;
    max_amount: number | undefined;
    percentage: string;
  }>({
    min_amount: undefined,
    max_amount: undefined,
    percentage: "",
  });

  const handleOpenCreate = () => {
    setSelectedTier(null);
    setFormData({ min_amount: undefined, max_amount: undefined, percentage: "" });
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (tier: CommissionTier) => {
    setSelectedTier(tier);
    setFormData({
      min_amount: tier.min_amount,
      max_amount: tier.max_amount ?? undefined,
      percentage: tier.percentage.toString(),
    });
    setFormDialogOpen(true);
  };

  const handleSubmit = async () => {
    const minAmount = formData.min_amount;
    const maxAmount = formData.max_amount ?? null;
    const percentage = parseFloat(formData.percentage);

    if (minAmount === undefined || isNaN(percentage)) {
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Fixed Header - tidak ikut scroll */}
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ketentuan Komisi Berjenjang
            </DialogTitle>
            <DialogDescription>
              Atur persentase komisi berdasarkan nominal omset kontrak. Komisi akan otomatis dihitung berdasarkan ketentuan ini.
            </DialogDescription>
          </DialogHeader>

          {/* Sticky Action Bar - tidak ikut scroll */}
          <div className="flex-shrink-0 py-4 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <Alert className="flex-1 mr-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Persentase komisi berdasarkan <strong>Omset per kontrak</strong>. 
                  Tier tertinggi digunakan jika tidak ada yang cocok.
                </AlertDescription>
              </Alert>
              <Button onClick={handleOpenCreate} size="sm" className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-1 pr-4">
                <div className="space-y-4">
                  {/* Data Table with better scroll handling */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b">
                        <TableRow>
                          <TableHead>Rentang Omset</TableHead>
                          <TableHead className="text-center">Persentase Komisi</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                <span>Memuat...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : tiers?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                              <div className="space-y-2">
                                <div className="text-4xl">📊</div>
                                <div>Belum ada ketentuan komisi</div>
                                <div className="text-sm">Tambahkan ketentuan baru untuk memulai</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          tiers?.map((tier, index) => (
                            <TableRow key={tier.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                              <TableCell className="font-medium">
                                {formatRange(tier.min_amount, tier.max_amount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                  {tier.percentage}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEdit(tier)}
                                    className="h-8 w-8"
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
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Footer Example - dalam scroll area */}
                  <div className="rounded-lg bg-muted/30 p-4">
                    <div className="text-sm text-muted-foreground">
                      <strong>💡 Contoh Perhitungan:</strong> Jika omset kontrak Rp 50.000.000 dan tier menunjukkan 6% untuk rentang Rp 30.000.000 - Rp 70.000.000, 
                      maka komisi = Rp 50.000.000 × 6% = Rp 3.000.000
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog - Enhanced with proper scrolling */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle>
              {selectedTier ? "Edit Ketentuan Komisi" : "Tambah Ketentuan Komisi"}
            </DialogTitle>
          </DialogHeader>
          
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-1 pr-4">
                <div className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="min_amount">Nominal Minimum</Label>
                    <CurrencyInput
                      id="min_amount"
                      value={formData.min_amount}
                      onValueChange={(value) =>
                        setFormData({ ...formData, min_amount: value })
                      }
                      placeholder="Rp 0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_amount">Nominal Maksimum</Label>
                    <CurrencyInput
                      id="max_amount"
                      value={formData.max_amount}
                      onValueChange={(value) =>
                        setFormData({ ...formData, max_amount: value })
                      }
                      placeholder="Kosongkan untuk tidak ada batas"
                    />
                    <p className="text-xs text-muted-foreground">
                      Kosongkan jika ini adalah tier tertinggi (tanpa batas maksimum)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
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
                  
                  {/* Form Tips dalam scroll area */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>💡 Tips:</strong> Pastikan tidak ada celah atau tumpang tindih antar tier untuk memastikan semua kontrak memiliki komisi yang tepat.
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
          
          {/* Fixed Footer */}
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTier.isPending || updateTier.isPending}
            >
              {createTier.isPending || updateTier.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full"></div>
                  <span>{selectedTier ? "Menyimpan..." : "Menambah..."}</span>
                </div>
              ) : (
                selectedTier ? "Simpan" : "Tambah"
              )}
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
