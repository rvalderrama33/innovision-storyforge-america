
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Clock, Calendar, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import SocialShare from '@/components/SocialShare';

const Article = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="w-full h-[60vh] lg:h-[70vh] relative overflow-hidden">
            <img
              src={article.image_urls[0]}
              alt={article.product_name}
              className="w-full h-full object-contain bg-black/20"
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
                  {article.product_name}
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
                  {article.full_name && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      By {article.full_name}
                    </Badge>
                  )}
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
                {article.product_name}
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
                {article.full_name && (
                  <Badge variant="secondary">
                    By {article.full_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        {/* Additional Images Gallery */}
        {article.image_urls && article.image_urls.length > 1 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {article.image_urls.slice(1).map((imageUrl, index) => (
                <div key={index} className="group relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                  <img
                    src={imageUrl}
                    alt={`${article.product_name} image ${index + 2}`}
                    className="w-full h-64 object-contain bg-muted/30 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-lg prose-slate max-w-none">
          <div 
            className="text-muted-foreground leading-relaxed text-lg [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mb-6 [&>h1]:mt-12 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-4 [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-medium [&>h3]:text-foreground [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:mb-6 [&>p]:leading-relaxed [&>ul]:mb-6 [&>ol]:mb-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-8"
            dangerouslySetInnerHTML={{
              __html: article.generated_article?.replace(
                new RegExp(`\\b${article.full_name}\\b`, 'gi'),
                `<span class="font-semibold text-primary">${article.full_name}</span>`
              ).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')
            }}
          />
        </article>

        {/* Social Share Section */}
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
            />
          </div>
        </div>

        {/* Sources Section */}
        {article.source_links && article.source_links.length > 0 && (
          <div className="mt-12 p-8 bg-card border border-border rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Sources & References</h3>
            </div>
            <div className="space-y-4">
              {article.source_links.map((source, index) => (
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
              ))}
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
