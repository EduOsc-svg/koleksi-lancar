import { useState, useEffect } from "react";
import { FileText, CreditCard, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { useCollectors } from "@/hooks/useCollectors";
import { useContracts } from "@/hooks/useContracts";
import { useCreatePayment, useCreateBulkPayment } from "@/hooks/usePayments";
import { usePagination } from "@/hooks/usePagination";
import { useCreateCouponHandover, useCouponHandovers } from "@/hooks/useCouponHandovers";
import { ManifestFilters } from "@/components/collection/ManifestFilters";
import { ManifestTable } from "@/components/collection/ManifestTable";
import { PaymentForm } from "@/components/collection/PaymentForm";
import { SearchInput } from "@/components/ui/search-input";
import { usePaymentsByContract } from "@/hooks/usePayments";
import { OutstandingCouponsTable } from "@/components/collection/OutstandingCouponsTable";
import { HandoverCouponForm } from "@/components/collection/HandoverCouponForm";
import { addToQueue } from "@/lib/offlineQueue";
import { notifyQueueUpdated } from "@/hooks/useOfflineQueue";

export default function Collection() {
  const { data: collectors } = useCollectors();
  const { data: contracts, isLoading: contractsLoading } = useContracts("active");
  const createPayment = useCreatePayment();
  const createBulkPayment = useCreateBulkPayment();
  const createHandover = useCreateCouponHandover();
  const { data: handovers, isLoading: handoversLoading } = useCouponHandovers();

  // Manifest state
  const [searchQuery, setSearchQuery] = useState("");
  // Selected contract id for payment form (lifted state to allow selection from search results)
  const [paymentSelectedContract, setPaymentSelectedContract] = useState("");

  // Filter contracts for manifest
  const manifestContracts = contracts?.filter((c) => {
    if (!c.customers) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        // Search by contract_ref or customer name
        return (
          c.contract_ref.toLowerCase().includes(query) ||
          c.customers.name.toLowerCase().includes(query)
        );
      }
    }
    return true;
  }) || [];

  // Pagination for manifest
  const MANIFEST_ITEMS_PER_PAGE = 10;
  const {
    paginatedItems: paginatedManifestContracts,
    currentPage: manifestPage,
    goToPage: setManifestPage,
    totalPages: manifestTotalPages,
    totalItems: manifestTotalItems,
  } = usePagination(manifestContracts, MANIFEST_ITEMS_PER_PAGE);

  // Reset pagination when filters change
  useEffect(() => {
    setManifestPage(1);
  }, [searchQuery, setManifestPage]);

  const handleSubmitPayment = async (data: {
    contract_id: string;
    payment_date: string;
    installment_index: number;
    amount_paid: number;
    collector_id: string | null;
    notes: string;
  }) => {
    if (!navigator.onLine) {
  addToQueue('payment', data as unknown as Record<string, unknown>);
  notifyQueueUpdated();
  toast.info(`Pembayaran kupon ${data.installment_index} disimpan offline. Akan disinkronkan saat online.`);
      return;
    }
    try {
      await createPayment.mutateAsync(data);
  toast.success(`Pembayaran kupon ${data.installment_index} berhasil dicatat`);
    } catch {
      // Fallback to offline queue on network error
      addToQueue('payment', data as unknown as Record<string, unknown>);
      notifyQueueUpdated();
      toast.info("Koneksi gagal. Pembayaran disimpan offline.");
    }
  };

  const handleBulkSubmitPayment = async (data: {
    contract_id: string;
    payment_date: string;
    start_index: number;
    coupon_count: number;
    amount_per_coupon: number;
    collector_id: string | null;
    notes: string;
  }) => {
    if (!navigator.onLine) {
  addToQueue('bulk_payment', data as unknown as Record<string, unknown>);
  notifyQueueUpdated();
  const endIndex = data.start_index + data.coupon_count - 1;
  toast.info(`Pembayaran kupon ${data.start_index}-${endIndex} disimpan offline.`);
      return;
    }
    try {
      await createBulkPayment.mutateAsync(data);
  const endIndex = data.start_index + data.coupon_count - 1;
  toast.success(`Pembayaran kupon ${data.start_index}-${endIndex} (${data.coupon_count} kupon) berhasil dicatat`);
    } catch {
      addToQueue('bulk_payment', data as unknown as Record<string, unknown>);
      notifyQueueUpdated();
      toast.info("Koneksi gagal. Pembayaran disimpan offline.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Penagihan</h1>
        <p className="text-muted-foreground">Kelola manifest penagihan dan input pembayaran</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="manifest" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="manifest" className="gap-2">
            <FileText className="h-4 w-4" />
            Manifest
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Input Pembayaran
          </TabsTrigger>
          <TabsTrigger value="outstanding" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Belum Bayar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manifest" className="space-y-4 mt-6">
          <ManifestFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            contractCount={manifestContracts.length}
          />

          <ManifestTable
            contracts={manifestContracts}
            paginatedContracts={paginatedManifestContracts}
            isLoading={contractsLoading}
            currentPage={manifestPage}
            totalPages={manifestTotalPages}
            totalItems={manifestTotalItems}
            onPageChange={setManifestPage}
            searchQuery={searchQuery}
            outstandingData={undefined}
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <div className="max-w-2xl space-y-4">
            {/* Search by contract code to list contracts and their payment history */}
            <div>
              <SearchInput
                placeholder="Cari kode kontrak atau nama pelanggan untuk melihat riwayat pembayaran..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="max-w-xl"
              />
            </div>

            {/* If a search query exists, show matching contracts with collapsible payment history */}
            <div className="space-y-3">
              {/* Search results - clicking a contract sets the selected contract for the PaymentForm */}
              {(searchQuery ? (contracts || []).filter(c => {
                const q = searchQuery.toLowerCase().trim();
                return c.contract_ref.toLowerCase().includes(q) || (c.customers?.name || '').toLowerCase().includes(q);
              }) : []).map((c) => (
                <div key={c.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.contract_ref} - {c.customers?.name}</div>
                      <div className="text-xs text-muted-foreground">Mulai: {c.start_date ? new Date(c.start_date).toLocaleDateString('id-ID') : '-'}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>Terbayar: {c.current_installment_index}/{c.tenor_days}</div>
                      <div className="text-muted-foreground">Sisa: {Math.max(0, c.tenor_days - c.current_installment_index)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => {
                      setPaymentSelectedContract(c.id);
                      // focus the payment form - scroll into view
                      const el = document.querySelector('#payment-form-root');
                      if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}>Pilih untuk Pembayaran</Button>
                    <div className="text-sm text-muted-foreground">atau lihat riwayat pembayaran di bawah</div>
                  </div>

                  <div className="mt-3">
                    <ContractPayments contractId={c.id} />
                  </div>
                </div>
              ))}

              {/* Always show the PaymentForm so user can proceed after selecting via search */}
              <div id="payment-form-root">
                <PaymentForm
                  contracts={contracts}
                  collectors={collectors}
                  onSubmit={handleSubmitPayment}
                  onBulkSubmit={handleBulkSubmitPayment}
                  isSubmitting={createPayment.isPending || createBulkPayment.isPending}
                  selectedContractId={paymentSelectedContract}
                  setSelectedContractId={setPaymentSelectedContract}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outstanding" className="space-y-6 mt-6">
          <HandoverCouponForm
            contracts={contracts}
            collectors={collectors}
            onSubmit={async (data) => {
              await createHandover.mutateAsync(data);
              toast.success(`Serah terima ${data.coupon_count} kupon berhasil dicatat`);
            }}
            isSubmitting={createHandover.isPending}
          />

          <OutstandingCouponsTable
            isLoading={handoversLoading}
            handovers={handovers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Small helper component to render payments for a contract ---
function ContractPayments({ contractId }: { contractId: string }) {
  const { data: payments, isLoading } = usePaymentsByContract(contractId);

  if (isLoading) return <div className="text-sm text-muted-foreground">Memuat riwayat...</div>;
  if (!payments || payments.length === 0) return <div className="text-sm text-muted-foreground">Belum ada pembayaran tercatat.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="pb-2">Tanggal</th>
            <th className="pb-2">Kupon</th>
            <th className="pb-2 text-right">Jumlah</th>
            <th className="pb-2">Collector</th>
            <th className="pb-2">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: any) => (
            <tr key={p.id} className="border-t">
              <td className="py-2 align-top">{new Date(p.payment_date).toLocaleDateString('id-ID')}</td>
              <td className="py-2 align-top">{p.installment_index}</td>
              <td className="py-2 align-top text-right">{p.amount_paid?.toLocaleString ? p.amount_paid.toLocaleString() : p.amount_paid}</td>
              <td className="py-2 align-top">{p.collectors?.name || '-'}</td>
              <td className="py-2 align-top">{p.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
