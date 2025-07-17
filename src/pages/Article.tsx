import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Clock, Calendar, ExternalLink, Share2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import SocialShare from '@/components/SocialShare';
import SubscriptionGate from '@/components/SubscriptionGate';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import DOMPurify from 'dompurify';

const Article = () => {
  const { slug } = useParams();
  const { isSubscriber, user } = useAuth();
  const [article, setArticle] = useState(null);
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
    image: article?.image_urls?.[0],
    type: "article"
  });

  // Debug logging
  useEffect(() => {
    if (article) {
      console.log('Article data:', article);
      console.log('Article images:', article.image_urls);
      console.log('First image URL:', article.image_urls?.[0]);
    }
  }, [article]);

  // Function to distribute images with text wrapping throughout article content
  const distributeImagesInContent = (content, images) => {
    if (!images || images.length <= 1) {
      return content;
    }

    // Skip the first image as it's used as hero image
    const availableImages = images.slice(1);
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
        result.push(`<img src="${imageUrl}" alt="${article.product_name} image" class="float-${float} ${float === 'left' ? 'mr-6 mb-4' : 'ml-6 mb-4'} max-w-sm rounded-lg shadow-md w-full h-auto object-cover" style="max-height: 300px;" />`);
        imageIndex++;
      }
      
      result.push(paragraphs[i]);
    }
    
    return result.join('\n\n');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      <Header />
      
      {/* Hero Section */}
      <div className="relative">
        {article.image_urls && article.image_urls.length > 0 && (
          <div className="w-full h-[40vh] lg:h-[50vh] relative overflow-hidden">
            <img
              src={article.image_urls[0]}
              alt={article.product_name || "Innovation story featured image"}
              className="w-full h-full object-cover object-top"
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
                  {article.generated_article ? article.generated_article.split('\n')[0].replace(/^#+\s*/, '').trim() : article.full_name}
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
        )}
        
        {(!article.image_urls || article.image_urls.length === 0) && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-20 lg:py-32">
            <div className="max-w-4xl mx-auto px-6">
              <Link to="/" className="inline-block mb-6">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
               <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-tight">
                 {article.generated_article ? article.generated_article.split('\n')[0].replace(/^#+\s*/, '').trim() : article.full_name}
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
        {/* Prominent Website Link */}
        {article.website && (
          <div className="mb-12 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Visit {article.product_name}</h3>
                <a
                  href={article.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium text-lg group"
                >
                  <span className="group-hover:underline">{article.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        )}

        <article className="prose prose-lg prose-slate max-w-none">
          <style jsx>{`
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
          `}</style>
          {(() => {
            const isSubscribed = user && isSubscriber;
            const fullContent = article.generated_article || '';
            
            // Get content for display - either full or teaser
            let contentToShow = fullContent;
            if (!isSubscribed) {
              // Show approximately first 20% of content for teaser
              const words = fullContent.split(' ');
              const teaserLength = Math.min(words.length, Math.floor(words.length * 0.2));
              contentToShow = words.slice(0, teaserLength).join(' ');
            }
            
            // Distribute images throughout the content if subscribed
            const contentWithImages = isSubscribed ? 
              distributeImagesInContent(contentToShow, article.image_urls) : 
              contentToShow;
            
            return (
              <>
                <div 
                  className="text-muted-foreground leading-relaxed text-lg [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mb-6 [&>h1]:mt-12 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-4 [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:text-foreground [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:mb-6 [&>p]:leading-relaxed [&>ul]:mb-6 [&>ol]:mb-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-8"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      contentWithImages?.replace(
                        new RegExp(`\\b${article.full_name}\\b`, 'gi'),
                        `<span class="font-semibold text-primary">${article.full_name}</span>`
                      ).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>') || ''
                    )
                  }}
                />
                {!isSubscribed && (
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
                image={article.image_urls?.[0]}
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
