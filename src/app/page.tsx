"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TOTEMDeepseaClient } from "@/lib/api-client";
import type { FileDetails, ModelDetails } from "@/lib/types";
import { Upload, FileText, BrainCircuit, BarChart, Package, Server } from "lucide-react";
import { ModelTrainingDialog } from "@/components/model-training-dialog";
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiStatusDashboard } from "@/components/api-status-dashboard";

export default function Home() {
  const { toast } = useToast();
  const apiClient = React.useMemo(() => new TOTEMDeepseaClient(), []);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [files, setFiles] = React.useState<Record<string, FileDetails> | null>(null);
  const [models, setModels] = React.useState<Record<string, ModelDetails> | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isTraining, setIsTraining] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedFileForTraining, setSelectedFileForTraining] = React.useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = React.useState<string | null>(null);
  const [activeView, setActiveView] = React.useState<"dashboard" | "status">("dashboard");

  const isLoadingData = files === null || models === null;

  const fetchFilesAndModels = React.useCallback(async () => {
    try {
      const [filesRes, modelsRes] = await Promise.all([
        apiClient.getFiles(),
        apiClient.getModels(),
      ]);
      setFiles(filesRes.files || {});
      setModels(modelsRes.models || {});
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível carregar arquivos e modelos. Verifique se a API está em execução e configurada corretamente.";
      toast({
        title: "Erro ao buscar dados da API",
        description: errorMessage,
        variant: "destructive",
      });
      setFiles({});
      setModels({});
    }
  }, [apiClient, toast]);

  React.useEffect(() => {
    fetchFilesAndModels();
  }, [fetchFilesAndModels]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await apiClient.uploadCSV(file);
      toast({
        title: "Upload bem-sucedido",
        description: `Arquivo "${result.file_id}" enviado com ${result.rows} linhas.`,
      });
      await fetchFilesAndModels();
    } catch (error) {
      console.error(error);
      toast({
        title: "Falha no Upload",
        description: "Ocorreu um erro ao enviar seu arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openTrainingDialog = (fileId: string) => {
    setSelectedFileForTraining(fileId);
    setIsDialogOpen(true);
  };

  const handleTrainModel = async (fileId: string, type: 'lstm' | 'prophet', params: any) => {
    setIsTraining(true);
    setIsDialogOpen(false);
    try {
      let result;
      if (type === 'lstm') {
        result = await apiClient.trainLSTM(fileId, params);
      } else {
        result = await apiClient.trainProphet(fileId, params);
      }
      toast({
        title: "Treinamento Iniciado",
        description: `O modelo ${result.model_id} está treinando agora.`,
      });
      // Poll for models until the new one appears
      const poll = setInterval(async () => {
        const modelsRes = await apiClient.getModels();
        if (modelsRes.models && modelsRes.models[result.model_id]) {
          clearInterval(poll);
          setModels(modelsRes.models);
          setIsTraining(false);
          toast({
            title: "Treinamento Concluído",
            description: `O modelo ${result.model_id} está pronto.`,
          });
        }
      }, 5000);
    } catch (error) {
      console.error(error);
      toast({
        title: "Falha no Treinamento",
        description: "Não foi possível iniciar o treinamento do modelo.",
        variant: "destructive",
      });
      setIsTraining(false);
    }
  };

  const sortedModels = React.useMemo(() => {
    if (!models) return [];
    return Object.entries(models).sort(([, a], [, b]) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [models]);

  const sortedFiles = React.useMemo(() => {
    if (!files) return [];
    return Object.entries(files).sort(([, a], [, b]) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [files]);
  
  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setActiveView("dashboard");
  };

  const handleSelectStatus = () => {
    setSelectedModelId(null);
    setActiveView("status");
  }

  const PageTitle: Record<"dashboard" | "status", string> = {
    dashboard: "Painel de Previsão",
    status: "Status do Servidor da API"
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <BarChart className="size-6 text-accent" />
              <h1 className="text-lg font-semibold font-headline">DeepSea</h1>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Fontes de Dados</SidebarGroupLabel>
            <SidebarMenu>
              {isLoadingData && Array.from({ length: 2 }).map((_, i) => (
                <SidebarMenuItem key={i}><Skeleton className="h-8 w-full" /></SidebarMenuItem>
              ))}
              {sortedFiles.map(([id, file]) => (
                <SidebarMenuItem key={id}>
                   <div className="group/menu-item relative flex w-full items-center">
                    <button
                      onClick={() => openTrainingDialog(id)}
                      className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                      title={`Treinar modelo com ${id}`}
                    >
                      <FileText />
                      <span className="truncate">{id.replace('file_', '')}</span>
                    </button>
                    <SidebarMenuButton size="sm" variant="ghost" className="absolute right-1 top-1 h-6 w-6" onClick={() => openTrainingDialog(id)}>
                      <BrainCircuit className="size-4" />
                    </SidebarMenuButton>
                  </div>
                </SidebarMenuItem>
              ))}
              {files && Object.keys(files).length === 0 && !isLoadingData &&
                <p className="px-2 text-xs text-muted-foreground">Nenhum arquivo enviado.</p>
              }
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Modelos Treinados</SidebarGroupLabel>
            <SidebarMenu>
               {isLoadingData && Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuItem key={i}><Skeleton className="h-8 w-full" /></SidebarMenuItem>
              ))}
              {sortedModels.map(([id, model]) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton onClick={() => handleSelectModel(id)} isActive={selectedModelId === id && activeView === 'dashboard'} tooltip={id}>
                    <Package className={model.type === 'lstm' ? 'text-blue-400' : 'text-purple-400'}/>
                    <span className="truncate">{model.type}-{model.file_id.replace('file_', '')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {models && Object.keys(models).length === 0 && !isLoadingData &&
                 <p className="px-2 text-xs text-muted-foreground">Nenhum modelo treinado.</p>
              }
            </SidebarMenu>
          </SidebarGroup>
          
           <SidebarSeparator />

          <SidebarGroup>
             <SidebarGroupLabel>Sistema</SidebarGroupLabel>
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSelectStatus} isActive={activeView === 'status'}>
                        <Server />
                        <span>Status da API</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarGroup>

        </SidebarContent>
        <SidebarFooter>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <Button 
            className="w-full" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Enviando..." : "Enviar CSV"}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger className="h-8 w-8 shrink-0" />
          <h2 className="text-lg font-semibold font-headline">{PageTitle[activeView]}</h2>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background/40">
           {activeView === 'dashboard' && selectedModelId && (
            <Dashboard key={selectedModelId} modelId={selectedModelId} />
          )}
          {activeView === 'status' && (
            <ApiStatusDashboard />
          )}
          {activeView === 'dashboard' && !selectedModelId && (
             <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center rounded-lg border-2 border-dashed bg-card/50">
              <div className="text-center">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Bem-vindo ao Previsor DeepSea</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecione um modelo ou status da API na barra lateral para começar.
                </p>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>

      {selectedFileForTraining && (
        <ModelTrainingDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          fileId={selectedFileForTraining}
          onTrain={handleTrainModel}
          isTraining={isTraining}
        />
      )}
    </SidebarProvider>
  );
}
