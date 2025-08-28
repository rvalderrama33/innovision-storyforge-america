import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { useMarketplaceConfig } from "@/hooks/useMarketplaceConfig";
import { Edit, Trash2, Eye, Plus } from "lucide-react";

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  status: string;
  featured: boolean;
  stock_quantity: number;
  created_at: string;
  is_affiliate: boolean;
  affiliate_price?: string;
}

const MarketplaceManage = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { user, isAdmin, isVendor } = useAuth();
  const { isMarketplaceLive, loading: configLoading } = useMarketplaceConfig();
  const { toast } = useToast();
  const location = useLocation();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check if we're in admin context
  const isInAdminContext = location.pathname.includes('/admin/marketplace');

  useSEO({
    title: "Manage Products | Marketplace",
    description: "Manage your marketplace products and inventory.",
    url: "https://americainnovates.us/marketplace/manage"
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from('marketplace_products')
          .select('*')
          .order('created_at', { ascending: false });

        // If in admin context, fetch all products; otherwise only user's products
        if (!isInAdminContext && user?.id) {
          query = query.eq('vendor_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to load products.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (isInAdminContext || user?.id) {
      fetchProducts();
    }
  }, [user?.id, isInAdminContext, toast]);

  // NOW WE CAN HAVE CONDITIONAL RETURNS
  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isMarketplaceLive && !isAdmin) {
    return <Navigate to="/" />;
  }

  // Restrict access to admins and vendors
  if (!user || (!isAdmin && !isVendor)) {
    return <Navigate to="/auth" replace />;
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Success",
        description: "Product deleted successfully."
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      draft: "secondary",
      inactive: "outline",
      sold: "destructive"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className={isInAdminContext ? "" : "min-h-screen bg-background"}>
      {!isInAdminContext && <Header />}
      
      <div className={isInAdminContext ? "" : "container mx-auto px-4 py-8"}>
        {!isInAdminContext && (
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Products</h1>
              <p className="text-muted-foreground">View and manage your marketplace listings</p>
            </div>
            
            <div className="space-x-4">
              <Link to="/marketplace/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
              <Link to="/marketplace/orders">
                <Button variant="outline">
                  Orders & Tracking
                </Button>
              </Link>
            </div>
          </div>
        )}

        {isInAdminContext && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">All Marketplace Products</h2>
              <p className="text-muted-foreground">Manage products from all vendors</p>
            </div>
            
            <div className="space-x-4">
              <Link to="/marketplace/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isInAdminContext ? `All Products (${products.length})` : `Your Products (${products.length})`}
          </CardTitle>
        </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">
                  {isInAdminContext ? "No Products Found" : "No Products Yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isInAdminContext 
                    ? "No products have been added to the marketplace yet."
                    : "Start by adding your first product to the marketplace."
                  }
                </p>
                <Link to="/marketplace/add">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            </div>
                            {product.featured && (
                              <Badge variant="secondary" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="outline">{product.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.is_affiliate && product.affiliate_price 
                            ? product.affiliate_price 
                            : formatPrice(product.price, product.currency)
                          }
                        </TableCell>
                        <TableCell>
                          <span className={product.stock_quantity === 0 ? 'text-destructive' : ''}>
                            {product.stock_quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(product.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link to={`/marketplace/product/${product.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link to={`/marketplace/edit/${product.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketplaceManage;