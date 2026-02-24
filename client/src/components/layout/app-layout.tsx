import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ThemeToggle } from "../theme-toggle";

export function AppLayout({ children }: { children: ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 flex items-center gap-4 px-6 border-b border-border/40 bg-background/50 backdrop-blur-sm z-10 sticky top-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="ml-auto flex items-center space-x-4">
              <ThemeToggle />
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent border border-white/10 shadow-inner"></div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
