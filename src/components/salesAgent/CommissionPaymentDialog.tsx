import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Eye, History, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import { 
  useCommissionPayments, 
  useUnpaidCommissions, 
  useCommissionSummary,
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

  const { data: paidCommissions, isLoading: loadingPaid } = useCommissionPayments(agentId);
  const { data: unpaidCommissions, isLoading: loadingUnpaid } = useUnpaidCommissions(agentId);
  const { data: summary } = useCommissionSummary(agentId);

  const totalUnpaidAmount = unpaidCommissions?.reduce((sum, item) => sum + item.commission, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detail Komisi - {agentName} ({agentCode})
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
                {/* Summary Info */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Total Belum Dibayar</p>
                    <p className="text-lg font-bold text-primary">{formatRupiah(totalUnpaidAmount)}</p>
                    <p className="text-xs text-muted-foreground">{unpaidCommissions?.length} kontrak</p>
                  </div>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
