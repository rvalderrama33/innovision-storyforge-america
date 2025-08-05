import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useMarketplaceConfig } from "@/hooks/useMarketplaceConfig";

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  primary_image_index: number; // Add primary image index
  slug: string;
  featured: boolean;
  stock_quantity: number;
  vendor_id: string;
}

const Marketplace = () => {
  const { user, isAdmin } = useAuth();
  const { isMarketplaceLive, loading: configLoading } = useMarketplaceConfig();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Marketplace | America Innovates Magazine",
    description: "Discover and purchase innovative consumer products from featured entrepreneurs and creators.",
    url: "https://americainnovates.us/marketplace"
  });

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

  // Restrict access to admins only for now
  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Marketplace</h1>
            <p className="text-muted-foreground">Discover innovative products from our featured entrepreneurs</p>
          </div>
          
          <div className="space-x-4">
            <Link to="/marketplace/add">
              <Button>Add Product</Button>
            </Link>
            <Link to="/marketplace/manage">
              <Button variant="outline">Manage Products</Button>
            </Link>
            <Link to="/marketplace/orders">
              <Button variant="outline">Orders & Tracking</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-full h-48 bg-muted rounded-md"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">No Products Available</h2>
            <p className="text-muted-foreground mb-6">Be the first to add a product to our marketplace!</p>
            <Link to="/marketplace/add">
              <Button>Add Your Product</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="w-full h-48 bg-muted rounded-t-lg overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[product.primary_image_index || 0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          // Fallback to first image if primary image fails to load
                          if (product.primary_image_index !== 0) {
                            (e.target as HTMLImageElement).src = product.images[0];
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                    {product.featured && (
                      <Badge variant="secondary" className="ml-2">Featured</Badge>
                    )}
                  </div>
                  
                  {product.category && (
                    <Badge variant="outline" className="mb-2">{product.category}</Badge>
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {product.stock_quantity} in stock
                    </span>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <Link to={`/marketplace/product/${product.slug || product.id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;