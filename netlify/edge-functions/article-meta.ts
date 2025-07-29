import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async (request: Request) => {
  console.log('🚀 Article Meta Edge Function triggered!', request.url);
  const url = new URL(request.url);
  console.log('🔍 URL pathname:', url.pathname);
  
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
      // Priority: banner_image > headshot_image > first gallery image > logo_image
      if (article.banner_image) {
        if (typeof article.banner_image === 'string') return article.banner_image;
        if (typeof article.banner_image === 'object' && article.banner_image.url) return article.banner_image.url;
      }
      if (article.headshot_image) return article.headshot_image;
      if (article.image_urls && article.image_urls.length > 0) return article.image_urls[0];
      if (article.logo_image) return article.logo_image;
      return 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
    };

    const shareImage = getShareImage();
    const description = article.description || `Read about ${article.product_name} by ${article.full_name} - an inspiring innovation story from America Innovates Magazine.`;
    const title = `${article.product_name} | America Innovates Magazine`;
    
    // Generate HTML with dynamic meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${article.product_name}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${shareImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${request.url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="America Innovates Magazine">
    <meta property="article:author" content="${article.full_name || 'America Innovates Magazine'}">
    <meta property="article:published_time" content="${article.created_at}">
    <meta property="article:section" content="${article.category || 'Innovation'}">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@AmericaInnovates">
    <meta name="twitter:title" content="${article.product_name}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${shareImage}">
    <meta name="twitter:image:alt" content="${article.product_name} - Innovation story">
    
    <!-- Additional Meta Tags -->
    <meta name="author" content="${article.full_name || 'America Innovates Magazine'}">
    <meta name="keywords" content="innovation, ${article.category || 'startup'}, ${article.product_name}, entrepreneur, ${article.full_name}">
    <link rel="canonical" href="${request.url}">
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${article.product_name}",
      "description": "${description}",
      "image": "${shareImage}",
      "datePublished": "${article.created_at}",
      "author": {
        "@type": "Person",
        "name": "${article.full_name || 'America Innovates Magazine'}"
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
      // Redirect non-crawlers to the main app
      const userAgent = navigator.userAgent.toLowerCase();
      const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent);
      
      if (!isCrawler) {
        window.location.href = 'https://americainnovates.us/article/${slug}';
      }
    </script>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d; margin-bottom: 16px;">${article.product_name}</h1>
      <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">${description}</p>
      <p style="color: #718096;">by ${article.full_name || 'America Innovates Magazine'}</p>
      <a href="https://americainnovates.us/article/${slug}" style="color: #3182ce; text-decoration: none;">Read the full article →</a>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300',
      },
    });
    
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const config = {
  path: "/article/*",
  excludedPath: "/article/_next/*"
};