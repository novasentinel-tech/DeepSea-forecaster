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
import Models from "@/pages/forecasts";
import NewModel from "@/pages/new-forecast";
import ModelDetail from "@/pages/forecast-detail";
import { ThemeProvider } from "./components/theme-provider";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/datasets" component={Datasets} />
        <Route path="/forecasts" component={Models} />
        <Route path="/forecasts/new" component={NewModel} />
        <Route path="/forecasts/:id" component={ModelDetail} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
