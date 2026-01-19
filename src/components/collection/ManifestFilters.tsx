import { useTranslation } from "react-i18next";
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
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  customers: Array<{ id: string; customer_code: string | null; name: string }> | undefined;
  contractCount: number;
}

export function ManifestFilters({
  selectedCustomer,
  setSelectedCustomer,
  searchQuery,
  setSearchQuery,
  customers,
  contractCount,
}: ManifestFiltersProps) {
  const { t } = useTranslation();

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("collection.filterManifest")}</CardTitle>
        <CardDescription>
          {searchQuery ? (
            <span>
              {contractCount > 0 
                ? `Ditemukan ${contractCount} kontrak dengan kata kunci "${searchQuery}"`
                : `Tidak ada kontrak yang ditemukan dengan kata kunci "${searchQuery}"`}
            </span>
          ) : (
            contractCount > 0 
              ? t("collection.contractsFound", { count: contractCount })
              : t("collection.noContractsFound")
          )}
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
        </div>
      </CardContent>
    </Card>
  );
}
