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

export default function Datasets() {
  const { data: datasets, isLoading } = useDatasets();
  const createDataset = useCreateDataset();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "energy",
    dataJson: "[\n  {\"date\": \"2024-01-01\", \"load\": 450, \"temp\": 22},\n  {\"date\": \"2024-01-02\", \"load\": 480, \"temp\": 24}\n]"
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
                    <TableCell className="font-mono text-xs text-muted-foreground">{ds.fileHash.substring(0, 12)}...</TableCell>
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
