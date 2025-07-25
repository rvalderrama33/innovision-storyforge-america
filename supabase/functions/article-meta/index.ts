import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')
    
    // Extract slug from URL path like /functions/v1/article-meta/article/slug-here
    // pathSegments: ['', 'functions', 'v1', 'article-meta', 'article', 'slug']
    if (pathSegments.length < 6 || pathSegments[4] !== 'article') {
      return new Response('Invalid article URL', { status: 400 })
    }
    
    const slug = pathSegments[5]
    console.log('Processing article request for slug:', slug)
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    // Fetch article data
    const { data: article, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single()
    
    if (error || !article) {
      console.log('Article not found:', error)
      return new Response('Article not found', { status: 404 })
    }
    
    console.log('Found article:', article.product_name)
    
    // Check if request is from a social media crawler
    const userAgent = req.headers.get('user-agent') || ''
    const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|pinterest|slackbot|whatsapp|telegrambot/i.test(userAgent)
    
    console.log('Processing request:')
    console.log('- URL:', req.url)
    console.log('- User agent:', userAgent)
    console.log('- Is crawler:', isCrawler)
    console.log('- Headers:', Object.fromEntries(req.headers.entries()))
    
    if (isCrawler) {
      // Serve HTML with proper meta tags for crawlers
      const articleTitle = `${article.product_name} | America Innovates Magazine`
      const articleDescription = article.description || `Read about ${article.product_name} by ${article.full_name} - an inspiring innovation story from America Innovates Magazine.`
      
      // Use headshot first, then first image from urls, then fallback to logo
      let articleImage = 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png'
      
      if (article.headshot_image) {
        articleImage = article.headshot_image
      } else if (article.image_urls && Array.isArray(article.image_urls) && article.image_urls.length > 0) {
        articleImage = article.image_urls[0]
      }
      
      console.log('Selected article image:', articleImage)
      
      const articleUrl = `https://americainnovates.us/article/${slug}`
      
      // Escape HTML attributes and JSON values
      const escapeHtml = (str: string) => str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
      const escapeJson = (str: string) => JSON.stringify(str).slice(1, -1) // Remove quotes from JSON.stringify
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(articleTitle)}</title>
    <meta name="description" content="${escapeHtml(articleDescription)}">
    
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="${escapeHtml(articleTitle)}">
    <meta property="og:description" content="${escapeHtml(articleDescription)}">
    <meta property="og:image" content="${articleImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="America Innovates Magazine">
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(articleTitle)}">
    <meta name="twitter:description" content="${escapeHtml(articleDescription)}">
    <meta name="twitter:image" content="${articleImage}">
    <meta name="twitter:site" content="@AmericaInnovate">
    
    <!-- LinkedIn specific tags -->
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${escapeHtml(article.product_name)} - ${escapeHtml(article.full_name)}">
    
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
    <p><a href="${articleUrl}">Read the full article</a></p>
</body>
</html>`
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders
        }
      })
    } else {
      // For regular browsers, redirect to the SPA
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://americainnovates.us/article/${slug}`,
          ...corsHeaders
        }
      })
    }
    
  } catch (error) {
    console.error('Error in article-meta function:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders
    })
  }
})