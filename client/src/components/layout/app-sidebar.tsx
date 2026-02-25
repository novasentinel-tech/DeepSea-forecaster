import { BarChart3, Home, LayoutDashboard, Settings } from "lucide-react";
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
import { Link, useLocation } from "wouter";

const navigation = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "KPI Explorer", url: "/kpis", icon: BarChart3 },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-primary">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          Nexus<span className="text-foreground">Metrics</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="hover-elevate my-0.5 rounded-lg font-medium"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="hover-elevate text-muted-foreground hover:text-foreground">
                <Link href="#" className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
