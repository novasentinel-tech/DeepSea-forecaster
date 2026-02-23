"use client";

import * as React from "react";
import { TOTEMDeepseaClient } from "@/lib/api-client";
import { type ForecastData } from "@/lib/types";
import {
  generatePerformanceSummary,
  generateTechnicalAnalysisReport,
} from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, TrendingUp, Zap, BarChart2 } from "lucide-react";
import { ForecastChart } from "./forecast-chart";
import { Badge } from "./ui/badge";

import { Remarkable } from 'remarkable';

interface DashboardProps {
  modelId: string;
}

const translations: Record<string, string> = {
    // performance
    'mean_absolute_error': 'Erro Médio Absoluto',
    'rmse': 'RMSE',
    'mape': 'MAPE',
    'r2': 'R²',
    'directional_accuracy': 'Precisão Direcional',
    // statistics
    'forecast_mean': 'Média da Previsão',
    'forecast_std': 'Desvio Padrão da Previsão',
    'forecast_min': 'Mínimo da Previsão',
    'forecast_max': 'Máximo da Previsão',
    'forecast_median': 'Mediana da Previsão',
    'forecast_percentile_25': 'Percentil 25',
    'forecast_percentile_75': 'Percentil 75',
    'volatility': 'Volatilidade',
    'confidence_level': 'Nível de Confiança',
    // trend
    'overall_trend': 'Tendência Geral',
    'trend_strength': 'Força da Tendência',
    'slope': 'Inclinação',
    'change_percent': '% de Mudança',
    'volatility_forecast': 'Previsão de Volatilidade',
    // reliability/risk
    'high': 'Alta',
    'medium': 'Média',
    'low': 'Baixa',
};

const translateKey = (key: string) => {
    const keyLower = key.toLowerCase();
    return translations[keyLower] || key.replace(/_/g, ' ');
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "text-accent",
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export function Dashboard({ modelId }: DashboardProps) {
  const [forecast, setForecast] = React.useState<ForecastData | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const apiClient = React.useMemo(() => new TOTEMDeepseaClient(), []);
  
  const md = new Remarkable({ html: true });

  React.useEffect(() => {
    async function loadData() {
      if (!modelId) return;
      setIsLoading(true);
      setForecast(null);
      setSummary(null);
      setReport(null);

      try {
        const forecastData = modelId.includes("lstm")
          ? await apiClient.forecastLSTM(modelId)
          : await apiClient.forecastProphet(modelId);
        
        setForecast(forecastData);

        if (forecastData.performance_summary) {
          generatePerformanceSummary({
            modelConfidence: forecastData.performance_summary.model_confidence,
            predictionReliability: forecastData.performance_summary.prediction_reliability,
            recommendation: forecastData.performance_summary.recommendation,
            riskLevel: forecastData.performance_summary.risk_level,
          }).then(setSummary);
        }

        generateTechnicalAnalysisReport({
          modelId,
          periods: 24,
        }).then(setReport);

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [modelId, apiClient]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!forecast) {
    return (
      <Card className="flex items-center justify-center p-8">
        <AlertCircle className="mr-2" /> Não foi possível carregar os dados da previsão.
      </Card>
    );
  }

  const performanceSummary = forecast.performance_summary;

  const renderValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    return translateKey(value);
  };

  return (
    <Tabs defaultValue="dashboard">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">Painel</TabsTrigger>
        <TabsTrigger value="report">Relatório Técnico</TabsTrigger>
        <TabsTrigger value="metrics">Métricas Brutas</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Recomendação"
            value={performanceSummary?.recommendation || 'N/A'}
            icon={TrendingUp}
            color={
              performanceSummary?.recommendation.includes("BUY")
                ? "text-green-500"
                : performanceSummary?.recommendation.includes("SELL")
                ? "text-red-500"
                : "text-yellow-500"
            }
          />
          <StatCard
            title="Confiança do Modelo"
            value={performanceSummary ? `${(performanceSummary.model_confidence * 100).toFixed(0)}%` : 'N/A'}
            icon={Zap}
          />
          <StatCard
            title="Confiabilidade"
            value={performanceSummary ? translateKey(performanceSummary.prediction_reliability) : 'N/A'}
            icon={CheckCircle}
          />
          <StatCard
            title="Nível de Risco"
            value={performanceSummary ? translateKey(performanceSummary.risk_level) : 'N/A'}
            icon={AlertCircle}
            color={
              performanceSummary?.risk_level === 'low'
                ? "text-green-500"
                : performanceSummary?.risk_level === 'high'
                ? "text-red-500"
                : "text-yellow-500"
            }
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Previsão</CardTitle>
            {summary ? <CardDescription>{summary}</CardDescription> : <Skeleton className="h-4 w-3/4" />}
          </CardHeader>
          <CardContent>
            <ForecastChart forecast={forecast} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="report">
        <Card>
          <CardHeader>
            <CardTitle>Análise Técnica Gerada por IA</CardTitle>
            <CardDescription>
              Relatório detalhado com base em múltiplos indicadores técnicos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-full"
                dangerouslySetInnerHTML={{ __html: md.render(report) }}
              />
            ) : (
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/3 mt-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="metrics">
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Métricas de Desempenho</CardTitle></CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(forecast.actual_vs_forecast).map(([key, value]) => (
                            <React.Fragment key={key}>
                                <dt className="font-medium text-muted-foreground capitalize">{translateKey(key)}</dt>
                                <dd className="font-mono">{renderValue(value)}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Estatísticas da Previsão</CardTitle></CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(forecast.statistics).map(([key, value]) => (
                            <React.Fragment key={key}>
                                <dt className="font-medium text-muted-foreground capitalize">{translateKey(key)}</dt>
                                <dd className="font-mono">{renderValue(value)}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </CardContent>
            </Card>
            {forecast.trend_analysis && <Card>
                <CardHeader><CardTitle>Análise de Tendência</CardTitle></CardHeader>
                <CardContent>
                     <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(forecast.trend_analysis).map(([key, value]) => (
                            <React.Fragment key={key}>
                                <dt className="font-medium text-muted-foreground capitalize">{translateKey(key)}</dt>
                                <dd>{renderValue(value)}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </CardContent>
            </Card>}
            {forecast.anomalies?.detected && <Card>
                <CardHeader><CardTitle>Anomalias Detectadas ({forecast.anomalies.count})</CardTitle></CardHeader>
                <CardContent>
                    {forecast.anomalies.anomalies.map((anomaly, index) => (
                        <Badge key={index} variant="destructive" className="mr-2 mb-2">
                            Período {anomaly.period}: {anomaly.anomaly_type}
                        </Badge>
                    ))}
                </CardContent>
            </Card>}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[400px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
