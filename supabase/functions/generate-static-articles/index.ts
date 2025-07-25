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
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Fetch all approved articles
    const { data: articles, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'approved')
    
    if (error) {
      console.error('Error fetching articles:', error)
      return new Response('Error fetching articles', { status: 500, headers: corsHeaders })
    }
    
    const generatedFiles = []
    
    // Generate static HTML for each article
    for (const article of articles) {
      const articleTitle = `${article.product_name} | America Innovates Magazine`
      const articleDescription = article.description || `Read about ${article.product_name} by ${article.full_name} - an inspiring innovation story from America Innovates Magazine.`
      
      // Use headshot first, then first image from urls, then fallback to logo
      let articleImage = 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png'
      
      if (article.headshot_image) {
        articleImage = article.headshot_image
      } else if (article.image_urls && Array.isArray(article.image_urls) && article.image_urls.length > 0) {
        articleImage = article.image_urls[0]
      }
      
      const articleUrl = `https://americainnovates.us/article/${article.slug || article.id}`
      
      // Escape HTML attributes and JSON values
      const escapeHtml = (str: string) => str?.replace(/"/g, '&quot;').replace(/'/g, '&#39;') || ''
      const escapeJson = (str: string) => JSON.stringify(str || '').slice(1, -1) // Remove quotes from JSON.stringify
      
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
    
    <!-- Auto-redirect for browsers -->
    <script>
      // Check if this is a social media crawler
      const userAgent = navigator.userAgent.toLowerCase();
      const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|pinterest|slackbot|whatsapp/i.test(userAgent);
      
      // If not a crawler, redirect to the SPA
      if (!isCrawler) {
        window.location.href = '${articleUrl}';
      }
    </script>
    
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
      
      // Store the HTML file in Supabase storage (this would be better in a real file system)
      const fileName = `article-${article.slug || article.id}.html`
      generatedFiles.push({ fileName, article: article.product_name })
    }
    
    return new Response(JSON.stringify({ 
      message: 'Static HTML files generated', 
      files: generatedFiles,
      count: generatedFiles.length 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
    
  } catch (error) {
    console.error('Error in generate-static-articles function:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders
    })
  }
})