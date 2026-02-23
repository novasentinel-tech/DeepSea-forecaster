"use client";

import * as React from "react";
import {
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { type ForecastData } from "@/lib/types";

interface ForecastChartProps {
  forecast: ForecastData;
}

export function ForecastChart({ forecast }: ForecastChartProps) {
  const chartData = React.useMemo(() => {
    if (!forecast) return [];

    const isLstm = forecast.model_type === 'lstm';
    
    // LSTM has more detailed confidence intervals
    const upper95 = isLstm && forecast.confidence_intervals 
      ? forecast.confidence_intervals.upper_bound_95.map((row) => row[0]) 
      : forecast.uncertainties?.confidence_interval_95.upper;
    
    const lower95 = isLstm && forecast.confidence_intervals
      ? forecast.confidence_intervals.lower_bound_95.map((row) => row[0])
      : forecast.uncertainties?.confidence_interval_95.lower;
    
    const actual = isLstm && forecast.actual_vs_forecast.actual_last_24
      ? forecast.actual_vs_forecast.actual_last_24.map(row => row[0])
      : forecast.actual_vs_forecast.actual;


    return forecast.timestamps.dates.map((date, index) => ({
      date,
      Real: actual?.[index],
      Previsão: forecast.forecast.values[index][0],
      Confiança: upper95 && lower95 ? [lower95[index], upper95[index]] : undefined,
    }));
  }, [forecast]);

  const yDomain = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 100];
    const allValues = chartData.flatMap(d => [d.Real, d.Previsão, ...(d.Confiança || [])]).filter(v => v != null);
    if (allValues.length === 0) return [0, 100];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [chartData]);


  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData}>
        <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
            </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.slice(5)} // Show MM-DD
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value.toFixed(0)}`}
          domain={yDomain}
          allowDataOverflow={true}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend wrapperStyle={{ fontSize: "0.8rem" }}/>
        <Line
          type="monotone"
          dataKey="Real"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Previsão"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
        <Area
            type="monotone"
            dataKey="Confiança"
            fill="url(#colorForecast)"
            stroke="hsl(var(--chart-2))"
            strokeWidth={0}
            name="Confiança de 95%"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
