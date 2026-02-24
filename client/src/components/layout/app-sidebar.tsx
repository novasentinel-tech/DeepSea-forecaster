import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Database, 
  LayoutDashboard, 
  LineChart, 
  Settings,
  Zap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Visão Geral", url: "/", icon: LayoutDashboard },
  { title: "Conjuntos de Dados", url: "/datasets", icon: Database },
  { title: "Previsões", url: "/forecasts", icon: Activity },
  { title: "Nova Previsão", url: "/forecasts/new", icon: LineChart },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30">
          <Zap className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Jota<span className="text-primary font-black">IA</span>
        </span>
      </SidebarHeader>
      
      <SidebarContent className="p-2 mt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-2 mb-2">
            Motor de Análise
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        transition-all duration-200 py-5 px-3 rounded-xl mb-1
                        ${isActive 
                          ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
