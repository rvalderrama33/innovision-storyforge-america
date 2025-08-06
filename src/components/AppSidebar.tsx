import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  PlusCircle, 
  UserPlus, 
  ShoppingBag, 
  Info, 
  Settings,
  Store,
  Package,
  ShoppingCart
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useAuth();
  const currentPath = location.pathname;
  const isMarketplacePage = currentPath.startsWith('/marketplace');

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const magazineItems = [
    { title: "Magazine", url: "/", icon: Home },
    { title: "Browse Stories", url: "/stories", icon: BookOpen },
    { title: "Submit Story", url: "/submit", icon: PlusCircle },
    { title: "Recommend Someone", url: "/recommend", icon: UserPlus },
    { title: "About", url: "/about", icon: Info },
  ];

  const marketplaceItems = [
    { title: "Product Categories", url: "/marketplace", icon: Store },
    { title: "Submit Your Product", url: "/marketplace/add", icon: Package },
    { title: "How We Work", url: "/about", icon: Info },
    { title: "About", url: "/about", icon: Info },
  ];

  const adminItems = [
    { title: "Admin Dashboard", url: "/admin", icon: Settings },
    ...(isMarketplacePage ? [] : [{ title: "Marketplace", url: "/marketplace", icon: ShoppingBag }]),
  ];

  const currentItems = isMarketplacePage ? marketplaceItems : magazineItems;
  const showMagazineLink = isMarketplacePage;

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      variant="sidebar"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        {showMagazineLink && (
          <SidebarGroup>
            <SidebarGroupLabel>Navigate</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/" className={getNavCls}>
                      <Home className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Magazine</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>
            {isMarketplacePage ? "Marketplace" : "Magazine"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className={getNavCls}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}