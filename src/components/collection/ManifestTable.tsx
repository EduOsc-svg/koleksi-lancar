import { useTranslation } from "react-i18next";
import { FileX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/TablePagination";
import { formatRupiah } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface Contract {
  id: string;
  contract_ref: string;
  current_installment_index: number;
  daily_installment_amount: number;
  customers: { name: string; customer_code: string | null } | null;
}

interface ManifestTableProps {
  contracts: Contract[] | undefined;
  paginatedContracts: Contract[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  searchQuery?: string;
}

export function ManifestTable({
  contracts,
  paginatedContracts,
  isLoading,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemsPerPage = 10,
  searchQuery,
}: ManifestTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="border rounded-lg print:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>{t("customers.customerCode")}</TableHead>
              <TableHead>{t("collection.customer")}</TableHead>
              <TableHead>{t("contracts.contractRef")}</TableHead>
              <TableHead className="text-center">{t("contracts.couponIndex")}</TableHead>
              <TableHead className="text-right">{t("contracts.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="border rounded-lg p-12 print:hidden">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {searchQuery ? "Tidak Ada Hasil" : t("collection.noContracts")}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {searchQuery 
              ? `Tidak ada kontrak yang ditemukan dengan kata kunci "${searchQuery}". Coba kata kunci lain atau hapus filter pencarian.`
              : t("collection.noContractsDescription")
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="print:hidden">
      {searchQuery && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Hasil pencarian:</span> Menampilkan {totalItems} kontrak yang mengandung "{searchQuery}"
          </p>
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 font-semibold">#</TableHead>
              <TableHead className="font-semibold">{t("customers.customerCode")}</TableHead>
              <TableHead className="font-semibold">{t("collection.customer")}</TableHead>
              <TableHead className="font-semibold">{t("contracts.contractRef")}</TableHead>
              <TableHead className="font-semibold text-center">{t("contracts.couponIndex")}</TableHead>
              <TableHead className="font-semibold text-right">{t("contracts.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContracts.map((contract, i) => (
              <TableRow key={contract.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-muted-foreground">
                  {(currentPage - 1) * itemsPerPage + i + 1}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {contract.customers?.customer_code || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{contract.customers?.name}</TableCell>
                <TableCell className="font-mono text-sm">{contract.contract_ref}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-semibold">
                    {contract.current_installment_index + 1}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatRupiah(contract.daily_installment_amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}
