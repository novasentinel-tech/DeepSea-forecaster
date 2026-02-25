import { useKpi } from "@/hooks/use-kpis";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { KpiChartView } from "@/components/kpi-chart-view";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddDataPointForm } from "@/components/forms/add-data-point-form";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKpiValue, formatPercentageChange } from "@/lib/formatters";
import { format } from "date-fns";

export default function KpiDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data, isLoading, error } = useKpi(id);
  const [isAddDataOpen, setIsAddDataOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          <Skeleton className="h-[400px] lg:col-span-3 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center mt-20">
        <h2 className="text-2xl font-bold mb-2">Metric not found</h2>
        <p className="text-muted-foreground mb-6">The KPI you are looking for doesn't exist or an error occurred.</p>
        <Button asChild variant="outline">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const { kpi, currentValue, percentageChange, dataPoints } = data;
  const recentDataPoints = [...(dataPoints || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            {kpi.category}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            {kpi.name}
          </h1>
          {kpi.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {kpi.description}
            </p>
          )}
        </div>

        <Dialog open={isAddDataOpen} onOpenChange={setIsAddDataOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Data Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-display">Record New Value</DialogTitle>
              <DialogDescription>
                Add a new data point for {kpi.name}.
              </DialogDescription>
            </DialogHeader>
            <AddDataPointForm kpi={kpi} onSuccess={() => setIsAddDataOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2">
        <div className="lg:col-span-3">
          <KpiChartView data={data} />
        </div>
        
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-secondary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-bold tracking-tight">
                {formatKpiValue(currentValue, kpi.format)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  (percentageChange || 0) > 0 ? "text-[hsl(var(--trend-up))]" : 
                  (percentageChange || 0) < 0 ? "text-[hsl(var(--trend-down))]" : "text-muted-foreground"
                }`}>
                  {formatPercentageChange(percentageChange)}
                </span>
                <span className="text-xs text-muted-foreground">vs previous</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {recentDataPoints.length > 0 ? (
                <div className="space-y-3">
                  {recentDataPoints.map((dp) => (
                    <div key={dp.id} className="flex justify-between items-center text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
                      <span className="text-muted-foreground">
                        {format(new Date(dp.date), "MMM d, yyyy")}
                      </span>
                      <span className="font-medium font-mono">
                        {formatKpiValue(Number(dp.value), kpi.format)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
