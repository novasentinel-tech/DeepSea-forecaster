import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { Model } from "@shared/schema";

type TrainModelInput = z.infer<typeof api.models.train.input>;

export function useModels() {
  return useQuery({
    queryKey: [api.models.list.path],
    queryFn: async () => {
      const res = await fetch(api.models.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch models");
      return api.models.list.responses[200].parse(await res.json());
    },
  });
}

export function useModel(id: number) {
  return useQuery({
    queryKey: [api.models.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.models.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch model");
      return api.models.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useTrainModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TrainModelInput) => {
      const res = await fetch(api.models.train.path, {
        method: api.models.train.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        let errorMessage = `Failed to train model. Status: ${res.status}`;
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
            // Do nothing
          }
        }
        throw new Error(errorMessage);
      }
      return api.models.train.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.models.list.path] });
    },
  });
}
