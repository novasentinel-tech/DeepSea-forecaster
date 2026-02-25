import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateKpiRequest, CreateKpiDataPointRequest, KpiWithData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Fetch all KPIs with their historical data
export function useKpis() {
  return useQuery({
    queryKey: [api.kpis.list.path],
    queryFn: async () => {
      const res = await fetch(api.kpis.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      // The API returns KpiWithData[], we cast it here for strong typing
      // as z.any() was used in the schema to avoid complex Zod recursive types
      return (await res.json()) as KpiWithData[];
    },
  });
}

// Fetch a single KPI
export function useKpi(id: number) {
  return useQuery({
    queryKey: [api.kpis.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.kpis.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch KPI");
      return (await res.json()) as KpiWithData;
    },
  });
}

// Create a new KPI
export function useCreateKpi() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateKpiRequest) => {
      const res = await fetch(api.kpis.create.path, {
        method: api.kpis.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to create KPI" }));
        throw new Error(errorData.message || "Failed to create KPI");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.kpis.list.path] });
      toast({
        title: "Success",
        description: "KPI created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// Add a data point to a KPI
export function useCreateDataPoint() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateKpiDataPointRequest) => {
      const res = await fetch(api.dataPoints.create.path, {
        method: api.dataPoints.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to add data point" }));
        throw new Error(errorData.message || "Failed to add data point");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the list and the specific KPI
      queryClient.invalidateQueries({ queryKey: [api.kpis.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.kpis.get.path, variables.kpiId] });
      toast({
        title: "Data Added",
        description: "New data point recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
