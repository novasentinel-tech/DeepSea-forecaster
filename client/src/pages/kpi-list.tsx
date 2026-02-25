import { useKpis } from "@/hooks/use-kpis";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKpiValue, formatPercentageChange } from "@/lib/formatters";
import { format } from "date-fns";
import { ArrowRight, PlusCircle, Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateKpiForm } from "@/components/forms/create-kpi-form";

export default function KpiList() {
  const { data: kpis, isLoading } = useKpis();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredKpis = kpis?.filter(k => 
    k.kpi.name.toLowerCase().includes(search.toLowerCase()) || 
    k.kpi.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            KPI Explorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your key performance indicators in one place.
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
                Define a new metric to track.
              </DialogDescription>
            </DialogHeader>
            <CreateKpiForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-background border border-border/50 rounded-lg px-3 py-2 max-w-md focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search metrics..."
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Metric Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Trend</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Loading metrics...
                </TableCell>
              </TableRow>
            ) : filteredKpis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {search ? "No metrics matched your search." : "No metrics defined yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredKpis.map((data) => {
                const latestDate = data.dataPoints && data.dataPoints.length > 0 
                  ? new Date(Math.max(...data.dataPoints.map(dp => new Date(dp.date).getTime())))
                  : null;

                return (
                  <TableRow key={data.kpi.id} className="group transition-colors hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <Link href={`/kpis/${data.kpi.id}`} className="hover:underline text-foreground">
                        {data.kpi.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                        {data.kpi.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-display font-semibold">
                      {formatKpiValue(data.currentValue, data.kpi.format)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-xs font-medium ${
                        (data.percentageChange || 0) > 0 ? "text-[hsl(var(--trend-up))]" : 
                        (data.percentageChange || 0) < 0 ? "text-[hsl(var(--trend-down))]" : "text-muted-foreground"
                      }`}>
                        {formatPercentageChange(data.percentageChange)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {latestDate ? format(latestDate, 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/kpis/${data.kpi.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
