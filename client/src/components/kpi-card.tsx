import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKpiValue, formatPercentageChange } from "@/lib/formatters";
import type { KpiWithData } from "@shared/schema";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  data: KpiWithData;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({ data, className, onClick }: KpiCardProps) {
  const { kpi, currentValue, percentageChange, dataPoints } = data;
  
  // Sort data points by date for the sparkline
  const chartData = [...(dataPoints || [])]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(dp => ({ value: Number(dp.value) }));

  const isPositive = percentageChange && percentageChange > 0;
  const isNegative = percentageChange && percentageChange < 0;
  const isNeutral = !isPositive && !isNegative;

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 border-border/50 bg-card shadow-sm hover:shadow-md",
        onClick && "cursor-pointer hover-elevate",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {kpi.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
              {formatKpiValue(currentValue, kpi.format)}
            </div>
            
            <div className="flex items-center mt-1 space-x-1">
              <span
                className={cn(
                  "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md",
                  isPositive && "text-[hsl(var(--trend-up))] bg-[hsl(var(--trend-up))]/10",
                  isNegative && "text-[hsl(var(--trend-down))] bg-[hsl(var(--trend-down))]/10",
                  isNeutral && "text-muted-foreground bg-muted"
                )}
              >
                {isPositive && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                {isNegative && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {isNeutral && <Minus className="h-3 w-3 mr-0.5" />}
                {formatPercentageChange(percentageChange)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs last period</span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-[40px] w-[80px] opacity-70">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={
                      isPositive ? "hsl(var(--trend-up))" : 
                      isNegative ? "hsl(var(--trend-down))" : 
                      "hsl(var(--muted-foreground))"
                    }
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground/50">
                No data
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
