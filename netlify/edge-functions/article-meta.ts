import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async (request: Request) => {
  const url = new URL(request.url);
  console.log('🚀 Article Meta Edge Function triggered!', {
    url: request.url,
    pathname: url.pathname,
    userAgent: request.headers.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Extract slug from URL path like /article/slug-here
  const pathSegments = url.pathname.split('/');
  if (pathSegments.length < 3 || pathSegments[1] !== 'article') {
    console.log('❌ Invalid article URL path:', url.pathname);
    return new Response('Invalid article URL', { status: 400 });
  }
  
  const slug = pathSegments[2];
  console.log('✅ Processing article request for slug:', slug);
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Fetch article data from Supabase
    const { data: article, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();
    
    if (error || !article) {
      console.log('❌ Article not found:', error);
      return new Response('Article not found', { status: 404 });
    }
    
    console.log('✅ Article found:', article.product_name);
    
    // Determine the best image for social sharing
    const getShareImage = () => {
      console.log('🖼️ Banner image data:', article.banner_image);
      console.log('🖼️ Headshot image:', article.headshot_image);
      console.log('🖼️ Gallery images:', article.image_urls);
      
      // Priority: banner_image > headshot_image > first gallery image > logo_image
      if (article.banner_image) {
        let bannerUrl = null;
        if (typeof article.banner_image === 'string') {
          bannerUrl = article.banner_image;
        } else if (typeof article.banner_image === 'object') {
          try {
            const parsed = typeof article.banner_image === 'string' ? JSON.parse(article.banner_image) : article.banner_image;
            bannerUrl = parsed.url || parsed;
          } catch (e) {
            console.log('⚠️ Error parsing banner image:', e);
            bannerUrl = article.banner_image.url || article.banner_image;
          }
        }
        if (bannerUrl) {
          console.log('✅ Using banner image:', bannerUrl);
          return bannerUrl;
        }
      }
      if (article.headshot_image) {
        console.log('✅ Using headshot image:', article.headshot_image);
        return article.headshot_image;
      }
      if (article.image_urls && article.image_urls.length > 0) {
        console.log('✅ Using first gallery image:', article.image_urls[0]);
        return article.image_urls[0];
      }
      if (article.logo_image) {
        console.log('✅ Using logo image:', article.logo_image);
        return article.logo_image;
      }
      console.log('⚠️ Using fallback image');
      return 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
    };

    const shareImage = getShareImage();
    
    // Properly escape all text content for HTML
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };
    
    const safeTitle = escapeHtml(article.product_name || 'America Innovates');
    const safeDescription = escapeHtml(article.description || `Read about ${article.product_name} by ${article.full_name} - an inspiring innovation story from America Innovates Magazine.`);
    const safeAuthor = escapeHtml(article.full_name || 'America Innovates Magazine');
    const safeCategory = escapeHtml(article.category || 'Innovation');
    const pageTitle = escapeHtml(`${article.product_name} | America Innovates Magazine`);
    
    // Generate clean, valid HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${safeDescription}">
    
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${shareImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${request.url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="America Innovates Magazine">
    <meta property="article:author" content="${safeAuthor}">
    <meta property="article:published_time" content="${article.created_at}">
    <meta property="article:section" content="${safeCategory}">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@AmericaInnovates">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${shareImage}">
    <meta name="twitter:image:alt" content="${safeTitle} - Innovation story">
    
    <meta name="author" content="${safeAuthor}">
    <meta name="keywords" content="innovation, ${safeCategory}, ${safeTitle}, entrepreneur, ${safeAuthor}">
    <link rel="canonical" href="${request.url}">
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${safeTitle}",
      "description": "${safeDescription}",
      "image": "${shareImage}",
      "datePublished": "${article.created_at}",
      "author": {
        "@type": "Person",
        "name": "${safeAuthor}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "America Innovates Magazine",
        "logo": {
          "@type": "ImageObject",
          "url": "https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png"
        }
      }
    }
    </script>
    
    <script>
      const userAgent = navigator.userAgent.toLowerCase();
      const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent);
      
      if (!isCrawler) {
        window.location.href = 'https://americainnovates.us/article/${slug}';
      }
    </script>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d; margin-bottom: 16px;">${safeTitle}</h1>
      <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">${safeDescription}</p>
      <p style="color: #718096;">by ${safeAuthor}</p>
      <a href="https://americainnovates.us/article/${slug}" style="color: #3182ce; text-decoration: none;">Read the full article →</a>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-transform, public, max-age=60, s-maxage=300',
        'Content-Encoding': 'identity',
        'X-Edge-Function': 'article-meta',
        'Vary': 'User-Agent',
        'Content-Length': new TextEncoder().encode(html).length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const config = {
  path: "/article/*"
};