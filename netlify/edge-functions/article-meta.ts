import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async (request: Request) => {
  const url = new URL(request.url);
  console.log('Edge function triggered for:', url.pathname);
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }
  
  // Extract slug from URL path
  const pathSegments = url.pathname.split('/');
  if (pathSegments.length < 3 || pathSegments[1] !== 'article') {
    console.log('Invalid URL structure:', pathSegments);
    return new Response('Invalid URL', { status: 400 });
  }
  
  const slug = pathSegments[2];
  console.log('Processing slug:', slug);
  
  // Initialize Supabase client
  const supabase = createClient(
    'https://enckzbxifdrihnfcqagb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzcxNzcsImV4cCI6MjA2NjYxMzE3N30.hXQ9Q8XYpRGVksTdslNJJt39zfepbhqWjVKd4MiKsvM'
  );
  
  try {
    // Fetch article data
    const { data: article, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .maybeSingle();
    
    if (error) {
      console.error('Database error:', error);
      return new Response('Database error', { status: 500 });
    }
    
    if (!article) {
      console.log('Article not found for slug:', slug);
      return new Response('Article not found', { status: 404 });
    }
    
    console.log('Found article:', article.product_name);
    
    // Get the best image for sharing
    let shareImage = 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
    
    if (article.headshot_image) {
      shareImage = article.headshot_image;
    } else if (article.image_urls && article.image_urls.length > 0) {
      shareImage = article.image_urls[0];
    }
    
    // Clean text for HTML
    const clean = (text: string) => {
      if (!text) return '';
      return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' ').trim();
    };
    
    const title = clean(article.product_name || 'America Innovates');
    const description = clean(article.description || `Read about ${article.product_name} by ${article.full_name}`);
    const author = clean(article.full_name || 'America Innovates');
    const articleUrl = `https://americainnovates.us/article/${slug}`;
    
    // Build HTML with proper escaping and structure
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} | America Innovates Magazine</title>
    <meta name="description" content="${description}">
    <meta name="author" content="${author}">
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${shareImage}">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="America Innovates Magazine">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${shareImage}">
    
    <link rel="canonical" href="${articleUrl}">
    
    <script>
        // Redirect non-crawlers to the main app
        if (!/bot|crawler|spider|facebook|twitter|linkedin/i.test(navigator.userAgent)) {
            window.location.href = '${articleUrl}';
        }
    </script>
</head>
<body>
    <h1>${title}</h1>
    <p>By ${author}</p>
    <p>${description}</p>
    <a href="${articleUrl}">Read the full article on America Innovates Magazine</a>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response('Error loading article', { status: 500 });
  }
};

export const config = {
  path: "/article/*"
};