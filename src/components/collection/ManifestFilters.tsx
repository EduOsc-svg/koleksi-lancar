import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";

interface ManifestFiltersProps {
  selectedCustomer: string;
  setSelectedCustomer: (value: string) => void;
  selectedSales: string;
  setSelectedSales: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  customers: Array<{ id: string; customer_code: string | null; name: string }> | undefined;
  agents: Array<{ id: string; agent_code: string; name: string }> | undefined;
  onPrint: () => void;
  contractCount: number;
}

export function ManifestFilters({
  selectedCustomer,
  setSelectedCustomer,
  selectedSales,
  setSelectedSales,
  searchQuery,
  setSearchQuery,
  customers,
  agents,
  onPrint,
  contractCount,
}: ManifestFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("collection.filterManifest")}</CardTitle>
        <CardDescription>
          {contractCount > 0 
            ? t("collection.contractsFound", { count: contractCount })
            : t("collection.noContractsFound")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pencarian</Label>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari berdasarkan nomor kontrak, nama customer, atau jenis produk..."
              className="w-full"
            />
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">{t("collection.filterByCustomer")}</Label>
            <Select value={selectedCustomer} onValueChange={(v) => setSelectedCustomer(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("collection.allCustomers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("collection.allCustomers")}</SelectItem>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.customer_code} - {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-medium">{t("collection.filterBySales")}</Label>
            <Select value={selectedSales} onValueChange={(v) => setSelectedSales(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("collection.allSales")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("collection.allSales")}</SelectItem>
                {agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.agent_code} - {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={onPrint} 
            className="w-full sm:w-auto"
            disabled={contractCount === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t("collection.printCoupons")} ({contractCount})
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
