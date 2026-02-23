"use client";

import * as React from "react";
import { TOTEMDeepseaClient } from "@/lib/api-client";
import { type HealthStatus, type FileList, type ModelList } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Server } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export function ApiStatusDashboard() {
  const [status, setStatus] = React.useState<HealthStatus | null>(null);
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [models, setModels] = React.useState<ModelList | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const apiClient = React.useMemo(() => new TOTEMDeepseaClient(), []);

  React.useEffect(() => {
    async function loadStatus() {
      setIsLoading(true);
      setError(null);
      try {
        const [statusRes, filesRes, modelsRes] = await Promise.all([
          apiClient.getHealth(),
          apiClient.getFiles(),
          apiClient.getModels(),
        ]);
        setStatus(statusRes);
        setFiles(filesRes);
        setModels(modelsRes);
      } catch (e: any) {
        console.error("Failed to load API status:", e);
        setError(e.message || "Não foi possível conectar à API.");
      } finally {
        setIsLoading(false);
      }
    }
    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [apiClient]);

  if (isLoading && !status && !error) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 bg-destructive/10 border-destructive">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <CardTitle className="mt-4 text-destructive">Erro de Conexão com a API</CardTitle>
        <CardDescription className="mt-2 text-center text-destructive/80">
          Não foi possível buscar o status do servidor. Verifique se a API está em execução e acessível.
        </CardDescription>
        <p className="mt-4 text-xs text-muted-foreground font-mono bg-destructive/10 p-2 rounded-md">{error}</p>
      </Card>
    );
  }

  const sortedFiles = Object.entries(files?.files || {}).sort(([, a], [, b]) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const sortedModels = Object.entries(models?.models || {}).sort(([, a], [, b]) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const apiStatus = status?.status?.includes('healthy') || status?.status?.includes('online');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
            title="Status da API"
            value={apiStatus ? <Badge className="bg-green-500 hover:bg-green-600">Online</Badge> : <Badge variant="destructive">Offline</Badge>}
            icon={apiStatus ? CheckCircle : AlertCircle}
            color={apiStatus ? "text-green-500" : "text-red-500"}
        />
        <StatCard
            title="Arquivos Carregados"
            value={status?.dataframes_in_memory ?? 'N/A'}
            icon={Server}
        />
        <StatCard
            title="Modelos em Memória"
            value={status?.models_in_memory ?? 'N/A'}
            icon={Server}
        />
        <StatCard
            title="Última Verificação"
            value={status ? format(new Date(status.timestamp), "HH:mm:ss", { locale: ptBR }) : 'N/A'}
            icon={Server}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Carregados na Sessão</CardTitle>
            <CardDescription>Estes são os arquivos CSV que foram enviados para a API.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID do Arquivo</TableHead>
                        <TableHead>Linhas</TableHead>
                        <TableHead>Tamanho (MB)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedFiles.length > 0 ? sortedFiles.map(([id, file]) => (
                        <TableRow key={id}>
                            <TableCell className="font-mono text-xs">{id.replace('file_', '')}</TableCell>
                            <TableCell>{file.rows}</TableCell>
                            <TableCell>{file.size_mb.toFixed(2)}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum arquivo carregado.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Modelos Treinados na Sessão</CardTitle>
            <CardDescription>Estes são os modelos que foram treinados e estão prontos para previsões.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID do Modelo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {sortedModels.length > 0 ? sortedModels.map(([id, model]) => (
                        <TableRow key={id}>
                            <TableCell className="font-mono text-xs truncate max-w-[200px] block">{id}</TableCell>
                            <TableCell><Badge variant={model.type === 'lstm' ? "default" : "secondary"}>{model.type.toUpperCase()}</Badge></TableCell>
                            <TableCell><Badge variant={model.status === 'active' ? "outline" : "destructive"}>{model.status}</Badge></TableCell>
                        </TableRow>
                    )) : (
                         <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum modelo treinado.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
