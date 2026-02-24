import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { Dataset, InsertDataset } from "@shared/schema";

export function useDatasets() {
  return useQuery({
    queryKey: [api.datasets.list.path],
    queryFn: async () => {
      const res = await fetch(api.datasets.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch datasets");
      return api.datasets.list.responses[200].parse(await res.json());
    },
  });
}

export function useDataset(id: number) {
  return useQuery({
    queryKey: [api.datasets.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.datasets.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch dataset");
      return api.datasets.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDataset) => {
      const res = await fetch(api.datasets.create.path, {
        method: api.datasets.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        let errorMessage = `Failed to create dataset. Status: ${res.status}`;
        try {
          const errorBody = await res.json();
          if (errorBody && errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch (e) {
          try {
            const textBody = await res.text();
            if (textBody) {
              errorMessage = textBody;
            }
          } catch (textErr) {
            // Do nothing, use the original status message
          }
        }
        throw new Error(errorMessage);
      }
      return api.datasets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.datasets.list.path] });
    },
  });
}
