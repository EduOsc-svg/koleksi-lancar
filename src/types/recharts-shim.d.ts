// Shim to fix recharts v2 class component types being incompatible with newer @types/react.
// Recharts declares `class XAxis extends React.Component<Props>` (single generic),
// but newer @types/react requires the third generic. We re-declare these as FCs.
declare module "recharts" {
  import * as React from "react";

  type AnyProps = Record<string, any>;
  type AnyFC = React.FC<AnyProps>;

  // Chart containers
  export const LineChart: AnyFC;
  export const BarChart: AnyFC;
  export const AreaChart: AnyFC;
  export const PieChart: AnyFC;
  export const RadarChart: AnyFC;
  export const RadialBarChart: AnyFC;
  export const ScatterChart: AnyFC;
  export const ComposedChart: AnyFC;
  export const FunnelChart: AnyFC;
  export const Treemap: AnyFC;
  export const Sankey: AnyFC;
  export const ResponsiveContainer: AnyFC;
  export const CartesianGrid: AnyFC;
  export const CartesianAxis: AnyFC;

  // Axes & cartesian elements
  export const XAxis: AnyFC;
  export const YAxis: AnyFC;
  export const ZAxis: AnyFC;
  export const Tooltip: AnyFC;
  export const Legend: AnyFC;
  export const Line: AnyFC;
  export const Bar: AnyFC;
  export const Area: AnyFC;
  export const Pie: AnyFC;
  export const Cell: AnyFC;
  export const ReferenceLine: AnyFC;
  export const ReferenceArea: AnyFC;
  export const ReferenceDot: AnyFC;
  export const Brush: AnyFC;
  export const ErrorBar: AnyFC;
  export const LabelList: AnyFC;
  export const Label: AnyFC;
  export const PolarAngleAxis: AnyFC;
  export const PolarRadiusAxis: AnyFC;
  export const PolarGrid: AnyFC;
  export const Radar: AnyFC;
  export const RadialBar: AnyFC;
  export const Scatter: AnyFC;
  export const Funnel: AnyFC;
  export const Trapezoid: AnyFC;
  export const Customized: AnyFC;
  export const Cross: AnyFC;
  export const Curve: AnyFC;
  export const Dot: AnyFC;
  export const Polygon: AnyFC;
  export const Rectangle: AnyFC;
  export const Sector: AnyFC;
  export const Symbols: AnyFC;
  export const Text: AnyFC;
  export const Surface: AnyFC;

  // Loose prop types
  export type LegendProps = AnyProps;
  export type TooltipProps<TValue = any, TName = any> = AnyProps;
}
