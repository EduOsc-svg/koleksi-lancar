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

  const selectedContract = contracts?.find((c) => c.id === selectedContractId);
  const progress = selectedContract
    ? (selectedContract.current_installment_index / selectedContract.tenor_days) * 100
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customer History</h2>

      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchTerm && filteredCustomers && filteredCustomers.length > 0 && (
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setSelectedContractId("");
                    setSearchTerm("");
                  }}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Route: {customer.routes?.code} | Agent: {customer.sales_agents?.name || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCustomerId && (
            <div>
              <Select
                value={selectedContractId}
                onValueChange={setSelectedContractId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
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
              <CardTitle>Loan Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract</p>
                    <p className="font-medium">{selectedContract.contract_ref}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Loan</p>
                    <p className="font-medium">{formatRupiah(selectedContract.total_loan_amount)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {selectedContract.current_installment_index} / {selectedContract.tenor_days} paid
                    </span>
                  </div>
                  <Progress value={progress} className="h-4" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Paid: {formatRupiah(selectedContract.current_installment_index * selectedContract.daily_installment_amount)}
                    </span>
                    <span>
                      Remaining: {formatRupiah((selectedContract.tenor_days - selectedContract.current_installment_index) * selectedContract.daily_installment_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant={selectedContract.status === "active" ? "default" : "secondary"}>
                    {selectedContract.status === "active" ? "Lancar" : "Completed"}
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
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Coupon #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayments ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : payments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No payments yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments?.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Badge variant="outline">{payment.installment_index}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatRupiah(Number(payment.amount_paid))}
                          </TableCell>
                          <TableCell>{payment.sales_agents?.name || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedCustomerId && (
        <div className="text-center py-12 text-muted-foreground">
          Search for a customer to view their loan history
        </div>
      )}
    </div>
  );
}
