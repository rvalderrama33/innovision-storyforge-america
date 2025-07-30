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
    
    // Create minimal HTML for testing
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${article.product_name}</title>
<meta property="og:title" content="${article.product_name}">
<meta property="og:image" content="${articleImage}">
<meta property="og:url" content="${articleUrl}">
</head>
<body>
<h1>${article.product_name}</h1>
</body>
</html>`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
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