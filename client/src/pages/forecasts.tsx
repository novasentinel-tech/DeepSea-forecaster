import { useModels } from "@/hooks/use-forecasts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Activity, Plus, ArrowRight, BrainCircuit, BarChartHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Forecasts() {
  const { data: models, isLoading } = useModels();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Modelos</h1>
          <p className="text-muted-foreground mt-1">Compare o desempenho entre diferentes versões e algoritmos.</p>
        </div>
        <Button asChild className="hover-elevate shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80">
          <Link href="/forecasts/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Experimento
          </Link>
        </Button>
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/40">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>ID do Modelo</TableHead>
              <TableHead>Algoritmo</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead>RMSE</TableHead>
              <TableHead>MAE</TableHead>
              <TableHead>Horizonte</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({length: 4}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="h-16">
                    <div className="h-4 w-full bg-secondary/30 rounded animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : models?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <BarChartHorizontal className="h-10 w-10 mb-4 opacity-20" />
                    <p>Nenhum experimento executado ainda.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              models?.map((m) => {
                const metrics = m.metrics as { rmse?: number, mae?: number };
                return (
                  <TableRow key={m.id} className="border-border/20 hover:bg-secondary/20 transition-colors group">
                    <TableCell className="font-mono text-xs">{m.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        <BrainCircuit className="w-3 h-3 mr-1.5 text-primary" />
                        {m.algorithm.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-accent">{m.targetVariable}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{metrics.rmse?.toFixed(4) ?? 'N/A'}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{metrics.mae?.toFixed(4) ?? 'N/A'}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">+{m.horizon}p</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.createdAt ? format(new Date(m.createdAt), 'dd/MM/yy HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/forecasts/${m.id}`}>
                          Analisar <ArrowRight className="ml-1 w-3 h-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
