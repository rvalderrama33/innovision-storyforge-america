import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNewsletterRequest {
  newsletterId: string;
  testEmail?: string; // For testing before sending to all subscribers
  resendToFailed?: boolean; // New option to resend to failed recipients
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    console.log(`Resend API Key exists: ${!!Deno.env.get("RESEND_API_KEY")}`);
    
    const { newsletterId, testEmail, resendToFailed }: SendNewsletterRequest = await req.json();

    console.log(`Processing newsletter send request for newsletter: ${newsletterId}, resendToFailed: ${!!resendToFailed}`);

    // Get newsletter details
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      throw new Error(`Newsletter not found: ${newsletterError?.message}`);
    }

    // Note: We allow resending of sent newsletters for admin purposes
    console.log(`Newsletter status: ${newsletter.status}`);

    // Get subscribers
    let recipients: any[] = [];
    
    if (testEmail) {
      // Test mode - send only to test email
      recipients = [{ email: testEmail, full_name: 'Test User', id: 'test' }];
      console.log(`Sending test newsletter to: ${testEmail}`);
    } else if (resendToFailed) {
      // Resend mode - only send to subscribers who didn't receive it
      const { data: allSubscribers, error: subscribersError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('is_active', true);

      if (subscribersError) {
        throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
      }

      // Get subscribers who already received this newsletter
      const { data: sentAnalytics, error: analyticsError } = await supabase
        .from('email_analytics')
        .select('subscriber_id')
        .eq('newsletter_id', newsletterId)
        .eq('event_type', 'sent');

      if (analyticsError) {
        throw new Error(`Failed to fetch analytics: ${analyticsError.message}`);
      }

      const sentSubscriberIds = new Set(sentAnalytics?.map(a => a.subscriber_id) || []);
      
      // Filter out subscribers who already received the newsletter
      recipients = (allSubscribers || []).filter(subscriber => 
        !sentSubscriberIds.has(subscriber.id)
      );
      
      console.log(`Found ${allSubscribers?.length || 0} total active subscribers`);
      console.log(`${sentAnalytics?.length || 0} already received the newsletter`);
      console.log(`${recipients.length} need to receive the newsletter`);
    } else {
      // Normal mode - get all active subscribers
      const { data: subscribers, error: subscribersError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('is_active', true);

      if (subscribersError) {
        throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
      }

      recipients = subscribers || [];
      console.log(`Found ${recipients.length} active subscribers`);
    }

    if (recipients.length === 0) {
      throw new Error('No recipients found');
    }

    // Generate tracking URLs for links in content
    const trackingBaseUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/track-click`;
    
    // Simple link tracking - wrap URLs in tracking
    let trackedHtmlContent = newsletter.html_content || newsletter.content;
    const linkRegex = /<a\s+href="([^"]+)"([^>]*)>/gi;
    const links: string[] = [];
    
    trackedHtmlContent = trackedHtmlContent.replace(linkRegex, (match, url, attrs) => {
      if (!url.startsWith('http')) return match; // Skip relative URLs
      
      // Create tracking token
      const trackingToken = crypto.randomUUID();
      links.push(url);
      
      // Store tracking link in database
      supabase.from('newsletter_links').insert({
        newsletter_id: newsletterId,
        original_url: url,
        tracking_token: trackingToken
      }).then(() => {
        console.log(`Created tracking link for: ${url}`);
      });
      
      const trackingUrl = `${trackingBaseUrl}?token=${trackingToken}`;
      return `<a href="${trackingUrl}"${attrs}>`;
    });

    // Add tracking pixel for open tracking
    const trackingPixelUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/track-open`;
    const trackingPixel = `<img src="${trackingPixelUrl}?newsletter_id=${newsletterId}&subscriber_id={{subscriber_id}}" width="1" height="1" style="display:none;" />`;
    
    // Add unsubscribe link
    const unsubscribeUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/unsubscribe`;
    const unsubscribeFooter = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>You received this email because you subscribed to America Innovates Magazine.</p>
        <p><a href="${unsubscribeUrl}?email={{subscriber_email}}" style="color: #666;">Unsubscribe</a> | <a href="https://americainnovates.us" style="color: #666;">Visit our website</a></p>
      </div>
    `;

    // Generate plain text version of newsletter
    const generateTextVersion = (htmlContent: string) => {
      // Simple HTML to text conversion
      return htmlContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
    };

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Send emails in batches to avoid rate limiting
    const batchSize = 3; // Very small batches to avoid rate limits
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (subscriber) => {
        try {
          // Create personalized tracking pixel and unsubscribe footer
          const personalizedTrackingPixel = trackingPixel
            .replace(/{{subscriber_id}}/g, subscriber.id)
            .replace(/{{subscriber_email}}/g, subscriber.email);
            
          const personalizedUnsubscribeFooter = unsubscribeFooter
            .replace(/{{subscriber_email}}/g, subscriber.email);
          
          // Personalize content
          let personalizedContent = trackedHtmlContent
            .replace(/{{subscriber_id}}/g, subscriber.id)
            .replace(/{{subscriber_email}}/g, subscriber.email)
            .replace(/{{subscriber_name}}/g, subscriber.full_name || 'Valued Reader');

          personalizedContent += personalizedTrackingPixel + personalizedUnsubscribeFooter;

          // Generate plain text version
          const textContent = generateTextVersion(personalizedContent) + `\n\n---\nTo unsubscribe: ${unsubscribeUrl}?email=${encodeURIComponent(subscriber.email)}`;

          console.log(`Attempting to send email to: ${subscriber.email}`);
          
          const emailResponse = await resend.emails.send({
            from: "America Innovates <admin@americainnovates.us>",
            to: [subscriber.email],
            subject: newsletter.subject,
            html: personalizedContent,
            text: textContent,
            headers: {
              'List-Unsubscribe': `<${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/unsubscribe?email=${encodeURIComponent(subscriber.email)}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          });
          
          console.log(`Email response for ${subscriber.email}:`, emailResponse);

          if (emailResponse.error) {
            console.error(`Resend API error for ${subscriber.email}:`, emailResponse.error);
            throw new Error(`Resend API error: ${emailResponse.error.message}`);
          }

          // Track sent event
          await supabase.from('email_analytics').insert({
            newsletter_id: newsletterId,
            subscriber_id: subscriber.id,
            event_type: 'sent'
          });

          successCount++;
          console.log(`Email sent successfully to: ${subscriber.email}`);
        } catch (error: any) {
          errorCount++;
          errors.push(`${subscriber.email}: ${error.message}`);
          console.error(`Failed to send email to ${subscriber.email}:`, error);
          console.error(`Full error details:`, error);
        }
      }));

      // Longer delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        console.log(`Waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      }
    }

    // Update newsletter status if not a test
    if (!testEmail) {
      await supabase
        .from('newsletters')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: successCount
        })
        .eq('id', newsletterId);
    }

    const response = {
      success: true,
      newsletterId,
      totalRecipients: recipients.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Limit error details
      isTest: !!testEmail
    };

    console.log('Newsletter send completed:', response);
    console.log('Detailed errors:', errors);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-newsletter function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);