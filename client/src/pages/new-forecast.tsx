import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useDatasets } from "@/hooks/use-datasets";
import { useTrainModel } from "@/hooks/use-forecasts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, BrainCircuit, Sparkles, AlertCircle, CheckCircle, SlidersHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { addDays, format, parseISO } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


export default function NewForecast() {
  const [, setLocation] = useLocation();
  const { data: datasets, isLoading: loadingDatasets } = useDatasets();
  const trainModel = useTrainModel();
  const { toast } = useToast();

  const [datasetId, setDatasetId] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<"auto" | "linear_regression" | "random_forest">("auto");
  const [target, setTarget] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [horizon, setHorizon] = useState<string>("30");
  const [forecastStartDate, setForecastStartDate] = useState<Date>();

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [hyperparameters, setHyperparameters] = useState({
    n_estimators: 100,
    max_depth: 10,
  });

  const selectedDataset = useMemo(() => {
    if (!datasetId || !datasets) return null;
    return datasets.find(d => d.id === parseInt(datasetId));
  }, [datasetId, datasets]);

  const datasetSummary = useMemo(() => {
    if (!selectedDataset || !Array.isArray(selectedDataset.data) || selectedDataset.data.length === 0) return null;
    const dates = selectedDataset.data.map((row: any) => parseISO(row.date)).sort((a,b) => a.getTime() - b.getTime());
    return {
      rows: selectedDataset.data.length,
      startDate: format(dates[0], 'dd/MM/yyyy'),
      endDate: format(dates[dates.length - 1], 'dd/MM/yyyy'),
      columns: Object.keys(selectedDataset.data[0]).length,
      lastDate: dates[dates.length - 1],
    };
  }, [selectedDataset]);

  useEffect(() => {
    if (datasetSummary) {
      setForecastStartDate(addDays(datasetSummary.lastDate, 1));
    }
  }, [datasetSummary]);

  const availableColumns = useMemo(() => {
    if (!selectedDataset || !Array.isArray(selectedDataset.data) || selectedDataset.data.length === 0) return [];
    return Object.keys(selectedDataset.data[0]).filter(k => k.toLowerCase() !== 'date' && k.toLowerCase() !== 'timestamp');
  }, [selectedDataset]);

  const forecastHorizonPreview = useMemo(() => {
    if (!forecastStartDate || !horizon) return null;
    const endDate = format(addDays(forecastStartDate, parseInt(horizon) - 1), 'dd/MM/yyyy');
    return `${format(forecastStartDate, 'dd/MM/yyyy')} até ${endDate}`;
  }, [forecastStartDate, horizon]);

  // Auto-select features when target changes
  useEffect(() => {
    if (target) {
      setFeatures(availableColumns.filter(col => col !== target));
    } else {
      setFeatures([]);
    }
  }, [target, availableColumns]);

  const toggleFeature = (col: string) => {
    setFeatures(prev => 
      prev.includes(col) ? prev.filter(f => f !== col) : [...prev, col]
    );
  };

  const isFormComplete = !!datasetId && !!target && features.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) {
      toast({ title: "Configuração incompleta", description: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    try {
      const trainingParams: any = {
        datasetId: parseInt(datasetId),
        algorithm: algorithm,
        targetVariable: target,
        features: features,
        horizon: parseInt(horizon),
        forecastStartDate: forecastStartDate ? forecastStartDate.toISOString().split('T')[0] : undefined,
      };

      if (isAdvancedMode && algorithm === 'random_forest') {
        trainingParams.hyperparameters = hyperparameters;
      }

      const result = await trainModel.mutateAsync(trainingParams);
      
      toast({ title: "Treinamento Iniciado", description: `Modelo ${result.id} está sendo treinado.` });
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card border-t-4 border-t-primary">
              <CardContent className="p-6 md:p-8 space-y-8">
                
                {/* Step 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${datasetId ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'}`}>1</div>
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
                  </div>
                  {datasetSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <p><strong>Registros:</strong> {datasetSummary.rows.toLocaleString()}</p>
                        <p><strong>Colunas:</strong> {datasetSummary.columns}</p>
                        <p className="col-span-2 md:col-span-1"><strong>Período:</strong> {datasetSummary.startDate} a {datasetSummary.endDate}</p>
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div className={`space-y-4 transition-opacity duration-300 ${!datasetId ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${target ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'}`}>2</div>
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
                            <span className="text-sm text-muted-foreground">Selecione um conjunto de dados.</span>
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
                                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${col === target ? 'text-muted-foreground line-through' : ''}`}
                                >
                                  {col}
                                </Label>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`space-y-4 transition-opacity duration-300 ${!target ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</div>
                    <h3 className="text-lg font-medium">Configuração do Modelo</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3 md:col-span-1">
                      <Label>Algoritmo</Label>
                      <Select value={algorithm} onValueChange={(v: any) => setAlgorithm(v)}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automático (Melhor Escolha)</SelectItem>
                          <SelectItem value="random_forest">Random Forest (Ensemble)</SelectItem>
                          <SelectItem value="linear_regression">Regressão Linear</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Data de Início da Previsão</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal bg-background/50",
                                !forecastStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {forecastStartDate ? format(forecastStartDate, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={forecastStartDate}
                              onSelect={setForecastStartDate}
                              initialFocus
                              disabled={(date) => datasetSummary ? date <= datasetSummary.lastDate : false}
                            />
                          </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-3">
                      <Label>Horizonte (Passos)</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="365" 
                        value={horizon}
                        onChange={(e) => setHorizon(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  {forecastHorizonPreview && (
                    <Button variant="outline" className="text-xs text-muted-foreground mt-2 p-2 h-auto font-normal justify-start w-full bg-background/30 cursor-default hover:bg-background/30">
                      <span className="font-semibold mr-1">Período da previsão:</span> {forecastHorizonPreview}
                    </Button>
                  )}

                  {algorithm === 'random_forest' &&
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="advanced-mode" checked={isAdvancedMode} onCheckedChange={setIsAdvancedMode} />
                            <Label htmlFor="advanced-mode">Modo Avançado</Label>
                        </div>
                        {isAdvancedMode && (
                            <Card className="bg-secondary/20 p-4 border-border/50">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Número de Estimadores (n_estimators)</Label>
                                        <Input type="number" value={hyperparameters.n_estimators} onChange={(e) => setHyperparameters({...hyperparameters, n_estimators: parseInt(e.target.value)})} className="bg-background/50 h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Profundidade Máxima (max_depth)</Label>
                                        <Input type="number" value={hyperparameters.max_depth} onChange={(e) => setHyperparameters({...hyperparameters, max_depth: parseInt(e.target.value)})} className="bg-background/50 h-9" />
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                  }
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card sticky top-20">
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
                <CardDescription>Pronto para treinar?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div className={`flex items-center gap-2 text-sm ${datasetId ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {datasetId ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      <span>Dataset selecionado</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${target ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {target ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      <span>Variável Alvo definida</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${features.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {features.length > 0 ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      <span>Pelo menos 1 feature</span>
                  </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch p-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={!isFormComplete || trainModel.isPending}
                    className="w-full hover-elevate shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/80"
                  >
                    {trainModel.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Treinando...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="mr-2 h-5 w-5" /> Gerar Previsão
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 mr-1 text-accent" />
                    O treinamento pode levar alguns instantes.
                  </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

    