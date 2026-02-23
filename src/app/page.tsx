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
import type { FileDetails, ModelDetails, FileList, ModelList } from "@/lib/types";
import { Upload, FileText, BrainCircuit, BarChart, Package } from "lucide-react";
import { ModelTrainingDialog } from "@/components/model-training-dialog";
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

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
      toast({
        title: "Error fetching data",
        description: "Could not load files and models. Please ensure the API is running.",
        variant: "destructive",
      });
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
        title: "Upload Successful",
        description: `File "${result.file_id}" uploaded with ${result.rows} rows.`,
      });
      await fetchFilesAndModels();
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file.",
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
        title: "Training Started",
        description: `Model ${result.model_id} is now training.`,
      });
      // Poll for models until the new one appears
      const poll = setInterval(async () => {
        const modelsRes = await apiClient.getModels();
        if (modelsRes.models && modelsRes.models[result.model_id]) {
          clearInterval(poll);
          setModels(modelsRes.models);
          setIsTraining(false);
          toast({
            title: "Training Complete",
            description: `Model ${result.model_id} is ready.`,
          });
        }
      }, 5000);
    } catch (error) {
      console.error(error);
      toast({
        title: "Training Failed",
        description: "Could not start model training.",
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
            <SidebarGroupLabel>Data Sources</SidebarGroupLabel>
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
                      title={`Train model with ${id}`}
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
                <p className="px-2 text-xs text-muted-foreground">No files uploaded.</p>
              }
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Trained Models</SidebarGroupLabel>
            <SidebarMenu>
               {isLoadingData && Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuItem key={i}><Skeleton className="h-8 w-full" /></SidebarMenuItem>
              ))}
              {sortedModels.map(([id, model]) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton onClick={() => setSelectedModelId(id)} isActive={selectedModelId === id} tooltip={id}>
                    <Package className={model.type === 'lstm' ? 'text-blue-400' : 'text-purple-400'}/>
                    <span className="truncate">{model.type}-{model.file_id.replace('file_', '')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {models && Object.keys(models).length === 0 && !isLoadingData &&
                 <p className="px-2 text-xs text-muted-foreground">No models trained.</p>
              }
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
            {isUploading ? "Uploading..." : "Upload CSV"}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger className="h-8 w-8 shrink-0" />
          <h2 className="text-lg font-semibold font-headline">Forecasting Dashboard</h2>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {selectedModelId ? (
            <Dashboard key={selectedModelId} modelId={selectedModelId} />
          ) : (
            <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center rounded-lg border-2 border-dashed bg-card">
              <div className="text-center">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Welcome to DeepSea Forecaster</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a model from the sidebar to view its forecast, <br /> or upload a CSV to get started.
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
