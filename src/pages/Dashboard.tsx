import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollectionTrend } from "@/hooks/useCollectionTrend";
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
import { TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: trendData, isLoading } = useCollectionTrend(30);

  // Calculate summary stats
  const totalCollection = trendData?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const avgDaily = trendData && trendData.length > 0 
    ? totalCollection / trendData.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Trend - Last 30 Days</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {formatRupiah(totalCollection)} | Average Daily: {formatRupiah(avgDaily)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {isLoading ? (
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
                    formatter={(value: number) => [formatRupiah(value), "Collection"]}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('id-ID', { 
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
    </div>
  );
}
