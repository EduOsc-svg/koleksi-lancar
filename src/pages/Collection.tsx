import { useState, useEffect } from "react";
import { FileText, CreditCard, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { useCollectors } from "@/hooks/useCollectors";
import { useContracts } from "@/hooks/useContracts";
import { useCreatePayment, useCreateBulkPayment } from "@/hooks/usePayments";
import { useOutstandingCoupons } from "@/hooks/useOutstandingCoupons";
import { usePagination } from "@/hooks/usePagination";
import { useCreateCouponHandover, useCouponHandovers } from "@/hooks/useCouponHandovers";
import { ManifestFilters } from "@/components/collection/ManifestFilters";
import { ManifestTable } from "@/components/collection/ManifestTable";
import { PaymentForm } from "@/components/collection/PaymentForm";
import { OutstandingCouponsTable } from "@/components/collection/OutstandingCouponsTable";
import { HandoverCouponForm } from "@/components/collection/HandoverCouponForm";
import { addToQueue } from "@/lib/offlineQueue";
import { notifyQueueUpdated } from "@/hooks/useOfflineQueue";

export default function Collection() {
  const { data: collectors } = useCollectors();
  const { data: contracts, isLoading: contractsLoading } = useContracts("active");
  const createPayment = useCreatePayment();
  const createBulkPayment = useCreateBulkPayment();
  const { data: outstandingData, isLoading: outstandingLoading } = useOutstandingCoupons();
  const createHandover = useCreateCouponHandover();
  const { data: handovers } = useCouponHandovers();

  // Shared state
  const [searchQuery, setSearchQuery] = useState("");
  const [sharedCollectorId, setSharedCollectorId] = useState("");

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
      toast.info(`Pembayaran kupon #${data.installment_index} disimpan offline. Akan disinkronkan saat online.`);
      return;
    }
    try {
      await createPayment.mutateAsync(data);
      toast.success(`Pembayaran kupon #${data.installment_index} berhasil dicatat`);
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
      toast.info(`Pembayaran kupon #${data.start_index}-#${endIndex} disimpan offline.`);
      return;
    }
    try {
      await createBulkPayment.mutateAsync(data);
      const endIndex = data.start_index + data.coupon_count - 1;
      toast.success(`Pembayaran kupon #${data.start_index}-#${endIndex} (${data.coupon_count} kupon) berhasil dicatat`);
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
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <div className="max-w-2xl">
            <PaymentForm
              contracts={contracts}
              collectors={collectors}
              onSubmit={handleSubmitPayment}
              onBulkSubmit={handleBulkSubmitPayment}
              isSubmitting={createPayment.isPending || createBulkPayment.isPending}
              defaultCollectorId={sharedCollectorId}
            />
          </div>
        </TabsContent>

        <TabsContent value="outstanding" className="space-y-6 mt-6">
          <HandoverCouponForm
            contracts={contracts}
            collectors={collectors}
            onSubmit={async (data) => {
              await createHandover.mutateAsync(data);
              setSharedCollectorId(data.collector_id);
              toast.success(`Serah terima ${data.coupon_count} kupon berhasil dicatat`);
            }}
            isSubmitting={createHandover.isPending}
          />

          <OutstandingCouponsTable
            data={outstandingData}
            isLoading={outstandingLoading}
            handovers={handovers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
