
import React, { useState, useEffect } from 'react';
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
      // First try to find by slug
      let { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      // If not found by slug, try by ID (for articles without slugs)
      if (error && error.code === 'PGRST116') {
        const { data: dataById, error: errorById } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', slug)
          .eq('status', 'approved')
          .single();
        
        data = dataById;
        error = errorById;
      }

      if (error) throw error;

      // Parse banner_image if it's a JSON string
      if (data.banner_image && typeof data.banner_image === 'string') {
        try {
          const parsed = JSON.parse(data.banner_image);
          if (typeof parsed === 'object' && parsed.url) {
            data.banner_image = parsed;
          }
        } catch (e) {
          // If parsing fails, leave as string
          console.log('Banner image is not in JSON format:', e);
        }
      }

      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update SEO when article loads
  useSEO({
    title: article ? `${article.product_name} | America Innovates Magazine` : "Article | America Innovates Magazine",
    description: article ? (article.description || `Read about ${article.product_name} by ${article.full_name} - an inspiring innovation story from America Innovates Magazine.`) : "Discover inspiring innovation stories from entrepreneurs and creators building breakthrough consumer products.",
    url: `https://americainnovates.us/article/${slug}`,
    image: article?.banner_image?.url || article?.image_urls?.[0],
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

  // Function to distribute images with text wrapping throughout article content
  const distributeImagesInContent = (content, images) => {
    if (!content || !images || !Array.isArray(images) || images.length <= 1) {
      return content;
    }

    // Skip the banner image if it exists in image_urls
    const bannerUrl = article?.banner_image ? 
      (typeof article.banner_image === 'object' && article.banner_image?.url ? article.banner_image.url : article.banner_image) : 
      null;
      
    // Filter out undefined or null values and check if the image is not the banner, headshot or logo
    const availableImages = images.filter(img => 
      img && 
      img !== bannerUrl && 
      img !== article?.headshot_image && 
      img !== article?.logo_image
    );
    
    if (availableImages.length === 0) {
      return content;
    }

    // Split content into paragraphs
    const paragraphs = content.split('\n\n');
    
    // Calculate positions to insert images (roughly every 3-4 paragraphs)
    const imagePositions = [];
    const step = Math.max(3, Math.floor(paragraphs.length / availableImages.length));
    
    for (let i = 0; i < availableImages.length; i++) {
      const position = Math.min(step * (i + 1), paragraphs.length - 1);
      const floatDirection = i % 2 === 0 ? 'left' : 'right';
      imagePositions.push({ 
        position, 
        imageUrl: availableImages[i],
        float: floatDirection
      });
    }

    // Insert images at calculated positions with text wrapping
    let result = [];
    let imageIndex = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      // Check if we should insert an image before this paragraph
      if (imageIndex < imagePositions.length && i === imagePositions[imageIndex].position) {
        const { imageUrl, float } = imagePositions[imageIndex];
        if (imageUrl) {  // Only add the image if URL is valid
          const formattedUrl = formatImageUrl(imageUrl);
          const altText = getImageAltText(imageUrl, article.product_name);
          result.push(`<img src="${formattedUrl}" alt="${altText}" class="float-${float} ${float === 'left' ? 'mr-6 mb-4' : 'ml-6 mb-4'} max-w-sm rounded-lg shadow-md w-full h-auto object-cover" style="max-height: 300px;" />`);
        }
        imageIndex++;
      }
      
      result.push(paragraphs[i]);
    }
    
    return result.join('</p><p>');
  };

  // Helper function to ensure website URL has proper protocol
  const formatWebsiteUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Helper function to get banner image URL
  const getBannerImageUrl = () => {
    if (!article) return '';
    
    if (article.banner_image) {
      return typeof article.banner_image === 'object' ? article.banner_image.url : article.banner_image;
    }
    
    return article.image_urls && article.image_urls.length > 0 ? article.image_urls[0] : '';
  };

  // Helper function to get banner image style
  const getBannerImageStyle = () => {
    if (!article || !article.banner_image || typeof article.banner_image !== 'object') {
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

  const bannerUrl = getBannerImageUrl();
  const hasBanner = !!bannerUrl;
  const hasHeadshot = !!article?.headshot_image;
  const hasLogo = !!article?.logo_image;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      <Header />
      
      {/* Hero Section */}
      <div className="relative">
        {hasBanner ? (
          <div className="w-full h-[40vh] lg:h-[50vh] relative overflow-hidden">
            <img
              src={bannerUrl}
              alt={article.product_name || "Innovation story featured image"}
              className="w-full h-full"
              style={getBannerImageStyle()}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-block mb-6">
                  <Button variant="secondary" size="sm" className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
                <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 leading-tight">
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
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-tight">
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
                <AvatarImage src={article.headshot_image} alt={article.full_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {article.full_name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold mt-4 mb-1">{article.full_name}</h3>
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
                <p className="text-muted-foreground">{article.description}</p>
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
            
            // Only distribute images if user can view full content
            const finalContent = canViewFullContent && article.image_urls && article.image_urls.length > 1 ? 
              distributeImagesInContent(contentToShow, article.image_urls) : 
              contentToShow;
            
            return (
              <>
                <div 
                  className="text-muted-foreground leading-relaxed text-lg [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mb-6 [&>h1]:mt-12 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-4 [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:text-foreground [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:mb-6 [&>p]:leading-relaxed [&>ul]:mb-6 [&>ol]:mb-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-8"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      finalContent?.replace(
                        new RegExp(`\\b${article.full_name}\\b`, 'gi'),
                        `<span class="font-semibold text-primary">${article.full_name}</span>`
                      ).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>') || ''
                    )
                  }}
                />
                {!canViewFullContent && (
                  <SubscriptionGate articleTitle={article.product_name} />
                )}
              </>
            );
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
                url={window.location.href}
                title={article.product_name}
                description={article.description || `Read about ${article.product_name} by ${article.full_name}`}
                image={getBannerImageUrl()}
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
