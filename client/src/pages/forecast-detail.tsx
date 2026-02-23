import { useRoute } from "wouter";
import { useForecast } from "@/hooks/use-forecasts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { BrainCircuit, Target, Layers, ArrowLeft, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function ForecastDetail() {
  const [, params] = useRoute("/forecasts/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: forecast, isLoading } = useForecast(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-muted-foreground mb-4">Previsão não encontrada</h2>
        <Button asChild variant="outline"><Link href="/forecasts">Voltar para a lista</Link></Button>
      </div>
    );
  }

  const metrics = forecast.metrics as Record<string, number>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-secondary/50 hover:bg-secondary">
          <Link href="/forecasts"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Análise de Previsão</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
              {forecast.modelUsed.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <Card className="glass-card shadow-2xl shadow-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle>Projeção de Séries Temporais</CardTitle>
          <CardDescription>Contexto histórico e predição de {forecast.horizon} passos à frente com intervalos de confiança de 95%</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 p-2 sm:p-6">
          <ForecastChart 
            data={forecast.forecastData as any[]} 
            targetVariable={forecast.targetVariable}
            height={500} 
          />
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* Config Summary */}
        <Card className="glass-card md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center"><Target className="w-4 h-4 mr-2 text-primary" /> Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Variável Alvo</p>
              <p className="font-semibold text-lg">{forecast.targetVariable}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Características Usadas ({forecast.features?.length || 0})</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {forecast.features?.map((f: string) => (
                  <span key={f} className="text-xs bg-secondary/50 px-2 py-1 rounded border border-border/50 text-muted-foreground">{f}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Horizonte</p>
              <p className="font-mono">{forecast.horizon} passos</p>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="glass-card md:col-span-1 lg:col-span-3 bg-gradient-to-br from-card to-secondary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-accent" /> Métricas de Desempenho do Modelo</CardTitle>
            <CardDescription>Avaliado no conjunto de teste histórico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics ? Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="bg-background/40 p-4 rounded-xl border border-border/30">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{key.toUpperCase()}</p>
                  <p className="text-2xl font-mono text-foreground font-bold">
                    {typeof value === 'number' ? (value < 1 ? value.toFixed(4) : value.toFixed(2)) : value}
                  </p>
                </div>
              )) : (
                <div className="col-span-full text-muted-foreground text-sm">Métricas não disponíveis</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
