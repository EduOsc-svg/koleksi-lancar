import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Download, Eye, Settings } from "lucide-react";
import ExcelJS from "exceljs";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
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
import { useMonthlyPerformance } from '@/hooks/useMonthlyPerformance';
import { useYearlyFinancialSummary } from '@/hooks/useYearlyFinancialSummary';
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { formatRupiah } from "@/lib/format";
import { SearchInput } from "@/components/ui/search-input";
import { CommissionPaymentDialog } from "@/components/salesAgent/CommissionPaymentDialog";
import { CommissionTiersDialog } from "@/components/salesAgent/CommissionTiersDialog";
import { useCommissionTiers, calculateTieredCommission } from "@/hooks/useCommissionTiers";

export default function SalesAgents() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { data: agents, isLoading } = useSalesAgents();
  const { data: agentOmsetData } = useAgentOmset();
  // period can be 'monthly' | 'yearly' | 'lifetime'
  const periodParam = searchParams.get('period') || 'monthly';
  const monthParam = searchParams.get('month'); // optional yyyy-MM or yyyy-MM-dd
  const yearParam = searchParams.get('year');

  // resolve month/year for hooks
  const selectedMonthForHook = monthParam ? new Date(monthParam) : new Date();
  const selectedYearForHook = yearParam ? new Date(Number(yearParam), 0, 1) : new Date();

  const { data: monthlyData } = useMonthlyPerformance(selectedMonthForHook);
  const { data: yearlyFinancial } = useYearlyFinancialSummary(selectedYearForHook as Date);
  const { data: commissionTiers } = useCommissionTiers();
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
    // Generate next sales agent code based on the most recent pattern
    const generateNextCode = () => {
      if (!agents || agents.length === 0) return "S001";
      
      // Sort agents by creation date to get the most recent pattern
      const sortedAgents = [...agents].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Get the most recent code to determine the pattern
      const recentCode = sortedAgents[0]?.agent_code;
      
      if (!recentCode) return "S001";
      
      // Extract pattern from recent code
      const match = recentCode.match(/^([A-Z]+)(\d+)$/);
      if (!match) {
        // If no pattern found, use default
        return "S001";
      }
      
      const prefix = match[1];
      const numberLength = match[2].length;
      
      // Find all codes with the same prefix
      const existingNumbers = agents
        .map(a => a.agent_code)
        .filter(code => code.startsWith(prefix))
        .map(code => {
          const numMatch = code.match(new RegExp(`^${prefix}(\\d+)$`));
          return numMatch ? parseInt(numMatch[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      const nextNumber = maxNumber + 1;
      return `${prefix}${nextNumber.toString().padStart(numberLength, '0')}`;
    };

    setSelectedAgent(null);
    setFormData({ 
      agent_code: generateNextCode(), 
      name: "", 
      phone: "" 
    });
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
    // Build a period-specific map for quick lookup
    // monthlyData.agents (if period=monthly) and yearlyFinancial.agents (if period=yearly) contain per-agent summaries
    let periodRecord: any = undefined;
    if (periodParam === 'monthly' && monthlyData?.agents) {
      periodRecord = monthlyData.agents.find((a: any) => a.agent_id === agentId || a.agent_code === getAgentCode(agentId));
    } else if (periodParam === 'yearly' && yearlyFinancial?.agents) {
      periodRecord = yearlyFinancial.agents.find((a: any) => a.agent_id === agentId || a.agent_code === getAgentCode(agentId));
    }

    const lifetime = agentOmsetData?.find((d) => d.agent_id === agentId);

    // Normalize fields expected by the UI: total_omset, total_commission, commission_percentage, total_contracts
    const normalized: any = {
      agent_id: agentId,
      agent_name: undefined,
      agent_code: undefined,
      commission_percentage: periodRecord?.commission_percentage ?? lifetime?.commission_percentage ?? 0,
      total_omset: periodRecord?.total_omset ?? lifetime?.total_omset ?? 0,
      total_modal: periodRecord?.total_modal ?? lifetime?.total_modal ?? 0,
      total_contracts: periodRecord?.total_contracts ?? lifetime?.total_contracts ?? 0,
      total_commission: periodRecord?.total_commission ?? lifetime?.total_commission ?? 0,
      booked_total_omset: lifetime?.booked_total_omset,
      booked_total_modal: lifetime?.booked_total_modal,
      booked_contracts_count: lifetime?.booked_contracts_count,
      profit: periodRecord?.profit ?? lifetime?.profit ?? 0,
    };

    return normalized;
  };

  // helper to map agent id -> agent_code (sales agent objects provide code)
  const getAgentCode = (agentId: string) => {
    const ag = agents?.find(a => a.id === agentId);
    return ag?.agent_code;
  }

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

    if (!commissionTiers || commissionTiers.length === 0) {
      toast.error("Ketentuan komisi belum diatur. Silakan atur terlebih dahulu.");
      return;
    }

    // Fetch all contracts + payments for cash-basis realisation per kontrak
    const [
      { data: allContracts, error: contractsError },
      { data: allPayments, error: paymentsError },
    ] = await Promise.all([
      supabase
        .from('credit_contracts')
        .select('id, contract_ref, product_type, omset, total_loan_amount, start_date, sales_agent_id, customers(name, phone)')
        .order('start_date', { ascending: false }),
      supabase.from('payment_logs').select('amount_paid, contract_id'),
    ]);

    if (contractsError || paymentsError) {
      toast.error("Gagal mengambil data kontrak");
      return;
    }

    // Sum pembayaran per kontrak (cash basis)
    const paidByContract = new Map<string, number>();
    (allPayments || []).forEach((p: any) => {
      paidByContract.set(p.contract_id, (paidByContract.get(p.contract_id) || 0) + Number(p.amount_paid || 0));
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Management System Kredit';
    workbook.created = new Date();

    const THIN_BORDER: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };

    // ===== SHEET 1: Semua Sales =====
    const HEADERS_1 = ['No', 'Kode Sales', 'Nama', 'Telepon', 'Komisi % (Dinamis)', 'Total Omset', 'Komisi (Berdasarkan Tier)', 'Jumlah Kontrak'];
    const COL_WIDTHS_1 = [5, 14, 22, 18, 20, 22, 25, 16];

    const ws1 = workbook.addWorksheet('Semua Sales');

    // Title row
    ws1.mergeCells('A1:H1');
    const titleCell = ws1.getCell('A1');
    titleCell.value = 'LAPORAN SALES AGENT';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Date row
    ws1.mergeCells('A2:H2');
    const dateCell = ws1.getCell('A2');
    dateCell.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    dateCell.font = { italic: true, size: 12 };
    dateCell.alignment = { horizontal: 'center' };

    ws1.addRow([]); // spacer

    // Header row
    const hRow1 = ws1.addRow(HEADERS_1);
    hRow1.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = THIN_BORDER;
    });

    const startRow1 = hRow1.number + 1;

    agents.forEach((agent, i) => {
  const rowNum = startRow1 + i;
  const omsetData = getAgentOmset(agent.id);
  // Use booked omset if available so commission follows displayed omset
  const displayOmset = (omsetData?.booked_total_omset ?? omsetData?.total_omset) || 0;
  const dynamicPct = calculateTieredCommission(displayOmset, commissionTiers) / 100;

      const dataRow = ws1.addRow([
        i + 1,
        agent.agent_code,
        agent.name,
        agent.phone || '-',
        dynamicPct,
        displayOmset,
        { formula: `F${rowNum}*E${rowNum}` },
        omsetData?.total_contracts || 0,
      ]);

      dataRow.eachCell((cell, colNumber) => {
        cell.border = THIN_BORDER;
        if (colNumber === 5) {
          cell.numFmt = '0.00%';
          cell.alignment = { horizontal: 'center' };
        } else if ([6, 7].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if ([1, 8].includes(colNumber)) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    // Total row
    if (agents.length > 0) {
      const endRow1 = startRow1 + agents.length - 1;
      const totalRow1 = ws1.addRow([
        '', '', '', 'TOTAL', '',
        { formula: `SUM(F${startRow1}:F${endRow1})` },
        { formula: `SUM(G${startRow1}:G${endRow1})` },
        { formula: `SUM(H${startRow1}:H${endRow1})` },
      ]);
      totalRow1.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
        cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
        if ([6, 7].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 8) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        }
      });
    }

    ws1.columns = COL_WIDTHS_1.map((width) => ({ width }));

    // ===== SHEET 2+: Per Sales Agent (Cash Basis) =====
    // Omset = total sudah dibayar (cash basis), bukan total_loan_amount mentah
    const HEADERS_2 = ['No', 'Tanggal', 'Kode Kontrak', 'Produk', 'Nama Konsumen', 'Telepon Konsumen', 'Omset Tertagih'];
    const COL_WIDTHS_2 = [5, 14, 18, 25, 25, 20, 22];

    agents.forEach((agent) => {
      const agentContracts = (allContracts || []).filter(
        (c: any) => c.sales_agent_id === agent.id
      );

      const safeName = `${agent.agent_code} - ${agent.name}`.substring(0, 31).replace(/[\\/*?[\]:]/g, '');
      const sheet = workbook.addWorksheet(safeName);

      // Title
      sheet.mergeCells('A1:G1');
      const t1 = sheet.getCell('A1');
      t1.value = `LAPORAN DETAIL - ${agent.name.toUpperCase()} (${agent.agent_code})`;
      t1.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      t1.alignment = { horizontal: 'center' };
      t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

      sheet.mergeCells('A2:G2');
      const d1 = sheet.getCell('A2');
      d1.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} (Cash Basis)`;
      d1.font = { italic: true, size: 12 };
      d1.alignment = { horizontal: 'center' };

      sheet.addRow([]);

      const hRow = sheet.addRow(HEADERS_2);
      hRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = THIN_BORDER;
      });

      const startRow = hRow.number + 1;

      agentContracts.forEach((contract: any, idx: number) => {
        const omsetRealized = paidByContract.get(contract.id) || 0;
        const dataRow = sheet.addRow([
          idx + 1,
          contract.start_date,
          contract.contract_ref,
          contract.product_type || '-',
          contract.customers?.name || '-',
          contract.customers?.phone || '-',
          omsetRealized,
        ]);

        dataRow.eachCell((cell, colNumber) => {
          cell.border = THIN_BORDER;
          if (colNumber === 7) {
            cell.numFmt = '"Rp "#,##0';
            cell.alignment = { horizontal: 'right' };
          } else if (colNumber === 1) {
            cell.alignment = { horizontal: 'center' };
          }
        });
      });

      // Total row
      if (agentContracts.length > 0) {
        const endRow = startRow + agentContracts.length - 1;
        const totalRow = sheet.addRow([
          '', '', '', '', '', 'TOTAL',
          { formula: `SUM(G${startRow}:G${endRow})` },
        ]);
        totalRow.eachCell((cell, colNumber) => {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
          cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
          if (colNumber === 7) {
            cell.numFmt = '"Rp "#,##0';
            cell.alignment = { horizontal: 'right' };
          }
        });
      }

      sheet.columns = COL_WIDTHS_2.map((width) => ({ width }));
    });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Sales_Agent_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel berhasil di-export dengan detail per sales agent!");
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
          onClear={() => setSearchQuery("")}
          placeholder="Cari sales agent berdasarkan nama, kode, atau telepon..."
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {searchQuery
            ? `Ditemukan ${totalItems} dari ${agents?.length || 0} sales agent`
            : `Menampilkan ${totalItems} dari ${agents?.length || 0} sales agent`
          }
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
                // Ensure we show a commission value even if the hook didn't compute it
                const fallbackCommission = (() => {
                  const displayOmsetLocal = (omsetData?.booked_total_omset ?? omsetData?.total_omset) || 0;
                  // Try tiered commission first (if tiers present), otherwise use agent fixed pct
                  const dynamicPctLocal = commissionTiers && commissionTiers.length > 0
                    ? calculateTieredCommission(displayOmsetLocal, commissionTiers)
                    : Number(agent.commission_percentage) || 0;
                  const computed = (displayOmsetLocal * (Number(dynamicPctLocal) || 0)) / 100;
                  return computed;
                })();
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
                    <TableCell className="font-medium">{formatRupiah((omsetData?.booked_total_omset ?? omsetData?.total_omset) || 0)}</TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatRupiah( (omsetData?.total_commission && omsetData.total_commission > 0) ? omsetData.total_commission : fallbackCommission )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Lihat Detail Komisi"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setCommissionDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
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
              <div className="flex gap-2">
                <Input
                  id="agent_code"
                  value={formData.agent_code}
                  onChange={(e) => setFormData({ ...formData, agent_code: e.target.value })}
                  placeholder="e.g., S001, B001, D001"
                  className="flex-1"
                />
                {!selectedAgent && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Regenerate code using the same logic as handleOpenCreate
                      const generateNextCode = () => {
                        if (!agents || agents.length === 0) return "S001";
                        
                        const sortedAgents = [...agents].sort((a, b) => 
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                        
                        const recentCode = sortedAgents[0]?.agent_code;
                        if (!recentCode) return "S001";
                        
                        const match = recentCode.match(/^([A-Z]+)(\d+)$/);
                        if (!match) return "S001";
                        
                        const prefix = match[1];
                        const numberLength = match[2].length;
                        
                        const existingNumbers = agents
                          .map(a => a.agent_code)
                          .filter(code => code.startsWith(prefix))
                          .map(code => {
                            const numMatch = code.match(new RegExp(`^${prefix}(\\d+)$`));
                            return numMatch ? parseInt(numMatch[1], 10) : 0;
                          })
                          .filter(num => !isNaN(num));
                        
                        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
                        const nextNumber = maxNumber + 1;
                        return `${prefix}${nextNumber.toString().padStart(numberLength, '0')}`;
                      };
                      
                      setFormData({ ...formData, agent_code: generateNextCode() });
                    }}
                    className="px-3"
                  >
                    Auto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {!selectedAgent 
                  ? "Dapat diinput manual atau klik 'Auto' untuk mengikuti pola kode sebelumnya"
                  : "Kode sales agent"
                }
              </p>
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
