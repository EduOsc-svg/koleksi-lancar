import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Wallet, History, Trash2, AlertCircle, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { 
  useCommissionPayments, 
  useUnpaidCommissions, 
  useCreateCommissionPayment,
  useDeleteCommissionPayment,
  useCommissionSummary,
  useBulkCreateCommissionPayments,
} from "@/hooks/useCommissionPayments";

interface CommissionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
  agentCode: string;
}

export function CommissionPaymentDialog({
  open,
  onOpenChange,
  agentId,
  agentName,
  agentCode,
}: CommissionPaymentDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("unpaid");
  const [selectedContract, setSelectedContract] = useState<{
    contract_id: string;
    contract_ref: string;
    commission: number;
  } | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPayAllConfirm, setShowPayAllConfirm] = useState(false);
  const [payAllDate, setPayAllDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAllNotes, setPayAllNotes] = useState("");

  const { data: paidCommissions, isLoading: loadingPaid } = useCommissionPayments(agentId);
  const { data: unpaidCommissions, isLoading: loadingUnpaid } = useUnpaidCommissions(agentId);
  const { data: summary } = useCommissionSummary(agentId);
  const createPayment = useCreateCommissionPayment();
  const deletePayment = useDeleteCommissionPayment();
  const bulkPayment = useBulkCreateCommissionPayments();

  const totalUnpaidAmount = unpaidCommissions?.reduce((sum, item) => sum + item.commission, 0) || 0;

  const handlePayCommission = async () => {
    if (!selectedContract) return;

    try {
      await createPayment.mutateAsync({
        sales_agent_id: agentId,
        contract_id: selectedContract.contract_id,
        amount: selectedContract.commission,
        payment_date: paymentDate,
        notes: notes || undefined,
      });
      toast.success("Komisi berhasil dibayarkan");
      setSelectedContract(null);
      setNotes("");
    } catch (error: any) {
      if (error?.message?.includes('unique_commission_per_contract')) {
        toast.error("Komisi untuk kontrak ini sudah dibayarkan");
      } else {
        toast.error("Gagal membayarkan komisi");
      }
    }
  };

  const handlePayAll = async () => {
    if (!unpaidCommissions || unpaidCommissions.length === 0) return;

    try {
      const payments = unpaidCommissions.map(item => ({
        contract_id: item.contract_id,
        amount: item.commission,
      }));

      await bulkPayment.mutateAsync({
        sales_agent_id: agentId,
        payments,
        payment_date: payAllDate,
        notes: payAllNotes || `Bayar semua komisi (${unpaidCommissions.length} kontrak)`,
      });

      toast.success(`${unpaidCommissions.length} komisi berhasil dibayarkan`);
      setShowPayAllConfirm(false);
      setPayAllNotes("");
    } catch (error: any) {
      toast.error("Gagal membayarkan komisi");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deletePayment.mutateAsync({ id: deleteId, salesAgentId: agentId });
      toast.success("Pembayaran komisi berhasil dihapus");
      setDeleteId(null);
    } catch (error) {
      toast.error("Gagal menghapus pembayaran komisi");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Pembayaran Komisi - {agentName} ({agentCode})
            </DialogTitle>
          </DialogHeader>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Total Kontrak</p>
              <p className="text-lg font-semibold">{summary?.totalContracts || 0}</p>
            </div>
            <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
              <p className="text-lg font-semibold text-green-600">{formatRupiah(summary?.totalPaid || 0)}</p>
              <p className="text-xs text-muted-foreground">{summary?.paidContracts || 0} kontrak</p>
            </div>
            <div className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <p className="text-xs text-muted-foreground">Belum Dibayar</p>
              <p className="text-lg font-semibold text-orange-600">{formatRupiah(summary?.totalUnpaid || 0)}</p>
              <p className="text-xs text-muted-foreground">{(summary?.totalContracts || 0) - (summary?.paidContracts || 0)} kontrak</p>
            </div>
          </div>

          {/* Yearly Bonus Section */}
          <div className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/20 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bonus Tahunan (0.8% x Omset {new Date().getFullYear()})</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Omset Tahun Ini: {formatRupiah(summary?.yearlyOmset || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">{formatRupiah(summary?.yearlyBonus || 0)}</p>
                <Badge variant="outline" className="text-xs">Rekap Tgl 1</Badge>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unpaid" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Belum Dibayar ({unpaidCommissions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Riwayat ({paidCommissions?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unpaid" className="mt-4">
              {loadingUnpaid ? (
                <p className="text-center text-muted-foreground py-8">Memuat...</p>
              ) : unpaidCommissions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Semua komisi sudah dibayarkan!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pay All Button */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Total Belum Dibayar</p>
                      <p className="text-lg font-bold text-primary">{formatRupiah(totalUnpaidAmount)}</p>
                      <p className="text-xs text-muted-foreground">{unpaidCommissions?.length} kontrak</p>
                    </div>
                    <Button 
                      onClick={() => setShowPayAllConfirm(true)}
                      disabled={bulkPayment.isPending}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Bayar Semua
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode Kontrak</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Omset</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Komisi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidCommissions?.map((item) => (
                        <TableRow key={item.contract_id}>
                          <TableCell className="font-medium">{item.contract_ref}</TableCell>
                          <TableCell>{item.customer_name}</TableCell>
                          <TableCell>{formatRupiah(item.omset)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.commission_percentage}%</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {formatRupiah(item.commission)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => setSelectedContract({
                                contract_id: item.contract_id,
                                contract_ref: item.contract_ref,
                                commission: item.commission,
                              })}
                            >
                              <Wallet className="h-4 w-4 mr-1" />
                              Bayar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {loadingPaid ? (
                <p className="text-center text-muted-foreground py-8">Memuat...</p>
              ) : paidCommissions?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada riwayat pembayaran komisi</p>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kontrak</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidCommissions?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell className="font-medium">{payment.contract_ref}</TableCell>
                          <TableCell>{payment.customer_name}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatRupiah(payment.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {payment.notes || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(payment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Payment Form Modal */}
          {selectedContract && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-semibold mb-3">Bayar Komisi - {selectedContract.contract_ref}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Jumlah Komisi</Label>
                  <div className="text-xl font-bold text-primary mt-1">
                    {formatRupiah(selectedContract.commission)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment_date">Tanggal Pembayaran</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Catatan (opsional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan pembayaran..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedContract(null);
                    setNotes("");
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={handlePayCommission}
                  disabled={createPayment.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Konfirmasi Pembayaran
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pembayaran Komisi?</AlertDialogTitle>
            <AlertDialogDescription>
              Pembayaran komisi ini akan dihapus dan kontrak akan kembali muncul di daftar "Belum Dibayar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay All Confirmation */}
      <AlertDialog open={showPayAllConfirm} onOpenChange={setShowPayAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bayar Semua Komisi?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan membayar <strong>{unpaidCommissions?.length || 0} komisi</strong> sekaligus 
                  dengan total <strong className="text-primary">{formatRupiah(totalUnpaidAmount)}</strong>.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="pay_all_date">Tanggal Pembayaran</Label>
                  <Input
                    id="pay_all_date"
                    type="date"
                    value={payAllDate}
                    onChange={(e) => setPayAllDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_all_notes">Catatan (opsional)</Label>
                  <Input
                    id="pay_all_notes"
                    value={payAllNotes}
                    onChange={(e) => setPayAllNotes(e.target.value)}
                    placeholder="Catatan pembayaran..."
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayAll} disabled={bulkPayment.isPending}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Bayar Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
