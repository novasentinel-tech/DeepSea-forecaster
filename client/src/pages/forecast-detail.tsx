import { useRoute } from "wouter";
import { useModel } from "@/hooks/use-forecasts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { BrainCircuit, Target, ArrowLeft, BarChart3, Clock, TestTube2, FileJson, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function ForecastDetail() {
  const [, params] = useRoute("/forecasts/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: model, isLoading } = useModel(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-muted-foreground mb-4">Modelo não encontrado</h2>
        <Button asChild variant="outline"><Link href="/forecasts">Voltar para a lista</Link></Button>
      </div>
    );
  }

  const metrics = model.metrics as Record<string, number>;
  const featureImportance = model.featureImportance as Record<string, number>;
  const trainingConfig = model.trainingConfig as Record<string, any>;
  const hyperparameters = trainingConfig.hyperparameters as Record<string, any>;

  const sortedFeatureImportance = featureImportance 
    ? Object.entries(featureImportance).sort(([,a],[,b]) => b-a)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-secondary/50 hover:bg-secondary">
          <Link href="/forecasts"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Análise do Experimento</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-background border text-foreground uppercase tracking-wider">
              ID: {model.id}
            </span>
          </div>
        </div>
      </div>

      <Card className="glass-card shadow-2xl shadow-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle>Projeção de Séries Temporais</CardTitle>
          <CardDescription>Contexto histórico e predição de {model.horizon} passos à frente com intervalos de confiança de 95%</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 p-2 sm:p-6">
          <ForecastChart 
            data={model.forecastData as any[]} 
            targetVariable={model.targetVariable}
            height={500} 
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card className="glass-card md:col-span-1 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center"><TestTube2 className="w-4 h-4 mr-2 text-primary" /> Configuração do Experimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center"><BrainCircuit className="w-4 h-4 mr-2"/>Algoritmo</span>
              <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">{trainingConfig.modelUsed}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center"><FileJson className="w-4 h-4 mr-2"/>ID do Dataset</span>
              <span className="font-mono">{model.datasetId} (v{model.datasetVersion})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center"><Target className="w-4 h-4 mr-2"/>Variável Alvo</span>
              <span className="font-mono">{model.targetVariable}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2"/>Tempo de Treino</span>
              <span className="font-mono">{model.trainingDuration?.toFixed(2) ?? 'N/A'}s</span>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider text-xs mb-2">Hiperparâmetros</p>
              <div className="font-mono text-xs bg-background/50 p-2 rounded-md">
                <pre>{JSON.stringify(hyperparameters, null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card lg:col-span-2">
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-primary" /> Importância das Features</CardTitle>
           </CardHeader>
           <CardContent>
              {sortedFeatureImportance.length > 0 ? (
                <div className="space-y-2">
                  {sortedFeatureImportance.slice(0, 7).map(([feature, importance]) => (
                    <div key={feature} className="flex items-center text-sm">
                      <span className="w-1/2 truncate text-muted-foreground">{feature}</span>
                      <div className="w-1/2">
                        <div className="w-full bg-secondary/50 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(importance * 100).toFixed(2)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">A importância das features não está disponível para este tipo de modelo.</p>
              )}
           </CardContent>
        </Card>

        <Card className="glass-card md:col-span-3 lg:col-span-4 bg-gradient-to-br from-card to-secondary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-accent" /> Métricas de Desempenho (Média de 5 Folds)</CardTitle>
            <CardDescription>Avaliado usando validação cruzada de séries temporais.</CardDescription>
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
