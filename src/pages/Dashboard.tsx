import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollectionTrend } from "@/hooks/useCollectionTrend";
import { useMonthlyPerformance, useYearlyTarget } from "@/hooks/useMonthlyPerformance";
import { useOperationalExpenses, useOperationalExpenseMutations, OperationalExpenseInput } from "@/hooks/useOperationalExpenses";
import { useAgentContractHistory } from "@/hooks/useAgentPerformance";
import { formatRupiah } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, ChevronRight, ArrowLeft, DollarSign, Target, Wallet, Percent, Calendar, Plus, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { StatCard } from "@/components/dashboard/StatCard";
import { toast } from "sonner";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date());
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string; code: string } | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<OperationalExpenseInput>({
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: 0,
    category: '',
    notes: '',
  });
  
  // Data hooks
  const { data: trendData, isLoading: isLoadingTrend } = useCollectionTrend(30);
  const { data: monthlyData, isLoading: isLoadingMonthly } = useMonthlyPerformance(selectedMonth);
  const { data: yearlyData, isLoading: isLoadingYearly } = useYearlyTarget(selectedYear);
  const { data: expenses, isLoading: isLoadingExpenses } = useOperationalExpenses(selectedMonth);
  const { data: historyData, isLoading: isLoadingHistory } = useAgentContractHistory(selectedAgent?.id || null);
  const { createExpense, deleteExpense } = useOperationalExpenseMutations();
  
  // Pagination for contract history
  const paginatedHistoryData = useMemo(() => historyData || [], [historyData]);
  const { currentPage, totalPages, paginatedItems: paginatedHistory, goToPage, totalItems } = usePagination(paginatedHistoryData, 5);

  // Calculate totals with operational expenses
  const totalExpenses = useMemo(() => {
    return expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) ?? 0;
  }, [expenses]);

  const netProfit = useMemo(() => {
    return (monthlyData?.total_profit ?? 0) - totalExpenses;
  }, [monthlyData?.total_profit, totalExpenses]);

  // Collection trend totals
  const totalCollection = trendData?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const avgDaily = trendData && trendData.length > 0 ? totalCollection / trendData.length : 0;

  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';

  // Month navigation
  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  // Year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // Handle add expense
  const handleAddExpense = async () => {
    if (!newExpense.description || newExpense.amount <= 0) return;
    await createExpense.mutateAsync(newExpense);
    setNewExpense({
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      amount: 0,
      category: '',
      notes: '',
    });
    setExpenseDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(selectedMonth, 'MMMM yyyy', { locale: idLocale })}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={DollarSign}
          iconColor="text-blue-500"
          label={t("dashboard.totalModal", "Total Modal")}
          value={monthlyData?.total_modal ?? 0}
          onDetailClick={() => toast.info("Fitur detail modal sedang dikembangkan")}
        />
        
        <StatCard
          icon={Wallet}
          iconColor="text-indigo-500"
          label={t("dashboard.omset", "Omset")}
          value={monthlyData?.total_omset ?? 0}
          onDetailClick={() => toast.info("Fitur detail omset sedang dikembangkan")}
        />

        <StatCard
          icon={TrendingUp}
          iconColor="text-green-500"
          label={t("dashboard.profit", "Keuntungan")}
          value={monthlyData?.total_profit ?? 0}
          valueColor="text-green-600"
          subtitle="Sebelum operasional"
          onDetailClick={() => toast.info("Fitur detail keuntungan sedang dikembangkan")}
        />

        <StatCard
          icon={Settings}
          iconColor="text-orange-500"
          label="Biaya Operasional"
          value={totalExpenses}
          valueColor="text-orange-600"
          isNegative
          onDetailClick={() => setExpenseDialogOpen(true)}
        />

        <StatCard
          icon={Percent}
          iconColor="text-purple-500"
          label={t("dashboard.totalCommission", "Total Komisi")}
          value={monthlyData?.total_commission ?? 0}
          valueColor="text-purple-600"
          onDetailClick={() => toast.info("Fitur detail komisi sedang dikembangkan")}
        />

        <StatCard
          icon={Percent}
          iconColor="text-emerald-500"
          label={t("dashboard.profitMargin", "Margin")}
          value={monthlyData?.profit_margin ?? 0}
          valueColor="text-emerald-600"
          isPercentage
          onDetailClick={() => toast.info("Fitur detail margin sedang dikembangkan")}
        />
      </div>

      {/* Net Profit Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Keuntungan Bersih (Setelah Operasional)</p>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatRupiah(netProfit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Periode</p>
              <p className="font-medium">{format(selectedMonth, 'MMMM yyyy', { locale: idLocale })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Target Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              <CardTitle>Target Penagihan Tahunan</CardTitle>
            </div>
            <Select
              value={selectedYear.getFullYear().toString()}
              onValueChange={(val) => setSelectedYear(new Date(parseInt(val), 0, 1))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingYearly ? (
            <Skeleton className="h-[100px] w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Harus Ditagih</p>
                <p className="text-xl font-bold text-orange-600">{formatRupiah(yearlyData?.total_to_collect ?? 0)}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sudah Tertagih</p>
                <p className="text-xl font-bold text-green-600">{formatRupiah(yearlyData?.total_collected ?? 0)}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tingkat Penagihan</p>
                <p className="text-xl font-bold text-blue-600">{(yearlyData?.collection_rate ?? 0).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collection Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.collectionTrend")} - 30 {t("dashboard.days", "Hari")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {formatRupiah(totalCollection)} | {t("dashboard.avgDaily", "Rata-rata Harian")}: {formatRupiah(avgDaily)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoadingTrend ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} 
                    className="text-xs" 
                  />
                  <Tooltip
                    formatter={(value: number) => [formatRupiah(value), t("dashboard.collection", "Penagihan")]}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString(locale, { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operational Expenses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              <CardTitle>Biaya Operasional - {format(selectedMonth, 'MMMM yyyy', { locale: idLocale })}</CardTitle>
            </div>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Biaya Operasional</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tanggal</label>
                    <Input
                      type="date"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Deskripsi</label>
                    <Input
                      placeholder="Contoh: Bensin, Pulsa, dll"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Kategori (Opsional)</label>
                    <Input
                      placeholder="Contoh: Transport, Komunikasi"
                      value={newExpense.category || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Jumlah</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newExpense.amount || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Catatan (Opsional)</label>
                    <Textarea
                      placeholder="Catatan tambahan..."
                      value={newExpense.notes || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddExpense} disabled={createExpense.isPending} className="w-full">
                    {createExpense.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingExpenses ? (
            <Skeleton className="h-[150px] w-full" />
          ) : expenses && expenses.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="text-muted-foreground">{expense.category || '-'}</TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">
                        {formatRupiah(expense.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                        {expense.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExpense.mutate(expense.id)}
                          disabled={deleteExpense.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada biaya operasional bulan ini
            </div>
          )}
          {expenses && expenses.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Operasional</p>
                <p className="text-xl font-bold text-orange-600">{formatRupiah(totalExpenses)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Agent Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>{t("dashboard.salesPerformance", "Performa Sales Agent")} - {format(selectedMonth, 'MMMM yyyy', { locale: idLocale })}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.clickToViewHistory", "Klik untuk melihat kontrak yang didapat")}
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingMonthly ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{t("dashboard.agentCode", "Kode Sales")}</TableHead>
                    <TableHead className="text-right">{t("dashboard.modal", "Modal")}</TableHead>
                    <TableHead className="text-right">{t("dashboard.omset", "Omset")}</TableHead>
                    <TableHead className="text-right">{t("dashboard.profit", "Keuntungan")}</TableHead>
                    <TableHead className="text-right">{t("dashboard.profitMargin", "Margin %")}</TableHead>
                    <TableHead className="text-right">{t("dashboard.commission", "Komisi")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData?.agents?.map((agent, index) => (
                    <TableRow 
                      key={agent.agent_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedAgent({ id: agent.agent_id, name: agent.agent_name, code: agent.agent_code })}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{agent.agent_code}</p>
                          <p className="text-xs text-muted-foreground">{agent.agent_name} • {agent.commission_percentage}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-blue-600">{formatRupiah(agent.total_modal)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(agent.total_omset)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatRupiah(agent.profit)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{agent.profit_margin.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-purple-600">{formatRupiah(agent.total_commission)}</TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!monthlyData?.agents || monthlyData.agents.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {t("dashboard.noAgentData", "Belum ada data sales agent bulan ini")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Contract History Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {t("dashboard.contractHistory", "Kontrak Didapat")} - {selectedAgent?.code} ({selectedAgent?.name})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {isLoadingHistory ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("dashboard.startDate", "Tanggal Mulai")}</TableHead>
                      <TableHead>{t("dashboard.contract", "Kontrak")}</TableHead>
                      <TableHead>{t("dashboard.customerCode", "Kode Pelanggan")}</TableHead>
                      <TableHead>{t("dashboard.product", "Produk")}</TableHead>
                      <TableHead className="text-right">{t("dashboard.modal", "Modal")}</TableHead>
                      <TableHead className="text-right">{t("dashboard.omset", "Omset")}</TableHead>
                      <TableHead className="text-right">{t("dashboard.profit", "Keuntungan")}</TableHead>
                      <TableHead className="text-center">{t("dashboard.status", "Status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(item.start_date).toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.contract_ref}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.customer_code || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{item.customer_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.product_type || '-'}</TableCell>
                        <TableCell className="text-right text-blue-600">{formatRupiah(item.modal)}</TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(item.omset)}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">{formatRupiah(item.profit)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'active' ? 'bg-green-100 text-green-700' : 
                            item.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!paginatedHistory || paginatedHistory.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {t("dashboard.noData", "Tidak ada data kontrak")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {totalItems > 5 && (
                  <div className="mt-4">
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      totalItems={totalItems}
                    />
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
