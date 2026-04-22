// Shim to fix recharts v2 class component types being incompatible with newer @types/react.
// Recharts declares `class XAxis extends React.Component<Props>` (single generic),
// but newer @types/react requires the third generic. We re-declare these as FCs.
declare module "recharts" {
  import * as React from "react";

  type AnyProps = Record<string, any>;

  // Override the problematic class-component exports as permissive function components.
  export const XAxis: React.FC<AnyProps>;
  export const YAxis: React.FC<AnyProps>;
  export const ZAxis: React.FC<AnyProps>;
  export const Tooltip: React.FC<AnyProps>;
  export const Legend: React.FC<AnyProps>;
  export const Line: React.FC<AnyProps>;
  export const Bar: React.FC<AnyProps>;
  export const Area: React.FC<AnyProps>;
  export const Pie: React.FC<AnyProps>;
  export const Cell: React.FC<AnyProps>;
  export const ReferenceLine: React.FC<AnyProps>;
  export const ReferenceArea: React.FC<AnyProps>;
  export const ReferenceDot: React.FC<AnyProps>;
  export const Brush: React.FC<AnyProps>;
  export const ErrorBar: React.FC<AnyProps>;
  export const LabelList: React.FC<AnyProps>;
  export const Label: React.FC<AnyProps>;
  export const PolarAngleAxis: React.FC<AnyProps>;
  export const PolarRadiusAxis: React.FC<AnyProps>;
  export const PolarGrid: React.FC<AnyProps>;
  export const Radar: React.FC<AnyProps>;
  export const RadialBar: React.FC<AnyProps>;
  export const Scatter: React.FC<AnyProps>;
  export const Funnel: React.FC<AnyProps>;
  export const Trapezoid: React.FC<AnyProps>;
  export const Customized: React.FC<AnyProps>;
  export const Cross: React.FC<AnyProps>;
  export const Curve: React.FC<AnyProps>;
  export const Dot: React.FC<AnyProps>;
  export const Polygon: React.FC<AnyProps>;
  export const Rectangle: React.FC<AnyProps>;
  export const Sector: React.FC<AnyProps>;
  export const Symbols: React.FC<AnyProps>;
  export const Text: React.FC<AnyProps>;
}
