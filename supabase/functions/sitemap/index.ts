import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all approved articles with slugs
    const { data: articles, error } = await supabase
      .from('submissions')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching articles:', error)
      throw error
    }

    const baseUrl = 'https://c87a1b82-b6a6-4aa2-ad6a-ba5512d06ce3.lovableproject.com'
    
    // Static pages
    const staticPages = [
      { url: '', lastmod: new Date().toISOString(), priority: '1.0' },
      { url: '/about', lastmod: new Date().toISOString(), priority: '0.8' },
      { url: '/stories', lastmod: new Date().toISOString(), priority: '0.9' },
    ]

    // Dynamic article pages
    const articlePages = articles?.map(article => ({
      url: `/article/${article.slug}`,
      lastmod: new Date(article.updated_at).toISOString(),
      priority: '0.7'
    })) || []

    const allPages = [...staticPages, ...articlePages]

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})