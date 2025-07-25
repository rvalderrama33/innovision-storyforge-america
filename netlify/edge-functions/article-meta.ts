import { Context } from "https://edge.netlify.com/v1/index.ts";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // Extract slug from URL path like /article/slug-here
  const pathSegments = url.pathname.split('/');
  if (pathSegments.length < 3 || pathSegments[1] !== 'article') {
    return new Response('Invalid article URL', { status: 400 });
  }
  
  const slug = pathSegments[2];
  console.log('Processing article request for slug:', slug);
  
  try {
    // Fetch article data from Supabase
    const supabaseUrl = 'https://enckzbxifdrihnfcqagb.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzcxNzcsImV4cCI6MjA2NjYxMzE3N30.hXQ9Q8XYpRGVksTdslNJJt39zfepbhqWjVKd4MiKsvM';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/submissions?slug=eq.${slug}&status=eq.approved&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const articles = await response.json();
    
    if (!articles || articles.length === 0) {
      console.log('Article not found for slug:', slug);
      return new Response('Article not found', { status: 404 });
    }
    
    const article = articles[0];
    console.log('Found article:', article.product_name);
    
    // Check if request is from a social media crawler
    const userAgent = request.headers.get('user-agent') || '';
    const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|pinterest|slackbot|whatsapp|telegrambot|discordbot/i.test(userAgent);
    
    console.log('User agent:', userAgent);
    console.log('Is crawler:', isCrawler);
    
    // If not a crawler, redirect to the React app
    if (!isCrawler) {
      return new Response('', {
        status: 302,
        headers: {
          'Location': `/article/${slug}`
        }
      });
    }
    
    // Generate article metadata for crawlers
    const articleTitle = `${article.product_name} | America Innovates Magazine`;
    const articleDescription = article.description || `Read about ${article.product_name} by ${article.full_name} - an inspiring innovation story from America Innovates Magazine.`;
    
    // Use headshot first, then first image from urls, then fallback to logo
    let articleImage = 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
    
    if (article.headshot_image) {
      articleImage = article.headshot_image;
    } else if (article.image_urls && Array.isArray(article.image_urls) && article.image_urls.length > 0) {
      articleImage = article.image_urls[0];
    }
    
    // Ensure the image URL is absolute
    if (articleImage && !articleImage.startsWith('http')) {
      articleImage = `https://americainnovates.us${articleImage.startsWith('/') ? '' : '/'}${articleImage}`;
    }
    
    const articleUrl = `https://americainnovates.us/article/${slug}`;
    
    // Escape HTML attributes and JSON values
    const escapeHtml = (str: string) => str?.replace(/"/g, '&quot;').replace(/'/g, '&#39;') || '';
    const escapeJson = (str: string) => JSON.stringify(str || '').slice(1, -1);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(articleTitle)}</title>
    <meta name="description" content="${escapeHtml(articleDescription)}">
    
    <!-- Open Graph tags for Facebook, LinkedIn, etc. -->
    <meta property="og:title" content="${escapeHtml(articleTitle)}">
    <meta property="og:description" content="${escapeHtml(articleDescription)}">
    <meta property="og:image" content="${articleImage}">
    <meta property="og:image:secure_url" content="${articleImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${escapeHtml(article.product_name)} by ${escapeHtml(article.full_name)}">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="America Innovates Magazine">
    <meta property="article:author" content="${escapeHtml(article.full_name)}">
    <meta property="article:published_time" content="${article.created_at}">
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@AmericaInnovate">
    <meta name="twitter:creator" content="@AmericaInnovate">
    <meta name="twitter:title" content="${escapeHtml(articleTitle)}">
    <meta name="twitter:description" content="${escapeHtml(articleDescription)}">
    <meta name="twitter:image" content="${articleImage}">
    <meta name="twitter:image:alt" content="${escapeHtml(article.product_name)} by ${escapeHtml(article.full_name)}">
    
    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow">
    <meta name="author" content="${escapeHtml(article.full_name)}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${articleUrl}">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${escapeJson(article.product_name)}",
      "description": "${escapeJson(articleDescription)}",
      "image": "${articleImage}",
      "author": {
        "@type": "Person",
        "name": "${escapeJson(article.full_name)}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "America Innovates Magazine",
        "logo": {
          "@type": "ImageObject",
          "url": "https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png"
        }
      },
      "url": "${articleUrl}",
      "datePublished": "${article.created_at}"
    }
    </script>
</head>
<body>
    <h1>${escapeHtml(article.product_name)}</h1>
    <p>By ${escapeHtml(article.full_name)}</p>
    <p>${escapeHtml(articleDescription)}</p>
    <img src="${articleImage}" alt="${escapeHtml(article.product_name)}" style="max-width: 100%; height: auto;">
    <p><a href="${articleUrl}">Read the full article</a></p>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
    
  } catch (error) {
    console.error('Error in article-meta function:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const config = {
  path: "/article/*"
};