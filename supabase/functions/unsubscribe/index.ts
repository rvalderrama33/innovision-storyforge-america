import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(getUnsubscribePage('Error: No email provided'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      // Handle unsubscribe confirmation
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        console.error('Unsubscribe error:', error);
        return new Response(getUnsubscribePage('Error: Failed to unsubscribe'), {
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Track unsubscribe event
      const { data: subscriber } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', email)
        .single();

      if (subscriber) {
        await supabase.from('email_analytics').insert({
          newsletter_id: null,
          subscriber_id: subscriber.id,
          event_type: 'unsubscribed',
          user_agent: req.headers.get('User-Agent'),
          ip_address: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For')
        });
      }

      return new Response(getUnsubscribeSuccessPage(), {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Show unsubscribe confirmation page
    return new Response(getUnsubscribeConfirmPage(email), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error: any) {
    console.error("Error in unsubscribe function:", error);
    return new Response(getUnsubscribePage('Internal server error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

function getUnsubscribeConfirmPage(email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Unsubscribe - America Innovates</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8f9fa; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .email { background: #f1f3f4; padding: 10px; border-radius: 4px; font-family: monospace; }
        .buttons { display: flex; gap: 10px; margin-top: 30px; }
        .btn { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; text-align: center; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Unsubscribe from America Innovates</h1>
        <p>We're sorry to see you go! You are about to unsubscribe the following email address from our newsletter:</p>
        <div class="email">${email}</div>
        <p>If you unsubscribe, you'll no longer receive our weekly newsletter with the latest innovation stories and entrepreneur spotlights.</p>
        <div class="buttons">
          <form method="POST" style="display: inline;">
            <button type="submit" class="btn btn-danger">Yes, Unsubscribe Me</button>
          </form>
          <a href="https://americainnovates.us" class="btn btn-secondary">Cancel</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getUnsubscribeSuccessPage(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Unsubscribed - America Innovates</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8f9fa; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #28a745; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .btn { padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
        .btn:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✓ Successfully Unsubscribed</h1>
        <p>You have been successfully unsubscribed from America Innovates newsletter.</p>
        <p>We're sorry to see you go! If you change your mind, you can always subscribe again from our website.</p>
        <a href="https://americainnovates.us" class="btn">Return to Website</a>
      </div>
    </body>
    </html>
  `;
}

function getUnsubscribePage(message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Unsubscribe - America Innovates</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8f9fa; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #dc3545; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .btn { padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
        .btn:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Unsubscribe Error</h1>
        <p>${message}</p>
        <a href="https://americainnovates.us" class="btn">Return to Website</a>
      </div>
    </body>
    </html>
  `;
}

serve(handler);