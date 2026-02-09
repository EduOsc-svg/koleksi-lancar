import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

// Preset options for each period type
const dailyPresets = [
  { value: 7, label: "7H" },
  { value: 14, label: "14H" },
  { value: 30, label: "30H" },
  { value: 60, label: "60H" },
  { value: 90, label: "90H" },
];

const monthlyPresets = [
  { value: 3, label: "3B" },
  { value: 6, label: "6B" },
  { value: 12, label: "12B" },
  { value: 24, label: "24B" },
];

const yearlyPresets = [
  { value: 2, label: "2T" },
  { value: 3, label: "3T" },
  { value: 5, label: "5T" },
  { value: 10, label: "10T" },
];

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

  // Get current presets and value based on period
  const getCurrentPresets = () => {
    switch (trendPeriod) {
      case 'monthly': return monthlyPresets;
      case 'yearly': return yearlyPresets;
      default: return dailyPresets;
    }
  };

  const getCurrentValue = () => {
    switch (trendPeriod) {
      case 'monthly': return trendMonths;
      case 'yearly': return trendYears;
      default: return trendDays;
    }
  };

  const handlePresetChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    switch (trendPeriod) {
      case 'monthly':
        setTrendMonths(numValue);
        break;
      case 'yearly':
        setTrendYears(numValue);
        break;
      default:
        setTrendDays(numValue);
    }
  };

  return (
    <Card className="overflow-hidden max-w-full">
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
          
          {/* Period-specific preset buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Rentang:</span>
            <ToggleGroup 
              type="single" 
              value={getCurrentValue().toString()} 
              onValueChange={handlePresetChange}
              className="flex flex-wrap gap-1"
            >
              {getCurrentPresets().map((preset) => (
                <ToggleGroupItem 
                  key={preset.value} 
                  value={preset.value.toString()}
                  className="text-xs px-3 py-1 h-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {preset.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden max-w-full">
          <div className="relative">
            <ScrollArea className="w-full max-w-full">
              <div 
                className="h-[300px] p-6 pr-20" 
                style={{ 
                  minWidth: trendPeriod === 'daily' 
                    ? `${Math.min(1200, Math.max(600, activeTrendData.length * 25))}px` 
                    : trendPeriod === 'monthly' 
                      ? `${Math.min(1000, Math.max(500, activeTrendData.length * 60))}px`
                      : '100%',
                  width: 'max-content',
                  maxWidth: '100vw'
                }}
              >
                {isLoadingTrend ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={activeTrendData}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid 
                          strokeDasharray="2 2" 
                          stroke="#e2e8f0" 
                          vertical={false}
                          opacity={0.6}
                        />
                        <XAxis 
                          dataKey="label" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          interval={0}
                          angle={trendPeriod === 'monthly' ? -45 : 0}
                          textAnchor={trendPeriod === 'monthly' ? 'end' : 'middle'}
                          height={trendPeriod === 'monthly' ? 60 : 30}
                          tickFormatter={(value) => {
                            if (trendPeriod === 'daily') {
                              const date = new Date(value);
                              return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                            }
                            return value;
                          }}
                        />
                        <YAxis hide={true} />
                        <Tooltip
                          cursor={{ 
                            stroke: '#64748b', 
                            strokeWidth: 1, 
                            strokeDasharray: '4 4'
                          }}
                          formatter={(value: number) => [formatRupiah(value), t("dashboard.collection", "Penagihan")]}
                          labelFormatter={(label) => {
                            if (trendPeriod === 'daily') {
                              const date = new Date(label);
                              return date.toLocaleDateString('id-ID', { 
                                weekday: 'long',
                                day: 'numeric', 
                                month: 'long',
                                year: 'numeric'
                              });
                            }
                            return label;
                          }}
                          contentStyle={{ 
                            backgroundColor: "#1e293b", 
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "#f1f5f9",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ 
                            r: 5, 
                            fill: "#2563eb",
                            stroke: "#ffffff",
                            strokeWidth: 2
                          }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            
            {/* Sticky Y-Axis Overlay */}
            {!isLoadingTrend && (
              <div 
                className="absolute right-0 top-0 h-full bg-white/95 backdrop-blur-sm border-l border-gray-200 pointer-events-none"
                style={{ 
                  width: '80px',
                  zIndex: 10
                }}
              >
                <div className="h-[300px] p-6 pl-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={activeTrendData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <YAxis 
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                        tickFormatter={(v) => {
                          if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}M`;
                          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}Jt`;
                          if (v >= 1000) return `${(v / 1000).toFixed(0)}rb`;
                          return v === 0 ? '0' : v.toString();
                        }}
                        width={60}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
