import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Download, Wallet, Settings } from "lucide-react";
import ExcelJS from "exceljs";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  useSalesAgents,
  useCreateSalesAgent,
  useUpdateSalesAgent,
  useDeleteSalesAgent,
  SalesAgent,
} from "@/hooks/useSalesAgents";
import { useAgentOmset } from "@/hooks/useAgentOmset";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { formatRupiah } from "@/lib/format";
import { SearchInput } from "@/components/ui/search-input";
import { CommissionPaymentDialog } from "@/components/salesAgent/CommissionPaymentDialog";
import { CommissionTiersDialog } from "@/components/salesAgent/CommissionTiersDialog";

export default function SalesAgents() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { data: agents, isLoading } = useSalesAgents();
  const { data: agentOmsetData } = useAgentOmset();
  const createAgent = useCreateSalesAgent();
  const updateAgent = useUpdateSalesAgent();
  const deleteAgent = useDeleteSalesAgent();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter agents based on search query
  const filteredAgents = agents?.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.agent_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.phone && agent.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  const ITEMS_PER_PAGE = 5;
  const { currentPage, totalPages, paginatedItems, goToPage, totalItems } = usePagination(filteredAgents, ITEMS_PER_PAGE);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [tiersDialogOpen, setTiersDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<SalesAgent | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  const [formData, setFormData] = useState({ agent_code: "", name: "", phone: "" });

  // Handle highlighting item from global search
  useEffect(() => {
    if (highlightId && agents?.length) {
      const targetAgent = agents.find(a => a.id === highlightId);
      if (targetAgent) {
        setHighlightedRowId(highlightId);
        
        // Find the page where this agent is located
        const agentIndex = agents.findIndex(a => a.id === highlightId);
        const targetPage = Math.floor(agentIndex / 5) + 1;
        
        // Navigate to the correct page
        if (targetPage !== currentPage) {
          goToPage(targetPage);
        }
        
        // Auto scroll and highlight
        setTimeout(() => {
          if (highlightedRowRef.current) {
            highlightedRowRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedRowId(null);
            // Remove highlight parameter from URL
            searchParams.delete('highlight');
            setSearchParams(searchParams, { replace: true });
          }, 3000);
        }, 100);
      }
    }
  }, [highlightId, agents, currentPage, goToPage, searchParams, setSearchParams]);

  const handleOpenCreate = () => {
    setSelectedAgent(null);
    setFormData({ agent_code: "", name: "", phone: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (agent: SalesAgent) => {
    setSelectedAgent(agent);
    setFormData({
      agent_code: agent.agent_code,
      name: agent.name,
      phone: agent.phone || "",
    });
    setDialogOpen(true);
  };

  const getAgentOmset = (agentId: string) => {
    return agentOmsetData?.find((d) => d.agent_id === agentId);
  };

  const handleSubmit = async () => {
    try {
      if (selectedAgent) {
        await updateAgent.mutateAsync({ id: selectedAgent.id, ...formData });
        toast.success(t("success.updated"));
      } else {
        await createAgent.mutateAsync(formData);
        toast.success(t("success.created"));
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(t("errors.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    try {
      await deleteAgent.mutateAsync(selectedAgent.id);
      toast.success(t("success.deleted"));
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t("errors.deleteFailed"));
    }
  };

  const handleExportExcel = async () => {
    if (!agents || agents.length === 0) {
      toast.error(t("common.noData"));
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Agents");

    // Define columns with keys
    // A: Kode Agent, B: Nama, C: Telepon, D: Komisi %, E: Total Omset, F: Total Modal, G: Profit, H: Komisi, I: Jumlah Kontrak
    worksheet.columns = [
      { header: t("salesAgents.agentCode"), key: "agent_code", width: 15 },
      { header: t("salesAgents.name"), key: "name", width: 25 },
      { header: t("salesAgents.phone"), key: "phone", width: 20 },
      { header: t("salesAgents.commissionPct", "Komisi %"), key: "commission_percentage", width: 15 },
      { header: t("salesAgents.totalOmset", "Total Omset"), key: "total_omset", width: 20 },
      { header: t("salesAgents.totalModal", "Total Modal"), key: "total_modal", width: 20 },
      { header: t("salesAgents.profit", "Keuntungan"), key: "profit", width: 20 },
      { header: t("salesAgents.earnings", "Komisi"), key: "total_commission", width: 20 },
      { header: t("salesAgents.totalContracts", "Jumlah Kontrak"), key: "total_contracts", width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data rows with formulas
    agents.forEach((agent, index) => {
      const omsetData = getAgentOmset(agent.id);
      const rowNumber = index + 2; // Row 1 is header, data starts from row 2
      
      worksheet.addRow({
        agent_code: agent.agent_code,
        name: agent.name,
        phone: agent.phone || "-",
        commission_percentage: (agent.commission_percentage || 0) / 100, // Store as decimal for formula
        total_omset: omsetData?.total_omset || 0,
        total_modal: omsetData?.total_modal || 0,
        profit: null, // Will be set as formula
        total_commission: null, // Will be set as formula
        total_contracts: omsetData?.total_contracts || 0,
      });
      
      // Set dynamic formulas
      // Profit = Total Omset - Total Modal (Column E - Column F)
      worksheet.getCell(`G${rowNumber}`).value = { formula: `E${rowNumber}-F${rowNumber}` };
      
      // Komisi = Profit * Komisi % (Column G * Column D)
      worksheet.getCell(`H${rowNumber}`).value = { formula: `G${rowNumber}*D${rowNumber}` };
    });

    // Add total row with SUM formulas
    const lastDataRow = agents.length + 1;
    const totalRowNumber = lastDataRow + 1;
    
    const totalRow = worksheet.addRow({
      agent_code: "TOTAL",
      name: "",
      phone: "",
      commission_percentage: null,
      total_omset: null,
      total_modal: null,
      profit: null,
      total_commission: null,
      total_contracts: null,
    });
    
    // Set SUM formulas for total row
    worksheet.getCell(`E${totalRowNumber}`).value = { formula: `SUM(E2:E${lastDataRow})` };
    worksheet.getCell(`F${totalRowNumber}`).value = { formula: `SUM(F2:F${lastDataRow})` };
    worksheet.getCell(`G${totalRowNumber}`).value = { formula: `SUM(G2:G${lastDataRow})` };
    worksheet.getCell(`H${totalRowNumber}`).value = { formula: `SUM(H2:H${lastDataRow})` };
    worksheet.getCell(`I${totalRowNumber}`).value = { formula: `SUM(I2:I${lastDataRow})` };
    
    // Style total row
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2EFDA" },
    };

    // Format columns
    worksheet.getColumn("commission_percentage").numFmt = "0.00%"; // Display as percentage
    worksheet.getColumn("total_omset").numFmt = "#,##0";
    worksheet.getColumn("total_modal").numFmt = "#,##0";
    worksheet.getColumn("profit").numFmt = "#,##0";
    worksheet.getColumn("total_commission").numFmt = "#,##0";

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-agents-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("common.exportSuccess", "Data berhasil di-export"));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("salesAgents.title")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTiersDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" /> Ketentuan Komisi
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("salesAgents.newAgent")}
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex justify-between items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari sales agent berdasarkan nama, kode, atau telepon..."
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          Menampilkan {totalItems} dari {agents?.length || 0} sales agent
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("salesAgents.agentCode")}</TableHead>
              <TableHead>{t("salesAgents.name")}</TableHead>
              <TableHead>{t("salesAgents.phone")}</TableHead>
              <TableHead>{t("salesAgents.totalOmset", "Total Omset")}</TableHead>
              <TableHead>{t("salesAgents.earnings", "Komisi")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">{t("common.loading")}</TableCell>
              </TableRow>
            ) : filteredAgents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? `Tidak ada sales agent yang ditemukan dengan kata kunci "${searchQuery}"` : t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((agent) => {
                const omsetData = getAgentOmset(agent.id);
                return (
                  <TableRow 
                    key={agent.id}
                    ref={highlightedRowId === agent.id ? highlightedRowRef : null}
                    className={cn(
                      highlightedRowId === agent.id && "bg-accent border-primary/30 animate-pulse"
                    )}
                  >
                    <TableCell className="font-medium">{agent.agent_code}</TableCell>
                    <TableCell>{agent.name}</TableCell>
                    <TableCell>{agent.phone || "-"}</TableCell>
                    <TableCell className="font-medium">{formatRupiah(omsetData?.total_omset || 0)}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatRupiah(omsetData?.total_commission || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Kelola Komisi"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setCommissionDialogOpen(true);
                        }}
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(agent)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAgent ? t("salesAgents.editAgent") : t("salesAgents.newAgent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent_code">{t("salesAgents.agentCode")}</Label>
              <Input
                id="agent_code"
                value={formData.agent_code}
                onChange={(e) => setFormData({ ...formData, agent_code: e.target.value })}
                placeholder="e.g., S, B, D"
              />
            </div>
            <div>
              <Label htmlFor="name">{t("salesAgents.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("salesAgents.name")}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("salesAgents.phone")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("salesAgents.phone")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createAgent.isPending || updateAgent.isPending}>
              {selectedAgent ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")} {t("salesAgents.title")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("contracts.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Commission Payment Dialog */}
      {selectedAgent && (
        <CommissionPaymentDialog
          open={commissionDialogOpen}
          onOpenChange={setCommissionDialogOpen}
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          agentCode={selectedAgent.agent_code}
        />
      )}

      {/* Commission Tiers Dialog */}
      <CommissionTiersDialog
        open={tiersDialogOpen}
        onOpenChange={setTiersDialogOpen}
      />
    </div>
  );
}
