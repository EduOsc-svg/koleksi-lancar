import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContracts } from "@/hooks/useContracts";
import { useTodayCollections } from "@/hooks/usePayments";
import { useWeeklyCollections, useOverdueContracts } from "@/hooks/useWeeklyCollections";
import { formatRupiah, formatPercent } from "@/lib/format";
import { FileText, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: contracts, isLoading: contractsLoading } = useContracts("active");
  const { data: todayCollection, isLoading: todayLoading } = useTodayCollections();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyCollections();
  const { data: overdueCount, isLoading: overdueLoading } = useOverdueContracts();

  const totalActiveContracts = contracts?.length ?? 0;
  const totalOutstanding = contracts?.reduce((sum, c) => {
    const remaining = (c.tenor_days - c.current_installment_index) * c.daily_installment_amount;
    return sum + remaining;
  }, 0) ?? 0;

  const expectedDaily = contracts?.reduce((sum, c) => sum + c.daily_installment_amount, 0) ?? 0;
  const collectionRate = expectedDaily > 0 ? ((todayCollection ?? 0) / expectedDaily) * 100 : 0;

  const isLoading = contractsLoading || todayLoading || weeklyLoading || overdueLoading;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontrak Aktif</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {contractsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalActiveContracts}</div>
                <p className="text-xs text-muted-foreground">Total pinjaman berjalan</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {contractsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatRupiah(totalOutstanding)}</div>
                <p className="text-xs text-muted-foreground">Sisa yang harus ditagih</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tagihan Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatRupiah(todayCollection ?? 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(collectionRate)} dari target
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontrak Tertunggak</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overdueLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overdueCount ?? 0}</div>
                <p className="text-xs text-muted-foreground">Perlu perhatian</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tagihan Mingguan vs Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {weeklyLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="collected" fill="hsl(var(--primary))" name="Terkumpul" />
                  <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
