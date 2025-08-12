
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Clock, Calendar, ExternalLink, Share2, Globe, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Header from '@/components/Header';
import SocialShare from '@/components/SocialShare';
import SubscriptionGate from '@/components/SubscriptionGate';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import DOMPurify from 'dompurify';

interface BannerImageSettings {
  url: string;
  position: string;
  size: string;
}

const Article = () => {
  const { slug } = useParams();
  const { isSubscriber, user } = useAuth();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Optimize query to only select essential fields to reduce payload size
      const selectFields = `
        id, display_name, city, state, product_name, category, description,
        generated_article, image_urls, created_at, slug,
        banner_image, headshot_image, logo_image, website
      `.replace(/\s+/g, ' ').trim();

      // First try to find by slug with optimized query and timeout
      let { data, error } = await supabase
        .from('published_articles_public')
        .select(selectFields)
        .eq('slug', slug)
        .abortSignal(controller.signal)
        .maybeSingle();

      // If not found by slug, try by ID (for articles without slugs)
      if (!data && !error) {
        const { data: dataById, error: errorById } = await supabase
          .from('published_articles_public')
          .select(selectFields)
          .eq('id', slug)
          .abortSignal(controller.signal)
          .maybeSingle();
        
        data = dataById;
        error = errorById;
      }
      
      clearTimeout(timeoutId);

      if (error) throw error;
      if (!data) {
        setArticle(null);
        return;
      }

      // Parse banner_image if it's a JSON string - safely handle any data type
      if (data && 'banner_image' in data && data.banner_image && typeof data.banner_image === 'string') {
        try {
          const parsed = JSON.parse(data.banner_image);
          if (typeof parsed === 'object' && parsed?.url) {
            data.banner_image = parsed;
          }
        } catch (e) {
          // If parsing fails, leave as string - no logging to reduce overhead
        }
      }

      setArticle(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out:', error);
      } else {
        console.error('Error fetching article:', error);
      }
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  // Memoize share image to prevent recalculation
  const shareImage = useMemo(() => {
    if (article?.headshot_image) return article.headshot_image;
    if (article?.banner_image?.url) return article.banner_image.url;
    if (typeof article?.banner_image === 'string') return article.banner_image;
    if (article?.image_urls?.[0]) return article.image_urls[0];
    return 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
  }, [article?.headshot_image, article?.banner_image, article?.image_urls]);

  useSEO({
    title: article ? `${article.product_name} | America Innovates Magazine` : "Article | America Innovates Magazine",
    description: article ? (article.description || `Read about ${article.product_name} by ${article.display_name} - an inspiring innovation story from America Innovates Magazine.`) : "Discover inspiring innovation stories from entrepreneurs and creators building breakthrough consumer products.",
    url: `https://americainnovates.us/article/${slug}`,
    image: shareImage,
    type: "article"
  });

  // Helper function to format image URLs for display
  const formatImageUrl = (url: string): string => {
    if (!url) return '';
    
    // Return the original URL as is - we'll handle the alt text separately
    return url;
  };

  // Helper function to get clean alt text for images
  const getImageAltText = (url: string, productName: string): string => {
    if (!url) return productName || 'Product image';
    
    // Check if this is an uploaded image (from Supabase storage)
    if (url.includes('supabase.co/storage/v1/object/public/submission-images/')) {
      // For uploaded images, use a simple descriptive alt text
      return `${productName || 'Product'} image`;
    }
    
    // For external URL images, return simple clean alt text without messy filenames
    return `${productName || 'Product'} image`;
  };

  // Helper function to ensure website URL has proper protocol
  const formatWebsiteUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Memoize banner image URL to prevent recalculation
  const bannerUrl = useMemo(() => {
    if (!article) return '';
    
    if (article.banner_image) {
      return typeof article.banner_image === 'object' ? article.banner_image.url : article.banner_image;
    }
    
    return article.image_urls && article.image_urls.length > 0 ? article.image_urls[0] : '';
  }, [article?.banner_image, article?.image_urls]);

  // Helper function to get banner image style
  const getBannerImageStyle = () => {
    if (!article || !article.banner_image || typeof article.banner_image !== 'object') {
      // Special positioning for Lakesha Bowden to show her whole face
      if (article?.full_name === "Lakesha Bowden") {
        return { objectFit: 'cover', objectPosition: 'center 40%' } as React.CSSProperties;
      }
      // Special positioning for "a slice of innovation" story to show the face better
      if (article?.slug === 'a-slice-of-innovation-how-a-family-tradition-sparked-a-culinary-revolution') {
        return { objectFit: 'cover', objectPosition: 'center 25%' } as React.CSSProperties;
      }
      // Special positioning for Cognitive Card Games to show the entire face
      if (article?.product_name === "X-Squared Math Card Deck" || article?.business_name === "Cognitive Card Games LLC") {
        return { objectFit: 'cover', objectPosition: 'center 20%' } as React.CSSProperties;
      }
      return { objectFit: 'cover', objectPosition: 'center' } as React.CSSProperties;
    }
    
    const banner = article.banner_image;
    
    // Use typed object fit values
    const objectFit = banner.size === 'cover' ? 'cover' : 
                      banner.size === 'contain' ? 'contain' : 
                      'none';
    
    const style: React.CSSProperties = {
      objectFit: objectFit as 'cover' | 'contain' | 'none',
      objectPosition: banner.position || 'center'
    };
    
    // Special positioning for Lakesha Bowden to show her whole face
    if (article?.full_name === "Lakesha Bowden") {
      style.objectPosition = 'center 40%';
    }
    
    // Special positioning for "a slice of innovation" story to show the face better
    if (article?.slug === 'a-slice-of-innovation-how-a-family-tradition-sparked-a-culinary-revolution') {
      style.objectPosition = 'center 25%';
    }
    
    // Special positioning for Cognitive Card Games to show the entire face
    if (article?.product_name === "X-Squared Math Card Deck" || article?.business_name === "Cognitive Card Games LLC") {
      style.objectPosition = 'center 20%';
    }
    
    if (banner.size && banner.size !== 'cover' && banner.size !== 'contain' && banner.size !== 'auto') {
      style.transform = `scale(${parseFloat(banner.size) / 100})`;
    }
    
    return style;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeft className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Debug logging for subscription access
  console.log('Article access check:', {
    userEmail: user?.email,
    userId: user?.id,
    isSubscriber,
    hasUser: !!user
  });

  const hasBanner = !!bannerUrl;
  const hasHeadshot = !!article?.headshot_image;
  const hasLogo = !!article?.logo_image;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      <Header />
      
      {/* Hero Section */}
      <div className="relative">
        {hasBanner ? (
          <div className={`w-full relative overflow-hidden ${
            article?.product_name === "X-Squared Math Card Deck" || article?.business_name === "Cognitive Card Games LLC" 
              ? "h-[44vh] lg:h-[56vh]" 
              : "h-[35vh] lg:h-[45vh]"
          }`}>
            <img
              src={bannerUrl}
              alt={article.product_name || "Innovation story featured image"}
              className="w-full h-full object-cover"
              style={getBannerImageStyle()}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-block mb-3 sm:mb-6">
                  <Button variant="secondary" size="sm" className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                  {article.generated_article ? article.generated_article.split('\n')[0].replace(/^#+\s*/, '').trim() : article.product_name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{new Date(article.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">5 min read</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    By America Innovates Magazine
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-20 lg:py-32">
            <div className="max-w-4xl mx-auto px-6">
              <Link to="/" className="inline-block mb-6">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
                {article.generated_article ? article.generated_article.split('\n')[0].replace(/^#+\s*/, '').trim() : article.product_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{new Date(article.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">5 min read</span>
                </div>
                <Badge variant="secondary">
                  By America Innovates Magazine
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        {/* Author and Innovation Info */}
        <div className="mb-12 flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Innovator/Author Section */}
          {hasHeadshot && (
            <div className="md:w-1/3 flex flex-col items-center text-center">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage 
                  src={article.headshot_image} 
                  alt={article.full_name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {article.display_name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold mt-4 mb-1">{article.display_name}</h3>
              <p className="text-muted-foreground text-sm">
                {article.city && article.state ? `${article.city}, ${article.state}` : (article.city || article.state)}
              </p>
              <div className="flex gap-2 mt-3">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Innovator</span>
              </div>
            </div>
          )}
          
          {/* Product/Innovation Section */}
          <div className={`${hasHeadshot ? 'md:w-2/3' : 'w-full'} space-y-4`}>
            <div className="flex items-start gap-4">
              {hasLogo && (
                <div className="flex-shrink-0 w-16 h-16 bg-card border border-border rounded-md flex items-center justify-center overflow-hidden">
                  <img 
                    src={article.logo_image} 
                    alt={`${article.product_name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">{article.product_name}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.category && (
                    <Badge variant="outline" className="bg-primary/5">
                      {article.category}
                    </Badge>
                  )}
                  {article.stage && (
                    <Badge variant="outline" className="bg-secondary/5">
                      {article.stage}
                    </Badge>
                  )}
                </div>
                
              </div>
            </div>

            {/* Website Link */}
            {article.website && (
              <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg mt-4">
                <Globe className="w-5 h-5 text-primary" />
                <a
                  href={formatWebsiteUrl(article.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors font-medium group"
                >
                  <span className="group-hover:underline">{article.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-4 h-4 inline ml-1" />
                </a>
              </div>
            )}
          </div>
        </div>

        <article className="prose prose-lg prose-slate max-w-none">
          <style dangerouslySetInnerHTML={{
            __html: `
              .prose img {
                margin: 0;
              }
              .prose .float-left {
                float: left;
                margin-right: 1.5rem;
                margin-bottom: 1rem;
                max-width: 20rem;
                clear: left;
              }
              .prose .float-right {
                float: right;
                margin-left: 1.5rem;
                margin-bottom: 1rem;
                max-width: 20rem;
                clear: right;
              }
              .prose::after {
                content: "";
                display: table;
                clear: both;
              }
            `
          }} />
          {(() => {
            // Check if user is authenticated and is a subscriber
            const isAuthenticated = !!user;
            const canViewFullContent = isAuthenticated && isSubscriber;
            
            console.log('Content access decision:', {
              isAuthenticated,
              isSubscriber,
              canViewFullContent,
              userEmail: user?.email
            });
            
            const fullContent = article.generated_article || '';
            
            // Get content for display - either full or teaser
            let contentToShow = fullContent;
            if (!canViewFullContent) {
              // Show approximately first 20% of content for teaser
              const words = fullContent.split(' ');
              const teaserLength = Math.min(words.length, Math.floor(words.length * 0.2));
              contentToShow = words.slice(0, teaserLength).join(' ');
            }
            
            // Use the content as-is, images will be handled in the React rendering
            const finalContent = contentToShow;
            
            return (() => {
              const availableImages = article.image_urls?.filter(img => 
                img && 
                img.trim() !== '' && 
                img !== bannerUrl && 
                img !== article?.headshot_image && 
                img !== article?.logo_image
              ) || [];
              
              if (availableImages.length === 0) {
                return (
                  <div 
                    className="text-muted-foreground leading-relaxed text-lg [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mb-6 [&>h1]:mt-12 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-4 [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:text-foreground [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:mb-6 [&>p]:leading-relaxed [&>ul]:mb-6 [&>ol]:mb-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-8"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        finalContent?.replace(
                          new RegExp(`\\b${article.display_name}\\b`, 'gi'),
                          `<span class="font-semibold text-primary">${article.display_name}</span>`
                        ).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>') || ''
                      )
                    }}
                  />
                );
              }

              // Split content into paragraphs for image distribution
              const paragraphs = finalContent?.split(/\n\s*\n/) || [];
              const step = Math.max(2, Math.floor(paragraphs.length / availableImages.length));
              
              const contentParts = [];
              let currentParagraphs = [];
              let imageIndex = 0;
              
              for (let i = 0; i < paragraphs.length; i++) {
                currentParagraphs.push(paragraphs[i]);
                
                // Insert image after every few paragraphs
                if (imageIndex < availableImages.length && 
                    (i > 0 && (i + 1) % step === 0 || i === paragraphs.length - 1)) {
                  
                  // Add the current text chunk
                  if (currentParagraphs.length > 0) {
                    const textContent = currentParagraphs.join('\n\n')
                      .replace(new RegExp(`\\b${article.display_name}\\b`, 'gi'), 
                        `<span class="font-semibold text-primary">${article.display_name}</span>`);
                    
                    contentParts.push(
                      <div key={`text-${i}`} 
                        className="text-muted-foreground leading-relaxed text-lg [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mb-6 [&>h1]:mt-12 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-4 [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:text-foreground [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:mb-6 [&>p]:leading-relaxed [&>ul]:mb-6 [&>ol]:mb-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-8"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            textContent.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')
                          )
                        }}
                      />
                    );
                    currentParagraphs = [];
                  }
                  
                  // Add image
                  if (imageIndex < availableImages.length) {
                    const imageUrl = availableImages[imageIndex];
                    const float = imageIndex % 2 === 0 ? 'left' : 'right';
                    const formattedUrl = formatImageUrl(imageUrl);
                    const altText = getImageAltText(imageUrl, article.product_name);
                    
                    contentParts.push(
                      <img 
                        key={`image-${imageIndex}`}
                        src={formattedUrl} 
                        alt={altText}
                        className={`float-${float} ${float === 'left' ? 'mr-6 mb-4' : 'ml-6 mb-4'} max-w-sm rounded-lg shadow-md w-full h-auto object-cover`}
                        style={{ maxHeight: '300px' }}
                      />
                    );
                    imageIndex++;
                  }
                }
              }
              
              return (
                <>
                  {contentParts}
                  {!canViewFullContent && (
                    <SubscriptionGate articleTitle={article.product_name} />
                  )}
                </>
              );
            })();
          })()}
        </article>

        {/* Social Share Section - Only for subscribers */}
        {user && isSubscriber && (
          <div className="mt-16 pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Share this story</h3>
                <p className="text-muted-foreground text-sm">Help others discover this inspiring innovation</p>
              </div>
              <SocialShare 
                url={`https://americainnovates.us/article/${slug}`}
                title={article.product_name}
                description={article.description || `Read about ${article.product_name} by ${article.display_name}`}
                image={shareImage}
              />
            </div>
          </div>
        )}

        {/* Sources Section - Only for subscribers */}
        {user && isSubscriber && (
          <div className="mt-12 p-8 bg-card border border-border rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Sources & References</h3>
            </div>
            <div className="space-y-4">
              {(() => {
                const defaultSources = [
                  'https://www.wikipedia.org/',
                  'https://www.reddit.com/',
                  'https://myproduct.today/',
                  'https://www.linkedin.com/'
                ];
                const allSources = [...(article.source_links || []), ...defaultSources];
                return allSources.map((source, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors text-sm leading-relaxed break-all group"
                    >
                      <span className="group-hover:underline">{source}</span>
                      <ExternalLink className="w-3 h-3 inline ml-1 opacity-60" />
                    </a>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Related Articles CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 lg:p-12">
            <h3 className="text-2xl font-bold text-foreground mb-4">Discover More Innovation Stories</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Explore other inspiring stories of entrepreneurs and innovators who are changing the world.
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                Explore More Stories
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Article;
