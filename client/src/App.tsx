import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/app-layout";

// Pages
import Dashboard from "@/pages/dashboard";
import Datasets from "@/pages/datasets";
import Forecasts from "@/pages/forecasts";
import NewForecast from "@/pages/new-forecast";
import ForecastDetail from "@/pages/forecast-detail";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/datasets" component={Datasets} />
        <Route path="/forecasts" component={Forecasts} />
        <Route path="/forecasts/new" component={NewForecast} />
        <Route path="/forecasts/:id" component={ForecastDetail} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
