import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ForecastDataPoint {
  date: string;
  actual?: number | null;
  predicted?: number | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  targetVariable: string;
  height?: number;
}

export function ForecastChart({ data, targetVariable, height = 400 }: ForecastChartProps) {
  // Pre-process data for Recharts Area which accepts an array [min, max]
  const processedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      // Create the range array for the confidence interval area
      bounds: point.lower_bound != null && point.upper_bound != null 
        ? [point.lower_bound, point.upper_bound] 
        : null,
      // Format date for better display if it's an ISO string
      displayDate: (() => {
        try {
          return format(parseISO(point.date), 'MMM dd, yyyy');
        } catch {
          return point.date;
        }
      })()
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground bg-card/30 rounded-xl border border-border/50 border-dashed">
        Nenhum dado de previsão disponível
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBounds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          
          <XAxis 
            dataKey="displayDate" 
            stroke="hsl(var(--muted-foreground))" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dy={10}
            minTickGap={30}
          />
          
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dx={-10}
            tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover) / 0.95)', 
              backdropFilter: 'blur(8px)',
              borderColor: 'hsl(var(--border))',
              borderRadius: '0.75rem',
              color: 'hsl(var(--popover-foreground))',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontWeight: 'bold' }}
          />
          
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px' }}
          />

          {/* Confidence Interval Area */}
          <Area 
            type="monotone" 
            dataKey="bounds" 
            name="Intervalo de Confiança 95%"
            fill="url(#colorBounds)" 
            stroke="none" 
            activeDot={false}
            isAnimationActive={true}
          />

          {/* Historical / Actual Data */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            name={`Real ${targetVariable}`}
            stroke="hsl(var(--muted-foreground))" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(var(--foreground))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={true}
          />

          {/* Predicted Data */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            name={`Previsto ${targetVariable}`}
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            isAnimationActive={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
