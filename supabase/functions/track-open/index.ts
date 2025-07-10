import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const newsletterId = url.searchParams.get('newsletter_id');
    const subscriberId = url.searchParams.get('subscriber_id');

    if (!newsletterId || !subscriberId) {
      console.log('Missing parameters for tracking open');
      return new Response(null, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if already tracked to avoid duplicates
    const { data: existing } = await supabase
      .from('email_analytics')
      .select('id')
      .eq('newsletter_id', newsletterId)
      .eq('subscriber_id', subscriberId)
      .eq('event_type', 'opened')
      .single();

    if (!existing) {
      // Track the open event
      await supabase.from('email_analytics').insert({
        newsletter_id: newsletterId,
        subscriber_id: subscriberId,
        event_type: 'opened',
        user_agent: req.headers.get('User-Agent'),
        ip_address: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For')
      });

      // Update newsletter open count
      await supabase.rpc('increment_newsletter_opens', { newsletter_id: newsletterId });
      
      console.log(`Tracked email open for newsletter: ${newsletterId}, subscriber: ${subscriberId}`);
    }

    // Return 1x1 transparent pixel
    const pixel = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
      0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B
    ]);

    return new Response(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error("Error in track-open function:", error);
    return new Response(null, { status: 500 });
  }
};

serve(handler);