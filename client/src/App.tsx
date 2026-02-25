import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";

// Import pages
import Dashboard from "@/pages/dashboard";
import KpiDetail from "@/pages/kpi-detail";
import KpiList from "@/pages/kpi-list";
import { AppSidebar } from "@/components/layout/app-sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/kpis" component={KpiList}/>
      <Route path="/kpis/:id" component={KpiDetail}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle}>
          <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
            <AppSidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Optional top gradient subtle effect */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
              
              <main className="flex-1 overflow-y-auto w-full relative z-0 scroll-smooth">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
