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

    // Security audit: Check for potential malicious content
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, generated_article, product_name, full_name, status')
      .eq('status', 'approved')

    if (error) {
      console.error('Error fetching submissions:', error)
      throw error
    }

    const securityIssues = []
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /eval\s*\(/i,
      /document\.write/i,
      /innerHTML/i
    ]

    submissions?.forEach(submission => {
      const content = submission.generated_article || ''
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          securityIssues.push({
            id: submission.id,
            name: submission.full_name,
            product: submission.product_name,
            issue: `Suspicious pattern detected: ${pattern.source}`,
            content: content.substring(0, 200) + '...'
          })
        }
      })
    })

    console.log('Security audit completed:', {
      totalSubmissions: submissions?.length || 0,
      issuesFound: securityIssues.length,
      issues: securityIssues
    })

    return new Response(
      JSON.stringify({
        success: true,
        totalSubmissions: submissions?.length || 0,
        issuesFound: securityIssues.length,
        issues: securityIssues,
        message: securityIssues.length > 0 
          ? 'Security issues detected. Please review flagged content.'
          : 'No security issues detected.'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Security audit error:', error)
    return new Response(
      JSON.stringify({ error: 'Security audit failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})