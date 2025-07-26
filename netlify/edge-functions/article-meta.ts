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
    
    // Generate HTML with dynamic meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.product_name} | America Innovates Magazine</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${article.product_name}">
    <meta property="og:description" content="${article.description || 'Discover breakthrough innovations and inspiring stories from America\'s entrepreneurs and creators.'}">
    <meta property="og:image" content="${article.banner_image || article.logo_image || 'https://americainnovates.netlify.app/placeholder.svg'}">
    <meta property="og:url" content="${request.url}">
    <meta property="og:type" content="article">
    <meta property="article:author" content="${article.full_name || 'America Innovates Magazine'}">
    <meta property="article:published_time" content="${article.created_at}">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.product_name}">
    <meta name="twitter:description" content="${article.description || 'Discover breakthrough innovations and inspiring stories from America\'s entrepreneurs and creators.'}">
    <meta name="twitter:image" content="${article.banner_image || article.logo_image || 'https://americainnovates.netlify.app/placeholder.svg'}">
    
    <script>
      // Redirect non-crawlers to the main app
      const userAgent = navigator.userAgent.toLowerCase();
      const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot/i.test(userAgent);
      
      if (!isCrawler) {
        window.location.href = 'https://americainnovates.netlify.app/article/${slug}';
      }
    </script>
</head>
<body>
    <h1>${article.product_name}</h1>
    <p>${article.description || 'This article is available on America Innovates Magazine.'}</p>
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
  path: "/article/*"
};