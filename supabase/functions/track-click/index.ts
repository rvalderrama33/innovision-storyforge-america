import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const trackingToken = url.searchParams.get('token');

    if (!trackingToken) {
      return new Response('Invalid tracking token', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the original URL and newsletter info
    const { data: linkData, error } = await supabase
      .from('newsletter_links')
      .select('*')
      .eq('tracking_token', trackingToken)
      .single();

    if (error || !linkData) {
      return new Response('Link not found', { status: 404 });
    }

    // Track the click event
    await supabase.from('email_analytics').insert({
      newsletter_id: linkData.newsletter_id,
      subscriber_id: null, // We don't have subscriber context in this simple implementation
      event_type: 'clicked',
      event_data: { clicked_url: linkData.original_url },
      user_agent: req.headers.get('User-Agent'),
      ip_address: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For')
    });

    // Update link click count
    await supabase
      .from('newsletter_links')
      .update({ click_count: linkData.click_count + 1 })
      .eq('id', linkData.id);

    // Update newsletter click count
    await supabase.rpc('increment_newsletter_clicks', { newsletter_id: linkData.newsletter_id });

    console.log(`Tracked click for link: ${linkData.original_url}`);

    // Redirect to original URL
    return Response.redirect(linkData.original_url, 302);

  } catch (error: any) {
    console.error("Error in track-click function:", error);
    return new Response('Internal server error', { status: 500 });
  }
};

serve(handler);