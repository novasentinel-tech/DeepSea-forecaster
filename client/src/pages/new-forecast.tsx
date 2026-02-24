import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useDatasets } from "@/hooks/use-datasets";
import { useTrainModel } from "@/hooks/use-forecasts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, BrainCircuit, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewForecast() {
  const [, setLocation] = useLocation();
  const { data: datasets, isLoading: loadingDatasets } = useDatasets();
  const trainModel = useTrainModel();
  const { toast } = useToast();

  const [datasetId, setDatasetId] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<"linear_regression" | "random_forest">("random_forest");
  const [target, setTarget] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [horizon, setHorizon] = useState<string>("30");

  const availableColumns = useMemo(() => {
    if (!datasetId || !datasets) return [];
    const ds = datasets.find(d => d.id === parseInt(datasetId));
    if (!ds || !ds.data || !Array.isArray(ds.data) || ds.data.length === 0) return [];
    return Object.keys(ds.data[0]).filter(k => k.toLowerCase() !== 'date' && k.toLowerCase() !== 'timestamp');
  }, [datasetId, datasets]);

  const toggleFeature = (col: string) => {
    setFeatures(prev => 
      prev.includes(col) ? prev.filter(f => f !== col) : [...prev, col]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetId || !target || features.length === 0) {
      toast({ title: "Incomplete configuration", description: "Please select dataset, target, and at least one feature.", variant: "destructive" });
      return;
    }

    try {
      const result = await trainModel.mutateAsync({
        datasetId: parseInt(datasetId),
        algorithm: algorithm,
        targetVariable: target,
        features: features,
        horizon: parseInt(horizon)
      });
      
      toast({ title: "Treinamento Concluído", description: `Modelo ${result.id} treinado com sucesso.` });
      setLocation(`/forecasts/${result.id}`);
    } catch (err: any) {
      toast({ title: "Falha no Treinamento", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Iniciar Novo Experimento</h1>
        <p className="text-muted-foreground mt-1">Configure os parâmetros para treinar um novo modelo de previsão.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass-card border-t-4 border-t-primary">
          <CardContent className="p-6 md:p-8 space-y-8">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-lg font-medium">Fonte de Dados</h3>
              </div>
              <div className="space-y-2">
                <Label>Selecionar Conjunto de Dados</Label>
                <Select value={datasetId} onValueChange={(val) => { setDatasetId(val); setTarget(""); setFeatures([]); }}>
                  <SelectTrigger className="bg-background/50 h-12">
                    <SelectValue placeholder={loadingDatasets ? "Carregando dados..." : "Escolha um conjunto de dados"} />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets?.map(ds => (
                      <SelectItem key={ds.id} value={ds.id.toString()}>
                        {ds.name} <span className="text-muted-foreground ml-2">({ds.type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!datasetId && <p className="text-xs text-muted-foreground mt-2"><AlertCircle className="w-3 h-3 inline mr-1" /> Requer a importação de um conjunto de dados primeiro.</p>}
              </div>
            </div>

            <div className={`space-y-4 transition-opacity duration-300 ${!datasetId ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="text-lg font-medium">Mapeamento de Variáveis</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label>Variável Alvo (Y)</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Valor a prever" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">A variável dependente que você deseja prever.</p>
                </div>

                <div className="space-y-3">
                  <Label>Variáveis de Característica (X)</Label>
                  <Card className="bg-background/30 border-border/50 shadow-none h-[150px] overflow-y-auto">
                    <CardContent className="p-3 space-y-2">
                      {availableColumns.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Selecione um conjunto de dados primeiro</span>
                      ) : (
                        availableColumns.map(col => (
                          <div key={col} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`feat-${col}`} 
                              checked={features.includes(col)}
                              onCheckedChange={() => toggleFeature(col)}
                              disabled={col === target}
                            />
                            <Label 
                              htmlFor={`feat-${col}`}
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 ${col === target ? 'text-primary' : ''}`}
                            >
                              {col} {col === target && "(Alvo)"}
                            </Label>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className={`space-y-4 transition-opacity duration-300 ${!target ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="text-lg font-medium">Configuração do Modelo</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Algoritmo</Label>
                  <Select value={algorithm} onValueChange={(v: any) => setAlgorithm(v)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random_forest">Random Forest (Ensemble)</SelectItem>
                      <SelectItem value="linear_regression">Regressão Linear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Horizonte de Previsão (Passos)</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="365" 
                    value={horizon}
                    onChange={(e) => setHorizon(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Até onde no futuro prever.</p>
                </div>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-secondary/20 p-6 flex justify-between items-center border-t border-border/50">
            <p className="text-sm text-muted-foreground flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-accent" />
              O treinamento pode levar alguns instantes.
            </p>
            <Button 
              type="submit" 
              size="lg" 
              disabled={trainModel.isPending || !datasetId || !target || features.length === 0}
              className="hover-elevate shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/80"
            >
              {trainModel.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Treinando Modelo...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-5 w-5" /> Iniciar Treinamento
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
