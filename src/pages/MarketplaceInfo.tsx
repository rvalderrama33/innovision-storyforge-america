import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { BecomeVendorButton } from '@/components/BecomeVendorButton';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Users, ShoppingBag, Star, ArrowRight, Package, Settings } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  primary_image_index: number;
  slug: string;
  featured: boolean;
  stock_quantity: number;
  vendor_id: string;
  is_affiliate: boolean;
  affiliate_url: string;
  affiliate_price?: string;
}

const MarketplaceInfo = () => {
  const { user, isVendor } = useAuth();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "America Innovates Marketplace | Supporting American Entrepreneurs",
    description: "Discover and support innovative products from American entrepreneurs and creators. Join our multi-vendor marketplace to showcase your innovations.",
    url: "https://americainnovates.us/marketplace-info"
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('status', 'active')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(12);

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
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            America Innovates Marketplace
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A multi-vendor e-commerce platform dedicated to supporting American entrepreneurs and creators. 
            Discover breakthrough consumer products and connect directly with the innovators behind them.
          </p>
          
          {isVendor ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 font-medium">Welcome back, vendor!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/vendor-dashboard">
                  <Button size="lg">
                    <Settings className="h-4 w-4 mr-2" />
                    Vendor Dashboard
                  </Button>
                </Link>
                <Link to="/marketplace/orders">
                  <Button size="lg" variant="outline">
                    <Package className="h-4 w-4 mr-2" />
                    Process Orders
                  </Button>
                </Link>
              </div>
            </div>
          ) : user ? (
            <BecomeVendorButton />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">Sign in to apply as a vendor</p>
              <Link to="/auth">
                <Button size="lg">
                  Sign In to Apply
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover innovative products from American entrepreneurs and creators
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-8">Be the first to add a product to our marketplace!</p>
              {user ? (
                <BecomeVendorButton />
              ) : (
                <Link to="/auth">
                  <Button>
                    Sign In to Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="p-0">
                      <div className="w-full h-48 bg-muted rounded-t-lg overflow-hidden relative">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[product.primary_image_index || 0]} 
                            alt={product.name}
                            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              if (product.primary_image_index !== 0) {
                                (e.target as HTMLImageElement).src = product.images[0];
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-12 w-12" />
                          </div>
                        )}
                        {product.featured && (
                          <Badge className="absolute top-2 left-2" variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg line-clamp-2 pr-2">{product.name}</CardTitle>
                      </div>
                      
                      {product.category && (
                        <Badge variant="outline" className="mb-2">{product.category}</Badge>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {product.is_affiliate && product.affiliate_price 
                            ? product.affiliate_price 
                            : formatPrice(product.price, product.currency)
                          }
                        </span>
                        {!product.is_affiliate && (
                          <span className="text-sm text-muted-foreground">
                            {product.stock_quantity} in stock
                          </span>
                        )}
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

              {products.length >= 12 && (
                <div className="text-center mt-12">
                  <Link to="/marketplace">
                    <Button size="lg" variant="outline">
                      View All Products
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Vendor CTA Section */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Sell Your Products?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join our community of innovative entrepreneurs and start selling to customers who value American-made products.
          </p>
          
          {user ? (
            <BecomeVendorButton />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 font-medium">Sign in to apply as a vendor</p>
              <Link to="/auth">
                <Button size="lg">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MarketplaceInfo;