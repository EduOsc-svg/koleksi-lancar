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
      <CardContent className="p-0 relative">
        {/* Scroll Shadow Indicators */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 opacity-0 transition-opacity duration-200" id="scroll-shadow-left" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 opacity-50" id="scroll-shadow-right" />
        
        {/* Scrollable Chart Container */}
        <div 
          className="w-full overflow-x-auto scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50 transition-colors"
          style={{ 
            WebkitOverflowScrolling: 'touch', // Momentum scrolling for iOS
            scrollbarWidth: 'thin', // Firefox
          }}
          onScroll={(e) => {
            const target = e.currentTarget;
            const leftShadow = document.getElementById('scroll-shadow-left');
            const rightShadow = document.getElementById('scroll-shadow-right');
            
            if (leftShadow) {
              leftShadow.style.opacity = target.scrollLeft > 10 ? '0.5' : '0';
            }
            if (rightShadow) {
              const isAtEnd = target.scrollLeft + target.clientWidth >= target.scrollWidth - 10;
              rightShadow.style.opacity = isAtEnd ? '0' : '0.5';
            }
          }}
        >
          <div 
            className="h-[300px] p-6" 
            style={{ 
              minWidth: trendPeriod === 'daily' 
                ? `${Math.max(800, activeTrendData.length * 28)}px` 
                : trendPeriod === 'monthly' 
                  ? `${Math.max(600, activeTrendData.length * 65)}px`
                  : '100%'
            }}
          >
            {isLoadingTrend ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTrendData} margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="hsl(var(--border))" 
                    strokeOpacity={0.5}
                  />
                  <XAxis 
                    dataKey="label" 
                    className="text-xs"
                    interval={0}
                    angle={trendPeriod === 'monthly' ? -45 : 0}
                    textAnchor={trendPeriod === 'monthly' ? 'end' : 'middle'}
                    height={trendPeriod === 'monthly' ? 60 : 30}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    orientation="right"
                    tickFormatter={(v) => {
                      if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)} M`;
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)} Jt`;
                      if (v >= 1000) return `${(v / 1000).toFixed(0)} Rb`;
                      return v.toString();
                    }} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatRupiah(value), t("dashboard.collection", "Penagihan")]}
                    labelFormatter={(label) => label}
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "#2563eb", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
