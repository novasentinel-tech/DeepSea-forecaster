import { useKpis } from "@/hooks/use-kpis";
import { KpiCard } from "@/components/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateKpiForm } from "@/components/forms/create-kpi-form";
import { useState } from "react";
import type { KpiWithData } from "@shared/schema";

export default function Dashboard() {
  const { data: kpis, isLoading, error } = useKpis();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Group KPIs by category
  const groupedKpis = kpis?.reduce((acc, kpi) => {
    const category = kpi.kpi.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(kpi);
    return acc;
  }, {} as Record<string, KpiWithData[]>) || {};

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="text-destructive font-semibold mb-2">Error loading dashboard</div>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            Executive Summary
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your business performance across key categories.
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Metric
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create New KPI</DialogTitle>
              <DialogDescription>
                Define a new metric to track on your dashboard.
              </DialogDescription>
            </DialogHeader>
            <CreateKpiForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map(section => (
            <div key={section} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : kpis?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] border-2 border-dashed border-border rounded-2xl bg-muted/20">
          <div className="bg-background p-4 rounded-full shadow-sm mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg">No metrics yet</h3>
          <p className="text-muted-foreground max-w-md text-center mb-6 mt-1">
            Start tracking your business performance by creating your first Key Performance Indicator.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="hover-elevate">
            Create Your First KPI
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedKpis).map(([category, categoryKpis]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-display font-semibold text-foreground/90 flex items-center">
                {category}
                <div className="ml-4 flex-1 h-px bg-border/50"></div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {categoryKpis.map((data) => (
                  <Link key={data.kpi.id} href={`/kpis/${data.kpi.id}`}>
                    <KpiCard data={data} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
