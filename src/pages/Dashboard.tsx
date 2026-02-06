import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDailyCollectionTrend, useMonthlyCollectionTrend, useYearlyCollectionTrend, TrendPeriod } from "@/hooks/useCollectionTrendPeriods";
import { useMonthlyPerformance, useYearlyTarget } from "@/hooks/useMonthlyPerformance";
import { useYearlyFinancialSummary } from "@/hooks/useYearlyFinancialSummary";
import { useOperationalExpenses, useOperationalExpenseMutations, OperationalExpenseInput } from "@/hooks/useOperationalExpenses";
import { useAgentContractHistory } from "@/hooks/useAgentPerformance";
import { formatRupiah } from "@/lib/format";
import { exportYearlyReportToExcel } from "@/lib/exportYearlyReport";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, ChevronRight, ArrowLeft, DollarSign, Target, Wallet, Percent, Calendar, Plus, Trash2, Settings, FileSpreadsheet, BarChart3, CheckCircle, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  
  // Trend period and range state
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('daily');
  const [trendDays, setTrendDays] = useState(30);
  const [trendMonths, setTrendMonths] = useState(12);
  const [trendYears, setTrendYears] = useState(5);
  
  // Data hooks - all trend hooks called unconditionally
  const { data: dailyTrendData, isLoading: isLoadingDailyTrend } = useDailyCollectionTrend(trendDays);
  const { data: monthlyTrendData, isLoading: isLoadingMonthlyTrend } = useMonthlyCollectionTrend(trendMonths);
  const { data: yearlyTrendData, isLoading: isLoadingYearlyTrend } = useYearlyCollectionTrend(trendYears);
  
  const { data: monthlyData, isLoading: isLoadingMonthly } = useMonthlyPerformance(selectedMonth);
  const { data: yearlyData, isLoading: isLoadingYearly } = useYearlyTarget(selectedYear);
  const { data: yearlyFinancial, isLoading: isLoadingYearlyFinancial } = useYearlyFinancialSummary(selectedYear);
  const { data: expenses, isLoading: isLoadingExpenses } = useOperationalExpenses(selectedMonth);
  const { data: historyData, isLoading: isLoadingHistory } = useAgentContractHistory(selectedAgent?.id || null);
  const { createExpense, deleteExpense } = useOperationalExpenseMutations();
  
  // Pagination for contract history
  const HISTORY_ITEMS_PER_PAGE = 5;
  const paginatedHistoryData = useMemo(() => historyData || [], [historyData]);
  const { currentPage, totalPages, paginatedItems: paginatedHistory, goToPage, totalItems } = usePagination(paginatedHistoryData, HISTORY_ITEMS_PER_PAGE);

  // Calculate totals with operational expenses
  const totalExpenses = useMemo(() => {
    return expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) ?? 0;
  }, [expenses]);

  const netProfit = useMemo(() => {
    return (monthlyData?.total_profit ?? 0) - totalExpenses;
  }, [monthlyData?.total_profit, totalExpenses]);

  // Active trend data based on period
  const activeTrendData = useMemo(() => {
    switch (trendPeriod) {
      case 'monthly': return monthlyTrendData || [];
      case 'yearly': return yearlyTrendData || [];
      default: return dailyTrendData || [];
    }
  }, [trendPeriod, dailyTrendData, monthlyTrendData, yearlyTrendData]);

  const isLoadingTrend = trendPeriod === 'daily' ? isLoadingDailyTrend 
    : trendPeriod === 'monthly' ? isLoadingMonthlyTrend 
    : isLoadingYearlyTrend;

  // Collection trend totals
  const totalCollection = activeTrendData.reduce((sum, d) => sum + d.amount, 0);
  const avgPerPeriod = activeTrendData.length > 0 ? totalCollection / activeTrendData.length : 0;

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

  // Handle export to Excel
  const handleExportYearlyReport = async () => {
    if (!yearlyFinancial) {
      toast.error('Data tahunan belum tersedia');
      return;
    }
    try {
      await exportYearlyReportToExcel(yearlyFinancial, selectedYear.getFullYear());
      toast.success('Laporan tahunan berhasil diexport');
    } catch (error) {
      toast.error('Gagal mengexport laporan');
      console.error(error);
    }
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
          label="Total Modal"
          value={monthlyData?.total_modal ?? 0}
        />
        
        <StatCard
          icon={Wallet}
          iconColor="text-indigo-500"
          label="Omset"
          value={monthlyData?.total_omset ?? 0}
        />

        <StatCard
          icon={TrendingUp}
          iconColor="text-green-500"
          label="Keuntungan"
          value={monthlyData?.total_profit ?? 0}
          valueColor="text-green-600"
          subtitle="Sebelum operasional"
        />

        <StatCard
          icon={Settings}
          iconColor="text-orange-500"
          label="Biaya Operasional"
          value={totalExpenses}
          valueColor="text-orange-600"
          isNegative
        />

        <StatCard
          icon={Percent}
          iconColor="text-purple-500"
          label="Total Komisi"
          value={monthlyData?.total_commission ?? 0}
          valueColor="text-purple-600"
        />

        <StatCard
          icon={Percent}
          iconColor="text-emerald-500"
          label="Margin"
          value={monthlyData?.profit_margin ?? 0}
          valueColor="text-emerald-600"
          isPercentage
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

      {/* Collection Trend Chart - Trading Style */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Period Toggle - Trading Style */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {t("dashboard.collectionTrend")}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Total: {formatRupiah(totalCollection)} | {trendPeriod === 'daily' ? t("dashboard.avgDaily", "Rata-rata Harian") : trendPeriod === 'monthly' ? 'Rata-rata Bulanan' : 'Rata-rata Tahunan'}: {formatRupiah(avgPerPeriod)}
                </p>
              </div>
              <ToggleGroup 
                type="single" 
                value={trendPeriod} 
                onValueChange={(value) => value && setTrendPeriod(value as TrendPeriod)}
                className="bg-muted p-1 rounded-lg"
              >
                <ToggleGroupItem value="daily" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                  1H (Harian)
                </ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                  1B (Bulanan)
                </ToggleGroupItem>
                <ToggleGroupItem value="yearly" className="text-xs px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                  1T (Tahunan)
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {/* Period-specific slider */}
            <div className="flex items-center gap-4">
              {trendPeriod === 'daily' && (
                <>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">7 Hari</span>
                  <Slider
                    value={[trendDays]}
                    onValueChange={(value) => setTrendDays(value[0])}
                    min={7}
                    max={90}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">90 Hari</span>
                  <span className="text-sm font-medium text-primary ml-2">{trendDays}H</span>
                </>
              )}
              {trendPeriod === 'monthly' && (
                <>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">3 Bulan</span>
                  <Slider
                    value={[trendMonths]}
                    onValueChange={(value) => setTrendMonths(value[0])}
                    min={3}
                    max={24}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">24 Bulan</span>
                  <span className="text-sm font-medium text-primary ml-2">{trendMonths}B</span>
                </>
              )}
              {trendPeriod === 'yearly' && (
                <>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">2 Tahun</span>
                  <Slider
                    value={[trendYears]}
                    onValueChange={(value) => setTrendYears(value[0])}
                    min={2}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">10 Tahun</span>
                  <span className="text-sm font-medium text-primary ml-2">{trendYears}T</span>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div 
              className="h-[300px] p-6" 
              style={{ 
                minWidth: trendPeriod === 'daily' 
                  ? `${Math.max(800, activeTrendData.length * 25)}px` 
                  : trendPeriod === 'monthly' 
                    ? `${Math.max(600, activeTrendData.length * 60)}px`
                    : '100%'
              }}
            >
              {isLoadingTrend ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="label" 
                      className="text-xs"
                      interval={0}
                      angle={trendPeriod === 'monthly' ? -45 : 0}
                      textAnchor={trendPeriod === 'monthly' ? 'end' : 'middle'}
                      height={trendPeriod === 'monthly' ? 60 : 30}
                    />
                    <YAxis 
                      tickFormatter={(v) => v >= 1000000000 ? `${(v / 1000000000).toFixed(1)}B` : `${(v / 1000000).toFixed(1)}M`} 
                      className="text-xs" 
                    />
                    <Tooltip
                      formatter={(value: number) => [formatRupiah(value), t("dashboard.collection", "Penagihan")]}
                      labelFormatter={(label) => label}
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
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: trendPeriod === 'daily' ? 3 : 4 }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
                    <CurrencyInput
                      placeholder="Rp 0"
                      value={newExpense.amount || 0}
                      onValueChange={(val) => setNewExpense({ ...newExpense, amount: val || 0 })}
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

      {/* Yearly Financial Summary Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              <CardTitle>Kalkulasi Keuangan Tahunan</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedYear.getFullYear().toString()}
                onValueChange={(val) => setSelectedYear(new Date(parseInt(val), 0, 1))}
              >
                <SelectTrigger className="w-[140px] bg-background">
                  <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md">
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      <span className="font-medium">{year}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportYearlyReport}
                disabled={isLoadingYearlyFinancial || !yearlyFinancial}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingYearlyFinancial ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <>
              {/* Summary Cards - Using StatCard like monthly */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                  icon={DollarSign}
                  iconColor="text-blue-500"
                  label="Total Modal"
                  value={yearlyFinancial?.total_modal ?? 0}
                  subtitle={`Tahun ${selectedYear.getFullYear()}`}
                  hoverInfo={`${yearlyFinancial?.contracts_count ?? 0} kontrak (${yearlyFinancial?.completed_count ?? 0} lunas, ${yearlyFinancial?.active_count ?? 0} aktif)`}
                />
                
                <StatCard
                  icon={Wallet}
                  iconColor="text-indigo-500"
                  label="Total Omset"
                  value={yearlyFinancial?.total_omset ?? 0}
                  subtitle={`Tahun ${selectedYear.getFullYear()}`}
                  hoverInfo={`${yearlyFinancial?.contracts_count ?? 0} kontrak (${yearlyFinancial?.completed_count ?? 0} lunas)`}
                />

                <StatCard
                  icon={TrendingUp}
                  iconColor="text-green-500"
                  label="Keuntungan Kotor"
                  value={yearlyFinancial?.total_profit ?? 0}
                  valueColor="text-green-600"
                  subtitle={`Tahun ${selectedYear.getFullYear()}`}
                  hoverInfo={`Margin: ${yearlyFinancial?.profit_margin?.toFixed(1) ?? 0}%`}
                />

                <StatCard
                  icon={Percent}
                  iconColor="text-purple-500"
                  label="Total Komisi"
                  value={yearlyFinancial?.total_commission ?? 0}
                  valueColor="text-purple-600"
                  subtitle={`Tahun ${selectedYear.getFullYear()}`}
                  hoverInfo={`Dari ${yearlyFinancial?.contracts_count ?? 0} kontrak`}
                />

                <StatCard
                  icon={Settings}
                  iconColor="text-orange-500"
                  label="Biaya Operasional"
                  value={yearlyFinancial?.total_expenses ?? 0}
                  valueColor="text-orange-600"
                  isNegative
                  subtitle={`Tahun ${selectedYear.getFullYear()}`}
                />

                <StatCard
                  icon={CheckCircle}
                  iconColor={(yearlyFinancial?.net_profit ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}
                  label="Keuntungan Bersih"
                  value={yearlyFinancial?.net_profit ?? 0}
                  valueColor={(yearlyFinancial?.net_profit ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}
                  subtitle={`Tahun ${selectedYear.getFullYear()}`}
                  hoverInfo={`Lunas: ${yearlyFinancial?.completed_count ?? 0} | Aktif: ${yearlyFinancial?.active_count ?? 0}`}
                />
              </div>

              {/* Monthly Breakdown Chart */}
              <div>
                <h4 className="text-sm font-medium mb-3">Breakdown Bulanan</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyFinancial?.monthly_breakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="monthLabel" className="text-xs" />
                      <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} className="text-xs" />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            total_modal: 'Modal',
                            total_omset: 'Omset',
                            profit: 'Keuntungan',
                            collected: 'Tertagih',
                          };
                          return [formatRupiah(value), labels[name] || name];
                        }}
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))" 
                        }}
                      />
                      <Bar dataKey="total_modal" fill="hsl(217, 91%, 60%)" name="total_modal" />
                      <Bar dataKey="total_omset" fill="hsl(239, 84%, 67%)" name="total_omset" />
                      <Bar dataKey="profit" fill="hsl(142, 76%, 36%)" name="profit" />
                      <Bar dataKey="collected" fill="hsl(168, 84%, 38%)" name="collected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Collection Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Jumlah Kontrak</p>
                  <p className="text-xl font-bold">{yearlyFinancial?.contracts_count ?? 0}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Sudah Tertagih</p>
                  <p className="text-xl font-bold text-green-600">{formatRupiah(yearlyFinancial?.total_collected ?? 0)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Sisa Tagihan</p>
                  <p className="text-xl font-bold text-orange-600">{formatRupiah(yearlyFinancial?.total_to_collect ?? 0)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Tingkat Penagihan</p>
                  <p className="text-xl font-bold text-blue-600">{(yearlyFinancial?.collection_rate ?? 0).toFixed(1)}%</p>
                </div>
              </div>

              {/* Agent Performance Table */}
              {yearlyFinancial?.agents && yearlyFinancial.agents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Performa Sales Agent Tahunan</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead className="text-right">Modal</TableHead>
                          <TableHead className="text-right">Omset</TableHead>
                          <TableHead className="text-right">Keuntungan</TableHead>
                          <TableHead className="text-right">Komisi</TableHead>
                          <TableHead className="text-right">Kontrak</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearlyFinancial.agents.map((agent, index) => (
                          <TableRow key={agent.agent_id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-mono">{agent.agent_code}</TableCell>
                            <TableCell>{agent.agent_name}</TableCell>
                            <TableCell className="text-right text-blue-600">{formatRupiah(agent.total_modal)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(agent.total_omset)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatRupiah(agent.profit)}</TableCell>
                            <TableCell className="text-right text-purple-600">{formatRupiah(agent.total_commission)}</TableCell>
                            <TableCell className="text-right">{agent.contracts_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Agent Contract History Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-5xl w-[95vw]">
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

                {totalItems > HISTORY_ITEMS_PER_PAGE && (
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
