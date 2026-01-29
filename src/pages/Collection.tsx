import { useState, useEffect } from "react";
import { FileText, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { useCollectors } from "@/hooks/useCollectors";
import { useContracts } from "@/hooks/useContracts";
import { useCreatePayment } from "@/hooks/usePayments";
import { usePagination } from "@/hooks/usePagination";
import { ManifestFilters } from "@/components/collection/ManifestFilters";
import { ManifestTable } from "@/components/collection/ManifestTable";
import { PaymentForm } from "@/components/collection/PaymentForm";

export default function Collection() {
  const { data: collectors } = useCollectors();
  const { data: contracts, isLoading: contractsLoading } = useContracts("active");
  const createPayment = useCreatePayment();

  // Manifest state
  const [searchQuery, setSearchQuery] = useState("");

  // Filter contracts for manifest
  const manifestContracts = contracts?.filter((c) => {
    if (!c.customers) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        // Search by contract_ref, customer name, or customer_code
        return (
          c.contract_ref.toLowerCase().includes(query) ||
          c.customers.name.toLowerCase().includes(query) ||
          (c.customers.customer_code?.toLowerCase().includes(query) ?? false)
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
    try {
      await createPayment.mutateAsync(data);
      toast.success(`Pembayaran kupon #${data.installment_index} berhasil dicatat`);
    } catch {
      toast.error("Gagal menyimpan data");
      throw new Error("Payment failed");
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
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="manifest" className="gap-2">
            <FileText className="h-4 w-4" />
            Manifest
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Input Pembayaran
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
              isSubmitting={createPayment.isPending}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
