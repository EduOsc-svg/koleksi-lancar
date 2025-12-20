import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContracts } from "@/hooks/useContracts";
import { useTodayCollections } from "@/hooks/usePayments";
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
} from "recharts";

export default function Dashboard() {
  const { data: contracts } = useContracts("active");
  const { data: todayCollection } = useTodayCollections();

  const totalActiveContracts = contracts?.length ?? 0;
  const totalOutstanding = contracts?.reduce((sum, c) => {
    const remaining = (c.tenor_days - c.current_installment_index) * c.daily_installment_amount;
    return sum + remaining;
  }, 0) ?? 0;

  const expectedDaily = contracts?.reduce((sum, c) => sum + c.daily_installment_amount, 0) ?? 0;
  const collectionRate = expectedDaily > 0 ? ((todayCollection ?? 0) / expectedDaily) * 100 : 0;

  // Mock chart data
  const chartData = [
    { day: "Mon", collected: 450000, target: 500000 },
    { day: "Tue", collected: 520000, target: 500000 },
    { day: "Wed", collected: 480000, target: 500000 },
    { day: "Thu", collected: 490000, target: 500000 },
    { day: "Fri", collected: 510000, target: 500000 },
    { day: "Sat", collected: 420000, target: 500000 },
    { day: "Sun", collected: 300000, target: 500000 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveContracts}</div>
            <p className="text-xs text-muted-foreground">Total ongoing loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Remaining to collect</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(todayCollection ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(collectionRate)} of target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(collectionRate)}</div>
            <p className="text-xs text-muted-foreground">Today's performance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Collection vs Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatRupiah(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="collected" fill="hsl(var(--primary))" name="Collected" />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
