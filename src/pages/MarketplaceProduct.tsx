import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useMarketplaceConfig } from "@/hooks/useMarketplaceConfig";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, ShoppingCart, Package, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import MediaGallery from "@/components/MediaGallery";

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
  specifications: any;
  shipping_info: any;
  tags: string[];
  sales_links: string[];
  video_urls: string[];
  is_affiliate: boolean;
  affiliate_url: string;
  affiliate_price?: string;
  created_at: string;
}

interface MarketplaceReview {
  id: string;
  product_id: string;
  reviewer_id: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const MarketplaceProduct = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { isMarketplaceLive, loading: configLoading } = useMarketplaceConfig();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });
  const [vendorName, setVendorName] = useState<string | null>(null);
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Always call useSEO hook before any early returns
  useSEO({
    title: product ? `${product.name} | Marketplace` : 'Product | Marketplace',
    description: product ? product.description.substring(0, 160) : 'Marketplace product details',
    url: `https://americainnovates.us/marketplace/product/${product?.slug || product?.id || id}`
  });

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      if (!id) return;

      try {
        // Check if the id parameter is a UUID or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        let query = supabase.from('marketplace_products').select('*');
        
        if (isUUID) {
          query = query.eq('id', id);
        } else {
          query = query.eq('slug', id);
        }
        
        const { data: productData, error: productError } = await query.maybeSingle();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch vendor information if product exists
        if (productData?.vendor_id) {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendor_applications')
            .select('business_name')
            .eq('user_id', productData.vendor_id)
            .eq('status', 'approved')
            .maybeSingle();

          if (!vendorError && vendorData) {
            setVendorName(vendorData.business_name);
          }
        }
        
        // Set the initial selected image to the primary image
        if (productData && productData.images && productData.images.length > 0) {
          const primaryIndex = productData.primary_image_index || 0;
          // Ensure the primary index is valid
          const validIndex = Math.min(primaryIndex, productData.images.length - 1);
          setSelectedImage(Math.max(0, validIndex));
        }

        // Fetch reviews for this product
        if (productData) {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('marketplace_reviews')
            .select('*')
            .eq('product_id', productData.id)
            .order('created_at', { ascending: false });

          if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
          } else {
            // Fetch reviewer names separately
            const reviewsWithProfiles = await Promise.all(
              (reviewsData || []).map(async (review) => {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', review.reviewer_id)
                  .single();
                
                return {
                  ...review,
                  profiles: profile || { full_name: 'Anonymous' }
                };
              })
            );
            setReviews(reviewsWithProfiles);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [id]);

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

  // Allow everyone to view products when marketplace is live
  // No authentication required for viewing products

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

  const handleAffiliateClick = async () => {
    if (product?.is_affiliate && product?.affiliate_url) {
      // Track affiliate click
      try {
        await supabase.from('affiliate_clicks').insert({
          product_id: product.id,
          user_id: user?.id || null,
          ip_address: null, // Could be populated from client IP if needed
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Error tracking affiliate click:', error);
      }
      
      // Add UTM parameters
      const url = new URL(product.affiliate_url);
      url.searchParams.set('ref', 'americainnovates');
      url.searchParams.set('utm_source', 'americainnovates');
      url.searchParams.set('utm_medium', 'affiliate');
      url.searchParams.set('utm_campaign', 'marketplace');
      
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    }
  };

  const submitReview = async () => {
    if (!user || !product) return;

    try {
      const { error } = await supabase.from('marketplace_reviews').insert({
        product_id: product.id,
        reviewer_id: user.id,
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        images: []
      });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Your review has been posted successfully.",
      });

      // Reset form and hide it
      setNewReview({ rating: 5, title: '', content: '' });
      setShowReviewForm(false);

      // Refresh reviews
      const { data: reviewsData } = await supabase
        .from('marketplace_reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        const reviewsWithProfiles = await Promise.all(
          reviewsData.map(async (review) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', review.reviewer_id)
              .single();
            
            return {
              ...review,
              profiles: profile || { full_name: 'Anonymous' }
            };
          })
        );
        setReviews(reviewsWithProfiles);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/marketplace">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/marketplace" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Media Gallery */}
          <div className="w-full space-y-6">
            <MediaGallery
              images={product.images || []}
              videoUrls={product.video_urls || []}
              primaryIndex={product.primary_image_index || 0}
              productName={product.name}
            />

            {/* Specifications Section - vertical under images */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {product.featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>
              
              {product.category && (
                <Badge variant="outline" className="mb-4">{product.category}</Badge>
              )}
              
              <div className="space-y-2 mb-4">
                <span className="text-3xl font-bold text-primary block">
                  {product.is_affiliate && product.affiliate_price 
                    ? product.affiliate_price 
                    : formatPrice(product.price, product.currency)
                  }
                </span>
                
                {vendorName && (
                  <p className="text-muted-foreground text-sm">
                    Sold by <span className="font-medium text-foreground">{vendorName}</span>
                  </p>
                )}
                
                {!product.is_affiliate && (
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {product.stock_quantity} in stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}


            <Separator />

            <div className="space-y-4">
              {product.is_affiliate ? (
                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handleAffiliateClick}
                  disabled={!product.affiliate_url}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Buy Now
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full" 
                  disabled={product.stock_quantity === 0}
                  onClick={() => addToCart(product.id)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span>30-day Returns</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Customer Reviews</CardTitle>
              
              {/* Rating Summary */}
              <div className="flex items-center gap-4 mt-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{calculateAverageRating()}</div>
                  {renderStars(calculateAverageRating(), 'lg')}
                  <div className="text-sm text-muted-foreground mt-1">
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
                
                {/* Rating Breakdown */}
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter(r => r.rating === rating).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-2 text-sm">
                        <span className="w-2">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 bg-muted rounded-full h-2 relative">
                          <div 
                            className="bg-yellow-400 h-full rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Write Review Button */}
              {user && (
                <div className="mb-6">
                  {!showReviewForm ? (
                    <Button onClick={() => setShowReviewForm(true)}>
                      Write a Review
                    </Button>
                  ) : (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h3 className="font-semibold">Write Your Review</h3>
                      
                      {/* Star Rating Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= newReview.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-muted-foreground hover:text-yellow-400'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Title */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <input
                          type="text"
                          placeholder="Summarize your review"
                          value={newReview.title}
                          onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Review Content */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Review</label>
                        <Textarea
                          placeholder="Share your experience with this product"
                          value={newReview.content}
                          onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                          rows={4}
                        />
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={submitReview}
                          disabled={!newReview.title || !newReview.content}
                        >
                          Submit Review
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowReviewForm(false);
                            setNewReview({ rating: 5, title: '', content: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="font-semibold">{review.title}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            By {review.profiles?.full_name || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProduct;