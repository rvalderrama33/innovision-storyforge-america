import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'notification';
  to: string;
  name?: string;
  subject?: string;
  message?: string;
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
    const { type, to, name, subject, message }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, to);

    let emailContent = '';
    let emailSubject = '';

    if (type === 'welcome') {
      emailSubject = "Welcome to America Innovates!";
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a202c; margin-bottom: 10px;">Welcome to America Innovates!</h1>
            <p style="color: #4a5568; font-size: 18px;">Discover the latest breakthrough consumer products from visionary entrepreneurs</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">Hello ${name || 'Innovator'}! 👋</h2>
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">
              Thank you for joining our community of entrepreneurs and innovators. You're now part of a network that celebrates creativity, innovation, and the entrepreneurial spirit.
            </p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">What's Next?</h3>
            <ul style="color: #4a5568; line-height: 1.8;">
              <li>📖 Read inspiring stories of successful entrepreneurs</li>
              <li>💡 Submit your own innovation story</li>
              <li>🤝 Connect with fellow innovators</li>
              <li>🚀 Get featured in our magazine</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://americainnovates.com'}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Explore Stories
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>America Innovates Magazine - Celebrating Innovation and Entrepreneurship</p>
          </div>
        </div>
      `;
    } else if (type === 'notification') {
      emailSubject = subject || "New Update from America Innovates";
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a202c;">America Innovates</h1>
          </div>
          
          <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #1a202c; margin: 0 0 15px 0;">Hello ${name || 'Innovator'}!</h2>
            <div style="color: #4a5568; line-height: 1.6;">
              ${message || 'We have an exciting update to share with you!'}
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://americainnovates.com'}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Visit America Innovates
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>America Innovates Magazine</p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "America Innovates <noreply@resend.dev>", // Change this to your verified domain
      to: [to],
      subject: emailSubject,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-email function:", error);
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