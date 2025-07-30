const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('=== FUNCTION CALLED ===');
  console.log('Path:', event.path);
  console.log('Method:', event.httpMethod);
  console.log('User Agent:', event.headers['user-agent']);
  console.log('========================');
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Extract slug from path
    const pathSegments = event.path.split('/');
    const slug = pathSegments[pathSegments.length - 1];
    
    if (!slug) {
      return {
        statusCode: 400,
        body: 'Missing article slug'
      };
    }

    console.log('Processing article request for slug:', slug);
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://enckzbxifdrihnfcqagb.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzcxNzcsImV4cCI6MjA2NjYxMzE3N30.hXQ9Q8XYpRGVksTdslNJJt39zfepbhqWjVKd4MiKsvM';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch article data
    const { data: article, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .maybeSingle();
    
    if (error || !article) {
      console.log('Article not found:', error);
      return {
        statusCode: 404,
        body: 'Article not found'
      };
    }
    
    console.log('Found article:', article.product_name);
    
    // Check if request is from a social media crawler
    const userAgent = event.headers['user-agent'] || '';
    const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|pinterest|slackbot|whatsapp|telegrambot|discordbot/i.test(userAgent);
    
    console.log('Processing request:')
    console.log('- URL:', event.path)
    console.log('- User agent:', userAgent)
    console.log('- Is crawler:', isCrawler)
    console.log('- Headers:', JSON.stringify(event.headers))
    
    // Always serve meta HTML for better social sharing
    const articleTitle = `${article.product_name} | America Innovates Magazine`;
    const articleDescription = article.description || `Read about ${article.product_name} by ${article.full_name} - an inspiring innovation story from America Innovates Magazine.`;
    
    // Use headshot first, then first image from urls, then fallback to logo
    let articleImage = 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
    
    if (article.headshot_image) {
      articleImage = article.headshot_image;
      console.log('Using headshot image:', articleImage);
    } else if (article.image_urls && Array.isArray(article.image_urls) && article.image_urls.length > 0) {
      articleImage = article.image_urls[0];
      console.log('Using first gallery image:', articleImage);
    } else {
      console.log('Using fallback logo image:', articleImage);
    }
    
    // Ensure the image URL is absolute
    if (articleImage && !articleImage.startsWith('http')) {
      articleImage = `https://americainnovates.us${articleImage.startsWith('/') ? '' : '/'}${articleImage}`;
    }
    
    const articleUrl = `https://americainnovates.us/article/${slug}`;
    
    // Escape HTML attributes and JSON values
    const escapeHtml = (str) => str?.replace(/"/g, '&quot;').replace(/'/g, '&#39;') || '';
    const escapeJson = (str) => JSON.stringify(str || '').slice(1, -1);
    
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
    
    <!-- Additional meta tags for better sharing -->
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
    
    <!-- Auto-redirect for browsers (not crawlers) -->
    <script>
      // Only redirect if not a crawler
      if (!/facebookexternalhit|twitterbot|linkedinbot|pinterest|slackbot|whatsapp|telegrambot|discordbot/i.test(navigator.userAgent)) {
        window.location.href = '${articleUrl}';
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
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*'
      },
      body: html
    };
    
  } catch (error) {
    console.error('Error in article-meta function:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: 'Internal server error'
    };
  }
};