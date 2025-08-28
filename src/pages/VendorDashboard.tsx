import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Plus, 
  Eye, 
  Edit,
  TrendingUp,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface VendorStats {
  totalProducts: number;
  totalOrders: number;
  totalEarnings: number;
  pendingOrders: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
}

const VendorDashboard = () => {
  const { user, isVendor, loading } = useAuth();
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalEarnings: 0,
    pendingOrders: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && isVendor) {
      fetchVendorData();
    }
  }, [user, isVendor]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      // Fetch vendor products
      const { data: products, error: productsError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch vendor orders
      const { data: orders, error: ordersError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('vendor_id', user.id);

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      const totalEarnings = orders
        ?.filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total_amount, 0) || 0;

      setStats({
        totalProducts,
        totalOrders,
        totalEarnings,
        pendingOrders,
      });

      // Set recent products (last 5)
      setRecentProducts(products?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to load vendor data');
    } finally {
      setLoadingData(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be a vendor to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/marketplace">
              <Button>Return to Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Manage your products and track your performance.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link to="/marketplace/add">
              <Button className="w-full h-16 text-lg">
                <Plus className="h-5 w-5 mr-2" />
                Add New Product
              </Button>
            </Link>
            <Link to="/marketplace/manage">
              <Button variant="outline" className="w-full h-16 text-lg">
                <Edit className="h-5 w-5 mr-2" />
                Manage Products
              </Button>
            </Link>
            <Link to="/marketplace/orders">
              <Button variant="outline" className="w-full h-16 text-lg">
                <Package className="h-5 w-5 mr-2" />
                Orders & Tracking
              </Button>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(stats.totalEarnings, 'USD')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              </CardContent>
            </Card>
          </div>


          {/* Recent Products */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>
                Your latest product listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first product
                  </p>
                  <Link to="/marketplace/add">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(product.price, product.currency)}
                          </span>
                          {getStatusBadge(product.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/marketplace/product/${product.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/marketplace/edit/${product.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {recentProducts.length > 0 && (
                    <>
                      <Separator />
                      <div className="text-center">
                        <Link to="/marketplace/manage">
                          <Button variant="outline">View All Products</Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default VendorDashboard;