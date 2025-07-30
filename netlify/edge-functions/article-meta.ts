import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  
  // Extract slug from URL path
  const pathSegments = url.pathname.split('/');
  if (pathSegments.length < 3 || pathSegments[1] !== 'article') {
    return new Response('Invalid URL', { status: 400 });
  }
  
  const slug = pathSegments[2];
  
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
      .single();
    
    if (error || !article) {
      return new Response('Article not found', { status: 404 });
    }
    
    // Get the best image for sharing
    let shareImage = 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
    
    if (article.headshot_image) {
      shareImage = article.headshot_image;
    } else if (article.image_urls && article.image_urls.length > 0) {
      shareImage = article.image_urls[0];
    }
    
    // Simple text escaping
    const clean = (text: string) => {
      if (!text) return '';
      return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
    
    const title = clean(article.product_name || 'America Innovates');
    const description = clean(article.description || `Read about ${article.product_name} by ${article.full_name}`);
    const author = clean(article.full_name || 'America Innovates');
    const articleUrl = `https://americainnovates.us/article/${slug}`;
    
    // Simple, clean HTML following AddToAny best practices
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | America Innovates Magazine</title>
<meta name="description" content="${description}">

<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${shareImage}">
<meta property="og:url" content="${articleUrl}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="America Innovates Magazine">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${shareImage}">

<link rel="canonical" href="${articleUrl}">

<script>
if (!/bot|crawler|spider|facebook|twitter|linkedin/i.test(navigator.userAgent)) {
  window.location.href = '${articleUrl}';
}
</script>
</head>
<body>
<h1>${title}</h1>
<p>By ${author}</p>
<p>${description}</p>
<a href="${articleUrl}">Read the full article</a>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300'
      }
    });
    
  } catch (error) {
    return new Response('Error loading article', { status: 500 });
  }
};

export const config = {
  path: "/article/*"
};