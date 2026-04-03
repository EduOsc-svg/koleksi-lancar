import { useState, useMemo } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCustomers } from "@/hooks/useCustomers";
import { useContracts } from "@/hooks/useContracts";
import { usePaymentsByContract } from "@/hooks/usePayments";
import { formatRupiah, formatDate } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { differenceInDays } from "date-fns";

type ContractStatusFilter = 'all' | 'lancar' | 'kurang_lancar' | 'macet' | 'completed';

// Calculate dynamic contract status based on days_per_due metric
const calculateContractStatus = (contract: {
  status: string;
  current_installment_index: number;
  created_at: string;
}): 'completed' | 'lancar' | 'kurang_lancar' | 'macet' => {
  if (contract.status === 'completed') return 'completed';
  
  const daysSinceCreation = differenceInDays(new Date(), new Date(contract.created_at));
  const installmentsPaid = contract.current_installment_index;
  
  if (installmentsPaid === 0) {
    return daysSinceCreation > 7 ? 'macet' : daysSinceCreation > 3 ? 'kurang_lancar' : 'lancar';
  }
  
  const daysPerDue = daysSinceCreation / installmentsPaid;
  
  if (daysPerDue <= 1.2) return 'lancar';
  if (daysPerDue <= 2.0) return 'kurang_lancar';
  return 'macet';
};

const getStatusLabel = (status: 'completed' | 'lancar' | 'kurang_lancar' | 'macet'): string => {
  const labels: Record<string, string> = {
    completed: 'Lunas',
    lancar: 'Lancar',
    kurang_lancar: 'Kurang Lancar',
    macet: 'Macet'
  };
  return labels[status] || status;
};

const getStatusBadgeClass = (status: 'completed' | 'lancar' | 'kurang_lancar' | 'macet'): string => {
  const classes: Record<string, string> = {
    completed: 'bg-blue-100 text-blue-700',
    lancar: 'bg-green-100 text-green-700',
    kurang_lancar: 'bg-yellow-100 text-yellow-700',
    macet: 'bg-red-100 text-red-700'
  };
  return classes[status] || '';
};

