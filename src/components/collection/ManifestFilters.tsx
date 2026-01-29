import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";

interface ManifestFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  contractCount: number;
}

export function ManifestFilters({
  searchQuery,
  setSearchQuery,
  contractCount,
}: ManifestFiltersProps) {
  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filter Manifest</CardTitle>
        <CardDescription>
          {searchQuery ? (
            <span>
              {contractCount > 0 
                ? `Ditemukan ${contractCount} kontrak dengan kata kunci "${searchQuery}"`
                : `Tidak ada kontrak yang ditemukan dengan kata kunci "${searchQuery}"`}
            </span>
          ) : (
            contractCount > 0 
              ? `${contractCount} kontrak ditemukan`
              : "Tidak ada kontrak yang ditemukan"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pencarian</Label>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari berdasarkan kode pelanggan, nama pelanggan, atau nomor kontrak..."
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
