import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/useCustomers";
import { useContracts } from "@/hooks/useContracts";
import { usePaymentsByContract } from "@/hooks/usePayments";
import { formatRupiah, formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CustomerHistory() {
  const { data: customers } = useCustomers();
  const { data: contracts } = useContracts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customerContracts = contracts?.filter(
    (c) => c.customer_id === selectedCustomerId
  );

  const { data: payments, isLoading: loadingPayments } = usePaymentsByContract(
    selectedContractId
  );

  // Pagination constants
  const ITEMS_PER_PAGE = 5;
  
  // Add pagination for payments
  const { currentPage, totalPages, paginatedItems: paginatedPayments, goToPage, totalItems } = usePagination(payments, ITEMS_PER_PAGE);

  // Add pagination for customer list
  const displayCustomers = searchTerm ? filteredCustomers : customers;
  const { 
    currentPage: customerPage, 
    totalPages: customerTotalPages, 
    paginatedItems: paginatedCustomers, 
    goToPage: goToCustomerPage,
    totalItems: totalCustomers 
  } = usePagination(displayCustomers, ITEMS_PER_PAGE);

  const selectedContract = contracts?.find((c) => c.id === selectedContractId);
  const progress = selectedContract
    ? (selectedContract.current_installment_index / selectedContract.tenor_days) * 100
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Riwayat Pelanggan</h2>

      <Card>
        <CardHeader>
          <CardTitle>Cari Pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Show filtered list or all customers with pagination */}
          <ScrollArea className="border rounded-lg h-64">
            <div className="space-y-1 p-2">
              {paginatedCustomers?.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 hover:bg-muted cursor-pointer rounded-md ${
                    selectedCustomerId === customer.id ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setSelectedContractId("");
                  }}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Kode: {customer.customer_code || "-"} | Agent: {customer.sales_agents?.name || "-"}
                  </div>
                </div>
              ))}
              {(!paginatedCustomers || paginatedCustomers.length === 0) && (
                <div className="p-3 text-center text-muted-foreground">
                  Pelanggan tidak ditemukan
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Customer pagination */}
          {customerTotalPages > 1 && (
            <TablePagination
              currentPage={customerPage}
              totalPages={customerTotalPages}
              onPageChange={goToCustomerPage}
              totalItems={totalCustomers}
            />
          )}

          {selectedCustomerId && (
            <div>
              <Select
                value={selectedContractId}
                onValueChange={setSelectedContractId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kontrak" />
                </SelectTrigger>
                <SelectContent>
                  {customerContracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_ref} - {formatRupiah(contract.total_loan_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedContract && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Progress Pinjaman</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Kontrak</p>
                    <p className="font-medium">{selectedContract.contract_ref}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Pinjaman</p>
                    <p className="font-medium">{formatRupiah(selectedContract.total_loan_amount)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {selectedContract.current_installment_index} / {selectedContract.tenor_days} terbayar
                    </span>
                  </div>
                  <Progress value={progress} className="h-4" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Terbayar: {formatRupiah(selectedContract.current_installment_index * selectedContract.daily_installment_amount)}
                    </span>
                    <span>
                      Sisa: {formatRupiah((selectedContract.tenor_days - selectedContract.current_installment_index) * selectedContract.daily_installment_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant={selectedContract.status === "active" ? "default" : "secondary"}>
                    {selectedContract.status === "active" ? "Lancar" : "Selesai"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedContract.product_type || "N/A"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kupon #</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Kolektor</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayments ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Memuat...</TableCell>
                      </TableRow>
                    ) : paginatedPayments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Belum ada pembayaran
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPayments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Badge variant="outline">{payment.installment_index}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatRupiah(Number(payment.amount_paid))}
                          </TableCell>
                          <TableCell>{payment.collectors?.name || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Payments pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    totalItems={totalItems}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedCustomerId && customers && customers.length > 0 && (
        <div className="text-center py-6 text-muted-foreground">
          Pilih pelanggan dari daftar di atas untuk melihat riwayat pinjaman
        </div>
      )}
    </div>
  );
}
