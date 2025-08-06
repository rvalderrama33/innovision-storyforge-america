import { 
  FileText, 
  Database, 
  Plus, 
  Mail, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Shield, 
  Home,
  Store
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { title: "Overview", url: "/admin", icon: Home, exact: true },
  { title: "Submissions", url: "/admin/submissions", icon: FileText },
  { title: "Reports", url: "/admin/reports", icon: Database },
  { title: "Create Article", url: "/admin/create", icon: Plus },
  { title: "Newsletter", url: "/admin/newsletter", icon: Mail },
  { title: "Newsletter Analytics", url: "/admin/newsletter-analytics", icon: BarChart3 },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { title: "Recommendations", url: "/admin/recommendations", icon: Users },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Security", url: "/admin/security", icon: Shield },
  { title: "Email Center", url: "/admin/emails", icon: Mail },
  { title: "Vendor Dashboard", url: "/vendor/dashboard", icon: Store },
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string, exact?: boolean) => {
    return isActive(path, exact) 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar className="w-64" collapsible="none">
      <SidebarHeader className="border-b border-border/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg text-foreground">
            Admin Panel
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink 
                      to={item.url} 
                      end={item.exact}
                      className={getNavClass(item.url, item.exact)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}