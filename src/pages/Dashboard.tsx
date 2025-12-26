import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollectionTrend } from "@/hooks/useCollectionTrend";
import { useAgentOmset } from "@/hooks/useAgentOmset";
import { formatRupiah } from "@/lib/format";
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
import { TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { data: trendData, isLoading } = useCollectionTrend(30);
  const { data: agentOmsetData, isLoading: isLoadingAgentOmset } = useAgentOmset();

  // Calculate summary stats
  const totalCollection = trendData?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const avgDaily = trendData && trendData.length > 0 
    ? totalCollection / trendData.length 
    : 0;

  const totalOmset = agentOmsetData?.reduce((sum, d) => sum + d.total_omset, 0) ?? 0;
  const totalCommission = agentOmsetData?.reduce((sum, d) => sum + d.total_commission, 0) ?? 0;

  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.collectionTrend")} - 30 {t("dashboard.days", "Hari")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {formatRupiah(totalCollection)} | {t("dashboard.avgDaily", "Rata-rata Harian")}: {formatRupiah(avgDaily)}
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

      {/* Sales Agent Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>{t("dashboard.salesPerformance", "Performa Sales Agent")}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.totalOmset", "Total Omset")}: {formatRupiah(totalOmset)} | 
            {t("dashboard.totalCommission", "Total Komisi")}: {formatRupiah(totalCommission)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {isLoadingAgentOmset ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentOmsetData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    className="text-xs"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="agent_name" 
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatRupiah(value), 
                      name === 'total_omset' ? t("dashboard.omset", "Omset") : t("dashboard.commission", "Komisi")
                    ]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }}
                  />
                  <Bar 
                    dataKey="total_omset" 
                    fill="hsl(var(--primary))" 
                    name="total_omset"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="total_commission" 
                    fill="hsl(var(--chart-2))" 
                    name="total_commission"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
