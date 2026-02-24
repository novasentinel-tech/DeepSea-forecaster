import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { Forecast } from "@shared/schema";

type GenerateForecastInput = z.infer<typeof api.forecasts.generate.input>;

export function useForecasts() {
  return useQuery({
    queryKey: [api.forecasts.list.path],
    queryFn: async () => {
      const res = await fetch(api.forecasts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch forecasts");
      return api.forecasts.list.responses[200].parse(await res.json());
    },
  });
}

export function useForecast(id: number) {
  return useQuery({
    queryKey: [api.forecasts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.forecasts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch forecast");
      return api.forecasts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useGenerateForecast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateForecastInput) => {
      const res = await fetch(api.forecasts.generate.path, {
        method: api.forecasts.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        let errorMessage = `Failed to generate forecast. Status: ${res.status}`;
        try {
          // Try to parse as JSON first
          const errorBody = await res.json();
          if (errorBody && errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch (e) {
          // If JSON parsing fails, try to get the raw text body
          try {
            const textBody = await res.text();
            if (textBody) {
              errorMessage = textBody;
            }
          } catch (textErr) {
            // Ignore error reading text body, use original status message
          }
        }
        throw new Error(errorMessage);
      }
      return api.forecasts.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forecasts.list.path] });
    },
  });
}