export default function CustomerHistory() {
  const { data: customers } = useCustomers();
  const { data: contracts } = useContracts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>('all');

  // Filter customers based on search term AND status filter
  const filteredCustomers = useMemo(() => {
    if (!customers || !contracts) return [];
    
    const query = searchTerm.toLowerCase();
    
    return customers.filter((customer) => {
      // Check name or phone search
      const matchesSearch = customer.name.toLowerCase().includes(query) ||
        (customer.phone || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
      
      // If status filter is 'all', include all customers matching search
      if (statusFilter === 'all') return true;
      
      // Check if customer has any contract matching the status filter
      const customerContracts = contracts.filter(c => c.customer_id === customer.id);
      return customerContracts.some(contract => {
        const dynamicStatus = calculateContractStatus(contract);
        return dynamicStatus === statusFilter;
      });
    });
  }, [customers, contracts, searchTerm, statusFilter]);

  // Filter contracts for selected customer based on status filter
  const customerContracts = useMemo(() => {
    if (!contracts || !selectedCustomerId) return [];
    
    const filtered = contracts.filter(c => c.customer_id === selectedCustomerId);
    
    if (statusFilter === 'all') return filtered;
    
    return filtered.filter(contract => {
      const dynamicStatus = calculateContractStatus(contract);
      return dynamicStatus === statusFilter;
    });
  }, [contracts, selectedCustomerId, statusFilter]);

  const { data: payments, isLoading: loadingPayments } = usePaymentsByContract(
    selectedContractId
  );

  // Pagination constants
  const ITEMS_PER_PAGE = 5;
  
  // Add pagination for payments
  const { currentPage, totalPages, paginatedItems: paginatedPayments, goToPage, totalItems } = usePagination(payments, ITEMS_PER_PAGE);

  // Add pagination for customer list
  const { 
    currentPage: customerPage, 
    totalPages: customerTotalPages, 
    paginatedItems: paginatedCustomers, 
    goToPage: goToCustomerPage,
    totalItems: totalCustomers 
  } = usePagination(filteredCustomers, ITEMS_PER_PAGE);

  const selectedContract = contracts?.find((c) => c.id === selectedContractId);
  const progress = selectedContract
    ? (selectedContract.current_installment_index / selectedContract.tenor_days) * 100
    : 0;

  // Get dynamic status for selected contract
  const selectedContractDynamicStatus = selectedContract 
    ? calculateContractStatus(selectedContract) 
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Riwayat Pelanggan</h2>

      <Card>
        <CardHeader>
          <CardTitle>Cari Pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau nomor telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter Toggle */}
            <ToggleGroup 
              type="single" 
              value={statusFilter} 
              onValueChange={(value) => {
                if (value) {
                  setStatusFilter(value as ContractStatusFilter);
                  setSelectedCustomerId("");
                  setSelectedContractId("");
                }
              }}
              className="gap-1 flex-wrap justify-start"
            >
              <ToggleGroupItem value="all" size="sm" className="text-xs px-3">
                Semua
              </ToggleGroupItem>
              <ToggleGroupItem value="lancar" size="sm" className="text-xs px-3 data-[state=on]:bg-green-100 data-[state=on]:text-green-700">
                Lancar
              </ToggleGroupItem>
              <ToggleGroupItem value="kurang_lancar" size="sm" className="text-xs px-3 data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700">
                K. Lancar
              </ToggleGroupItem>
              <ToggleGroupItem value="macet" size="sm" className="text-xs px-3 data-[state=on]:bg-red-100 data-[state=on]:text-red-700">
                Macet
              </ToggleGroupItem>
              <ToggleGroupItem value="completed" size="sm" className="text-xs px-3 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700">
                Lunas
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Show filtered list or all customers with pagination */}
          <ScrollArea className="border rounded-lg h-64">
            <div className="space-y-1 p-2">
              {paginatedCustomers?.map((customer) => {
                // Get contracts for this customer to show status badges
                const custContracts = contracts?.filter(c => c.customer_id === customer.id) || [];
                const statusCounts = custContracts.reduce((acc, c) => {
                  const status = calculateContractStatus(c);
                  acc[status] = (acc[status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                
                return (
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
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          NIK: {customer.nik || "-"} • {custContracts.length} kontrak
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {statusCounts.lancar && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {statusCounts.lancar}
                          </Badge>
                        )}
                        {statusCounts.kurang_lancar && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            {statusCounts.kurang_lancar}
                          </Badge>
                        )}
                        {statusCounts.macet && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {statusCounts.macet}
                          </Badge>
                        )}
                        {statusCounts.completed && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {statusCounts.completed}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!paginatedCustomers || paginatedCustomers.length === 0) && (
                <div className="p-3 text-center text-muted-foreground">
                  {statusFilter !== 'all' 
                    ? `Tidak ada pelanggan dengan status ${statusFilter.replace('_', ' ')}`
                    : 'Pelanggan tidak ditemukan'
                  }
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
                  {customerContracts?.map((contract) => {
                    const contractStatus = calculateContractStatus(contract);
                    return (
                      <SelectItem key={contract.id} value={contract.id}>
                        <div className="flex items-center gap-2">
                          <span>{contract.contract_ref} - {formatRupiah(contract.total_loan_amount)}</span>
                          <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(contractStatus)}`}>
                            {getStatusLabel(contractStatus)}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
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
                  {selectedContractDynamicStatus && (
                    <Badge className={getStatusBadgeClass(selectedContractDynamicStatus)}>
                      {getStatusLabel(selectedContractDynamicStatus)}
                    </Badge>
                  )}
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
                      <TableHead>Kupon</TableHead>
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
