import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
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
import { useDailyCollectionTrend, useMonthlyCollectionTrend, useYearlyCollectionTrend, TrendPeriod } from "@/hooks/useCollectionTrendPeriods";

export function CollectionTrendChart() {
  const { t } = useTranslation();
  
  // Trend period and range state
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('daily');
  const [trendDays, setTrendDays] = useState(30);
  const [trendMonths, setTrendMonths] = useState(12);
  const [trendYears, setTrendYears] = useState(5);
  
  // Data hooks - all trend hooks called unconditionally
  const { data: dailyTrendData, isLoading: isLoadingDailyTrend } = useDailyCollectionTrend(trendDays);
  const { data: monthlyTrendData, isLoading: isLoadingMonthlyTrend } = useMonthlyCollectionTrend(trendMonths);
  const { data: yearlyTrendData, isLoading: isLoadingYearlyTrend } = useYearlyCollectionTrend(trendYears);

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

  return (
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
  );
}
