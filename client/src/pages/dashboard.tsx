import { useDatasets } from "@/hooks/use-datasets";
import { useForecasts } from "@/hooks/use-forecasts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Activity, Database, TrendingUp, Plus, ArrowRight, LineChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ForecastChart } from "@/components/charts/forecast-chart";

export default function Dashboard() {
  const { data: datasets, isLoading: loadingDatasets } = useDatasets();
  const { data: forecasts, isLoading: loadingForecasts } = useForecasts();

  const latestForecast = forecasts?.[forecasts.length - 1];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl tracking-tight text-gradient mb-2">Visão Geral do Sistema</h1>
        <p className="text-muted-foreground text-lg">Monitore seus modelos de séries temporais multivariadas e conjuntos de dados.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-l-4 border-l-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Conjuntos de Dados</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingDatasets ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono">{datasets?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-accent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Modelos Gerados</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {loadingForecasts ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono">{forecasts?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-green-500/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status do Sistema</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">Online</div>
            <p className="text-xs text-muted-foreground mt-1">Pronto para predição</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Latest Forecast Chart */}
        <Card className="glass-card lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Última Previsão</CardTitle>
              <CardDescription>
                {latestForecast 
                  ? `Prevendo ${latestForecast.targetVariable} usando ${latestForecast.modelUsed.replace('_', ' ')}`
                  : "Nenhuma previsão gerada ainda."}
              </CardDescription>
            </div>
            {latestForecast && (
              <Button variant="outline" size="sm" asChild className="hover-elevate">
                <Link href={`/forecasts/${latestForecast.id}`}>
                  Ver Detalhes <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {loadingForecasts ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : latestForecast ? (
              <ForecastChart 
                data={latestForecast.forecastData as any[]} 
                targetVariable={latestForecast.targetVariable}
                height={350} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-xl border border-dashed border-border/50 bg-secondary/10">
                <LineChart className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">Sem dados para exibir</h3>
                <p className="text-muted-foreground max-w-sm mb-4">Gere sua primeira previsão para ver os resultados aqui.</p>
                <Button asChild className="hover-elevate">
                  <Link href="/forecasts/new">Gerar Previsão</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Recent */}
        <div className="space-y-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start hover-elevate shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80">
                <Link href="/forecasts/new">
                  <Plus className="mr-2 h-4 w-4" /> Gerar Novo Modelo
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start hover-elevate">
                <Link href="/datasets">
                  <Database className="mr-2 h-4 w-4 text-accent" /> Upload de Dados
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Conjuntos de Dados Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDatasets ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : datasets && datasets.length > 0 ? (
                <div className="space-y-3">
                  {datasets.slice(0, 4).map(ds => (
                    <div key={ds.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                      <div className="flex flex-col truncate">
                        <span className="font-medium truncate text-sm">{ds.name}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{ds.type}</span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground px-2 py-1 bg-background rounded-md">
                        {Array.isArray(ds.data) ? ds.data.length : 0} linhas
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum conjunto de dados disponível.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
