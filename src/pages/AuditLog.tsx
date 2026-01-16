import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useActivityLogs, ActivityLog } from "@/hooks/useActivityLog";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { formatAuditDetails } from "@/lib/formatAuditDetails";
import { translateAuditDescription } from "@/lib/translateAuditDescription";
import { Search, Shield, Info, Eye } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";

// Format currency values in description text
const formatDescriptionWithCurrency = (description: string): string => {
  // Match numbers that are likely currency (6+ digits or specific patterns)
  return description.replace(/\b(\d{6,})\b/g, (match) => {
    const num = parseInt(match, 10);
    if (!isNaN(num) && num >= 100000) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    }
    return match;
  });
};

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
  const { t, i18n } = useTranslation();
  const { data: logs, isLoading } = useActivityLogs(500);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const filteredLogs = logs?.filter((log) => {
    const search = searchTerm.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      log.description.toLowerCase().includes(search)
    );
  });

  const ITEMS_PER_PAGE = 10;
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(filteredLogs, ITEMS_PER_PAGE);

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleViewDescription = (log: ActivityLog) => {
    setSelectedLog(log);
    setDescriptionDialogOpen(true);
  };

  const formattedSelectedDetails = selectedLog ? formatAuditDetails(selectedLog.details) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{t("auditLog.title")}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("auditLog.activityHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>{t("common.search")}</Label>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t("auditLog.searchPlaceholder")}
              className="mt-1"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("auditLog.timestamp")}</TableHead>
                  <TableHead>{t("auditLog.user")}</TableHead>
                  <TableHead>{t("auditLog.role")}</TableHead>
                  <TableHead>{t("auditLog.action")}</TableHead>
                  <TableHead>{t("auditLog.entity")}</TableHead>
                  <TableHead>{t("auditLog.description")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {t("auditLog.noLogs")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((log) => {
                    const translatedDescription = translateAuditDescription(log.description, i18n.language);
                    const formattedDescription = formatDescriptionWithCurrency(translatedDescription);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.user_name || t("auditLog.system")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.user_role || t("auditLog.unknown")}
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
                        <TableCell className="max-w-[200px]">
                          <div className="flex items-center gap-1">
                            <span className="truncate flex-1 text-sm">
                              {formattedDescription.length > 20 
                                ? `${formattedDescription.slice(0, 20)}...`
                                : formattedDescription}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleViewDescription(log)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Detail Modal */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t("auditLog.detailTitle")}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Log Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm border-b pb-4">
                <div>
                  <span className="text-muted-foreground">{t("auditLog.timestamp")}:</span>
                  <p className="font-medium">{new Date(selectedLog.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("auditLog.user")}:</span>
                  <p className="font-medium">{selectedLog.user_name || t("auditLog.system")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("auditLog.action")}:</span>
                  <Badge className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("auditLog.entity")}:</span>
                  <p className="font-medium capitalize">{selectedLog.entity_type}</p>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <span className="text-sm text-muted-foreground">{t("auditLog.description")}:</span>
                <p className="font-medium">{formatDescriptionWithCurrency(translateAuditDescription(selectedLog.description, i18n.language))}</p>
              </div>

              {/* Details */}
              {formattedSelectedDetails.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">{t("auditLog.details")}</h4>
                  <div className="space-y-2">
                    {formattedSelectedDetails.map(({ key, value }, idx) => (
                      <div key={idx} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Description Modal */}
      <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t("auditLog.fullDescription")}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge>
                <span>•</span>
                <span className="capitalize">{selectedLog.entity_type}</span>
                <span>•</span>
                <span>{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{formatDescriptionWithCurrency(translateAuditDescription(selectedLog.description, i18n.language))}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
