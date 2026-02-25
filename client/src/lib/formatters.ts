/**
 * Utility functions for formatting KPI values
 */

export function formatKpiValue(value: number | undefined | null, format: string): string {
  if (value === undefined || value === null) return "—";

  switch (format.toLowerCase()) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    
    case "percentage":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value / 100); // Assuming DB stores 12.5 for 12.5%
      
    case "number":
    default:
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
      }).format(value);
  }
}

export function formatPercentageChange(change: number | undefined | null): string {
  if (change === undefined || change === null) return "0.0%";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
