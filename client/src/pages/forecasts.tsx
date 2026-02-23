import { useForecasts, useDatasets } from "@/hooks/use-forecasts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Activity, Plus, ArrowRight, BrainCircuit } from "lucide-react";
import { Link } from "wouter";

export default function Forecasts() {
  const { data: forecasts, isLoading } = useForecasts();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Modelos</h1>
          <p className="text-muted-foreground mt-1">Revise suas previsões geradas e o desempenho dos modelos.</p>
        </div>
        <Button asChild className="hover-elevate shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80">
          <Link href="/forecasts/new">
            <Plus className="mr-2 h-4 w-4" /> Nova Previsão
          </Link>
        </Button>
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/40">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Variável Alvo</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Horizonte</TableHead>
              <TableHead>Gerado em</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({length: 4}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-16">
                    <div className="h-4 w-full bg-secondary/30 rounded animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : forecasts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Activity className="h-10 w-10 mb-4 opacity-20" />
                    <p>Nenhum modelo gerado ainda.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              forecasts?.map((f) => (
                <TableRow key={f.id} className="border-border/20 hover:bg-secondary/20 transition-colors group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
                      {f.targetVariable}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border/50 text-foreground">
                      <BrainCircuit className="w-3 h-3 mr-1.5 text-primary" />
                      {f.modelUsed.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    +{f.horizon} passos
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {f.createdAt ? format(new Date(f.createdAt), 'dd/MM/yyyy HH:mm') : 'Desconhecido'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/forecasts/${f.id}`}>
                        Ver Detalhes <ArrowRight className="ml-1 w-3 h-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
