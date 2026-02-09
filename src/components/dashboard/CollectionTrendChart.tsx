import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import FusionCharts from "fusioncharts";
import Charts from "fusioncharts/fusioncharts.charts";
import ReactFC from "react-fusioncharts";
import { useDailyCollectionTrend, useMonthlyCollectionTrend, useYearlyCollectionTrend, TrendPeriod } from "@/hooks/useCollectionTrendPeriods";

// Initialize FusionCharts with charts module
ReactFC.fcRoot(FusionCharts, Charts);

// Type assertion for ReactFC component
const FusionChart = ReactFC as unknown as React.ComponentType<{
  type: string;
  width: string;
  height: string;
  dataFormat: string;
  dataSource: object;
}>;

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

  // Prepare FusionCharts data source
  const chartDataSource = useMemo(() => {
    const categories = activeTrendData.map(d => ({ label: d.label }));
    const dataset = [{
      seriesname: t("dashboard.collection", "Penagihan"),
      data: activeTrendData.map(d => ({ value: d.amount.toString() }))
    }];

    return {
      chart: {
        caption: "",
        xAxisName: "",
        yAxisName: "",
        theme: "fusion",
        showValues: "0",
        drawCrossLine: "1",
        crossLineColor: "#888888",
        crossLineAlpha: "50",
        lineThickness: "2",
        lineColor: "#2563eb",
        anchorRadius: "4",
        anchorBgColor: "#2563eb",
        anchorBorderColor: "#ffffff",
        anchorBorderThickness: "2",
        showAnchors: "0",
        anchorHoverEffect: "1",
        anchorHoverRadius: "6",
        bgColor: "#ffffff",
        canvasBgColor: "#ffffff",
        showBorder: "0",
        showCanvasBorder: "0",
        divLineColor: "#e5e7eb",
        divLineAlpha: "50",
        showAlternateHGridColor: "0",
        labelDisplay: trendPeriod === 'monthly' ? "rotate" : "auto",
        slantLabel: trendPeriod === 'monthly' ? "1" : "0",
        labelFontSize: "11",
        labelFontColor: "#6b7280",
        yAxisValueFontSize: "11",
        yAxisValueFontColor: "#6b7280",
        formatNumberScale: "1",
        numberScaleValue: "1000,1000,1000",
        numberScaleUnit: " Rb, Jt, M",
        numberPrefix: "",
        toolTipBgColor: "#ffffff",
        toolTipBorderColor: "#e5e7eb",
        toolTipPadding: "12",
        toolTipBorderRadius: "6",
        toolTipBorderThickness: "1",
        plotToolText: "<b>$label</b><br/>$seriesName: Rp $dataValue",
        chartLeftMargin: "10",
        chartRightMargin: "50",
        chartTopMargin: "20",
        chartBottomMargin: "20",
        yAxisPosition: "right",
        adjustDiv: "1",
        numDivLines: "4",
        paletteColors: "#2563eb",
      },
      categories: [{ category: categories }],
      dataset: dataset
    };
  }, [activeTrendData, trendPeriod, t]);

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
      <CardContent className="p-0">
        <div className="h-[300px] p-6">
          {isLoadingTrend ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <FusionChart
              type="msline"
              width="100%"
              height="100%"
              dataFormat="JSON"
              dataSource={chartDataSource}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}