import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Format currency with abbreviation for large numbers
const formatCompactCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  } else if (absAmount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  } else if (absAmount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(1)}Rb`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number;
  valueColor?: string;
  subtitle?: string;
  isPercentage?: boolean;
  isNegative?: boolean;
  hoverInfo?: string;
  onDetailClick?: () => void;
}

export function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  valueColor = "",
  subtitle = "Bulan ini",
  isPercentage = false,
  isNegative = false,
  hoverInfo,
  onDetailClick,
}: StatCardProps) {
  const displayValue = isPercentage 
    ? `${value.toFixed(1)}%` 
    : `${isNegative ? '-' : ''}${formatCompactCurrency(Math.abs(value))}`;

  const cardContent = (
    <Card className="relative group cursor-default">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
        <p className={`text-lg font-bold truncate ${valueColor}`} title={displayValue}>
          {displayValue}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {onDetailClick && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onDetailClick}
            >
              Detail
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (hoverInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{hoverInfo}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
