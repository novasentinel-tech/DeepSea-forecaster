import { useState } from "react";
import { useDatasets, useCreateDataset } from "@/hooks/use-datasets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Database, Plus, FileJson, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const realisticDataExample = `[
  {"date": "2024-01-01", "energy_demand": 220, "temperature": 15, "humidity": 60, "day_of_week": 1, "is_weekend": false, "is_holiday": true, "prev_day_demand": 215},
  {"date": "2024-01-02", "energy_demand": 250, "temperature": 16, "humidity": 62, "day_of_week": 2, "is_weekend": false, "is_holiday": false, "prev_day_demand": 220},
  {"date": "2024-01-03", "energy_demand": 265, "temperature": 17, "humidity": 65, "day_of_week": 3, "is_weekend": false, "is_holiday": false, "prev_day_demand": 250},
  {"date": "2024-01-04", "energy_demand": 270, "temperature": 18, "humidity": 68, "day_of_week": 4, "is_weekend": false, "is_holiday": false, "prev_day_demand": 265},
  {"date": "2024-01-05", "energy_demand": 280, "temperature": 19, "humidity": 70, "day_of_week": 5, "is_weekend": false, "is_holiday": false, "prev_day_demand": 270},
  {"date": "2024-01-06", "energy_demand": 240, "temperature": 20, "humidity": 72, "day_of_week": 6, "is_weekend": true, "is_holiday": false, "prev_day_demand": 280},
  {"date": "2024-01-07", "energy_demand": 230, "temperature": 21, "humidity": 75, "day_of_week": 0, "is_weekend": true, "is_holiday": false, "prev_day_demand": 240},
  {"date": "2024-01-08", "energy_demand": 290, "temperature": 22, "humidity": 78, "day_of_week": 1, "is_weekend": false, "is_holiday": false, "prev_day_demand": 230}
]`;

export default function Datasets() {
  const { data: datasets, isLoading } = useDatasets();
  const createDataset = useCreateDataset();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "energy",
    dataJson: realisticDataExample
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(formData.dataJson);
      if (!Array.isArray(parsedData)) {
        throw new Error("Data must be a JSON array");
      }

      await createDataset.mutateAsync({
        name: formData.name,
        type: formData.type,
        data: parsedData
      });

      toast({ title: "Success", description: "Dataset imported successfully." });
      setIsModalOpen(false);
      setFormData({ name: "", type: "energy", dataJson: "" });
    } catch (err: any) {
      toast({ 
        title: "Error importing dataset", 
        description: err.message || "Invalid JSON format",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositório de Dados</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus conjuntos de dados de séries temporais para previsão.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Importar Dados
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Importar Novo Conjunto de Dados</DialogTitle>
              <DialogDescription>
                Forneça um array JSON de registros. Cada registro deve representar um passo no tempo com variáveis.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Conjunto</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="ex: NY_Power_Load_2023"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Domínio</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Selecione o domínio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="energy">Demanda de Energia</SelectItem>
                      <SelectItem value="stocks">Financeiro / Ações</SelectItem>
                      <SelectItem value="traffic">Tráfego Urbano</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="data">Dados JSON</Label>
                  <span className="text-xs text-muted-foreground font-mono flex items-center">
                    <FileJson className="w-3 h-3 mr-1" /> Formato Array
                  </span>
                </div>
                <Textarea 
                  id="data" 
                  required
                  rows={8}
                  className="font-mono text-sm bg-background/50 border-border/50 resize-y"
                  value={formData.dataJson}
                  onChange={(e) => setFormData({...formData, dataJson: e.target.value})}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={createDataset.isPending} className="hover-elevate">
                  {createDataset.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Dados"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Hash do Arquivo</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Importado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-32 bg-secondary/50 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 w-20 bg-secondary/50 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 w-24 bg-secondary/50 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 w-16 bg-secondary/50 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 w-24 bg-secondary/50 rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : datasets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum dado encontrado. Importe um para começar.
                  </TableCell>
                </TableRow>
              ) : (
                datasets?.map((ds) => (
                  <TableRow key={ds.id} className="border-border/20 hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium">{ds.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {ds.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ds.fileHash ? `${ds.fileHash.substring(0, 12)}...` : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {Array.isArray(ds.data) ? ds.data.length.toLocaleString() : 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ds.createdAt ? format(new Date(ds.createdAt), 'dd MMM, yyyy') : 'Desconhecido'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
