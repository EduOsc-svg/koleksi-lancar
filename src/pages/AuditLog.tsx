import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActivityLogs } from "@/hooks/useActivityLog";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { formatDate } from "@/lib/format";
import { Search, Shield } from "lucide-react";

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-600 border-green-500/20",
  UPDATE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  PAYMENT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const getActionColor = (action: string) => {
  const upperAction = action.toUpperCase();
  return actionColors[upperAction] || "bg-muted text-muted-foreground";
};

export default function AuditLog() {
  const { data: logs, isLoading } = useActivityLogs(500);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs?.filter((log) => {
    const search = searchTerm.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      log.description.toLowerCase().includes(search)
    );
  });

  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(filteredLogs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Audit Log</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.user_name || 'System'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.user_role || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {log.entity_type}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.description}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={totalItems}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
