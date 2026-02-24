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
        // Try to parse the error message from the server for better feedback
        try {
          const errorBody = await res.json();
          if (errorBody && errorBody.message) {
            throw new Error(errorBody.message);
          }
        } catch (e) {
          // If parsing fails or no message, fall back to a generic error
          throw new Error(`Failed to generate forecast. Status: ${res.status}`);
        }
        // This line is unlikely to be reached but is a good fallback.
        throw new Error("Failed to generate forecast");
      }
      return api.forecasts.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forecasts.list.path] });
    },
  });
}
