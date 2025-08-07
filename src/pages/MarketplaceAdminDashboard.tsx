import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorManagement } from '@/components/VendorManagement';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp, 
  Users, 
  DollarSign,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface MarketplaceStats {
  totalVendors: number;
  pendingApplications: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  commissionsOwed: number;
}

const MarketplaceAdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState<MarketplaceStats>({
    totalVendors: 0,
    pendingApplications: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    commissionsOwed: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Extract current tab from URL path
  const currentTab = location.pathname === '/admin/marketplace' ? 'overview' : 
                    location.pathname.split('/admin/marketplace/')[1] || 'overview';

  useSEO({
    title: "Marketplace Admin Dashboard | America Innovates",
    description: "Manage marketplace operations, vendors, orders, and analytics",
    url: "https://americainnovates.us/admin/marketplace"
  });

  const fetchMarketplaceStats = async () => {
    try {
      setLoadingStats(true);

      // Fetch vendor stats
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_applications')
        .select('status');

      if (vendorError) throw vendorError;

      const totalVendors = vendorData?.filter(v => v.status === 'approved').length || 0;
      const pendingApplications = vendorData?.filter(v => v.status === 'pending').length || 0;

      // Fetch product stats
      const { data: productData, error: productError } = await supabase
        .from('marketplace_products')
        .select('id, status');

      if (productError) throw productError;

      const totalProducts = productData?.filter(p => p.status === 'active').length || 0;

      // Fetch order stats
      const { data: orderData, error: orderError } = await supabase
        .from('marketplace_orders')
        .select('total_amount, status');

      if (orderError) throw orderError;

      const totalOrders = orderData?.length || 0;
      const totalRevenue = orderData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const commissionsOwed = Math.round(totalRevenue * 0.2); // 20% commission

      setStats({
        totalVendors,
        pendingApplications,
        totalProducts,
        totalOrders,
        totalRevenue,
        commissionsOwed
      });
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      toast.error('Failed to load marketplace statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMarketplaceStats();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Store className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-muted-foreground">Active Vendors</p>
                      <p className="text-2xl font-bold">{loadingStats ? '-' : stats.totalVendors}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                      <p className="text-2xl font-bold">{loadingStats ? '-' : stats.pendingApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                      <p className="text-2xl font-bold">{loadingStats ? '-' : stats.totalProducts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <ShoppingCart className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{loadingStats ? '-' : stats.totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {loadingStats ? '-' : `$${(stats.totalRevenue / 100).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                      <p className="text-2xl font-bold">
                        {loadingStats ? '-' : `$${(stats.commissionsOwed / 100).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common marketplace management tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/admin/marketplace/vendors" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Review Vendor Applications
                      {stats.pendingApplications > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {stats.pendingApplications}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  
                  <Link to="/marketplace" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      View Marketplace
                    </Button>
                  </Link>
                  
                  <Link to="/admin/marketplace/orders" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Manage Orders
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Marketplace Health</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Vendors</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium">{stats.totalVendors}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Reviews</span>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                      <span className="text-sm font-medium">{stats.pendingApplications}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Product Catalog</span>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium">{stats.totalProducts} items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'vendors':
        return <VendorManagement />;

      case 'orders':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Manage and track marketplace orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                <p>Order management interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'analytics':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Analytics</CardTitle>
              <CardDescription>Detailed sales and performance analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>Advanced analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-green-50/20">
        <AdminSidebar />
        
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center">
                    <Store className="h-6 w-6 mr-2 text-green-600" />
                    Marketplace Admin
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">Manage vendors, products, and orders</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/admin/choice">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Switch Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Tabs value={currentTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" asChild>
                  <Link to="/admin/marketplace">Overview</Link>
                </TabsTrigger>
                <TabsTrigger value="vendors" asChild>
                  <Link to="/admin/marketplace/vendors">Vendors</Link>
                </TabsTrigger>
                <TabsTrigger value="orders" asChild>
                  <Link to="/admin/marketplace/orders">Orders</Link>
                </TabsTrigger>
                <TabsTrigger value="analytics" asChild>
                  <Link to="/admin/marketplace/analytics">Analytics</Link>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={currentTab}>
                {renderTabContent()}
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MarketplaceAdminDashboard;