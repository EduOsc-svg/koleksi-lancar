import { useState, useRef, useEffect } from "react";
import { FileText, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/styles/Voucher-new.css";
import VoucherPage from "@/components/print/VoucherPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { useCollectors } from "@/hooks/useCollectors";
import { useCustomers } from "@/hooks/useCustomers";
import { useContracts } from "@/hooks/useContracts";
import { useCreatePayment } from "@/hooks/usePayments";
import { usePagination } from "@/hooks/usePagination";
import { ManifestFilters } from "@/components/collection/ManifestFilters";
import { ManifestTable } from "@/components/collection/ManifestTable";
import { PaymentForm } from "@/components/collection/PaymentForm";

export default function Collection() {
  const { t } = useTranslation();
  const { data: collectors } = useCollectors();
  const { data: customers } = useCustomers();
  const { data: contracts, isLoading: contractsLoading } = useContracts("active");
  const createPayment = useCreatePayment();
  const printRef = useRef<HTMLDivElement>(null);

  // Manifest state
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter contracts for manifest
  const manifestContracts = contracts?.filter((c) => {
    if (!c.customers) return false;
    if (selectedCustomer && c.customer_id !== selectedCustomer) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        // Only search by contract_ref and customer name, not customer_code
        // to avoid confusion when searching for contract references
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
  }, [selectedCustomer, searchQuery, setManifestPage]);

  // Print info
  const selectedCustomerName = selectedCustomer
    ? (() => {
        const customer = customers?.find((c) => c.id === selectedCustomer);
        return customer ? `${customer.customer_code} - ${customer.name}` : null;
      })()
    : null;


  const handlePrintCoupons = () => {
    if (!manifestContracts.length) {
      toast.error(t("collection.noContracts"));
      return;
    }
    window.print();
  };

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
      toast.success(t("collection.paymentRecorded", { coupon: data.installment_index }));
    } catch {
      toast.error(t("errors.saveFailed"));
      throw new Error("Payment failed");
    }
  };

  return (
    <div className="space-y-6 print:space-y-0" ref={printRef}>
      {/* Print Header */}
      <div className="print:block hidden print:mb-4 print:border-b print:border-black print:pb-2">
        <h1 className="text-xl font-bold text-center">DAFTAR KUPON COLLECTION</h1>
        <div className="text-sm text-center mt-2">
          {selectedCustomerName && <div>Pelanggan: {selectedCustomerName}</div>}
          {!selectedCustomerName && <div>Semua Pelanggan</div>}
          <div className="mt-1">Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}</div>
        </div>
      </div>

      {/* VoucherPage for print */}
      {manifestContracts.length > 0 && <VoucherPage contracts={manifestContracts} />}

      {/* Page Header */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">{t("collection.title")}</h1>
        <p className="text-muted-foreground">{t("collection.description")}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="manifest" className="w-full print:block">
        <TabsList className="grid w-full grid-cols-2 max-w-md print:hidden">
          <TabsTrigger value="manifest" className="gap-2">
            <FileText className="h-4 w-4" />
            {t("collection.generateManifest")}
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            {t("collection.inputPayment")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manifest" className="space-y-4 print:space-y-0 print:block mt-6">
          <ManifestFilters
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            customers={customers}
            onPrint={handlePrintCoupons}
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

        <TabsContent value="payment" className="print:hidden mt-6">
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
