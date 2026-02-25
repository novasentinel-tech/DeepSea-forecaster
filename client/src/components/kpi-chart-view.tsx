import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKpiValue } from "@/lib/formatters";
import type { KpiWithData } from "@shared/schema";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface KpiChartViewProps {
  data: KpiWithData;
}

export function KpiChartView({ data }: KpiChartViewProps) {
  const { kpi, dataPoints } = data;

  const chartData = [...(dataPoints || [])]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(dp => ({
      date: new Date(dp.date),
      displayDate: format(new Date(dp.date), "MMM d, yyyy"),
      value: Number(dp.value),
    }));

  // Define a custom tooltip to match our clean aesthetic
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border/50 p-3 rounded-lg shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{payload[0].payload.displayDate}</p>
          <p className="text-lg font-display font-bold text-foreground">
            {formatKpiValue(payload[0].value, kpi.format)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="font-display text-xl">{kpi.name} Trend</CardTitle>
        <CardDescription>{kpi.description || "Historical performance over time"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => formatKpiValue(value, kpi.format)}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
              <div className="h-16 w-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p>Not enough data to display chart.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
