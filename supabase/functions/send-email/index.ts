import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

// Initialize Resend with better error handling
const getResendClient = () => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(apiKey);
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'notification' | 'approval' | 'featured' | 'recommendation';
  to: string;
  name?: string;
  subject?: string;
  message?: string;
  productName?: string;
  slug?: string;
  recommenderName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Resend client
    const resend = getResendClient();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { type, to, name, subject, message, productName, slug, recommenderName }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, to);

    // Load email customizations from database
    const { data: customizations } = await supabase
      .from('email_customizations')
      .select('*')
      .limit(1)
      .single();

    // Default customizations
    const emailCustomizations = {
      primaryColor: customizations?.primary_color || '#667eea',
      accentColor: customizations?.accent_color || '#764ba2',
      companyName: customizations?.company_name || 'America Innovates Magazine',
      logoUrl: customizations?.logo_url || '',
      footerText: customizations?.footer_text || 'America Innovates Magazine - Celebrating Innovation and Entrepreneurship'
    };

    let emailContent = '';
    let emailSubject = '';

    if (type === 'welcome') {
      emailSubject = `Welcome to ${emailCustomizations.companyName}!`;
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            ${emailCustomizations.logoUrl ? 
              `<img src="${emailCustomizations.logoUrl}" alt="${emailCustomizations.companyName}" style="max-height: 180px; margin-bottom: 15px;" />` : 
              ''
            }
            <h1 style="color: #1a202c; margin-bottom: 10px;">${emailCustomizations.companyName}</h1>
            <p style="color: #4a5568; font-size: 18px;">Discover the latest breakthrough consumer products from visionary entrepreneurs</p>
          </div>
          
          <div style="background: linear-gradient(135deg, ${emailCustomizations.primaryColor} 0%, ${emailCustomizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
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
               style="background: ${emailCustomizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Explore Stories
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>${emailCustomizations.footerText}</p>
          </div>
        </div>
      `;
    } else if (type === 'notification') {
      emailSubject = subject || `New Update from ${emailCustomizations.companyName}`;
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            ${emailCustomizations.logoUrl ? 
              `<img src="${emailCustomizations.logoUrl}" alt="${emailCustomizations.companyName}" style="max-height: 180px; margin-bottom: 15px;" />` : 
              ''
            }
            <h1 style="color: #1a202c;">${emailCustomizations.companyName}</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, ${emailCustomizations.primaryColor} 0%, ${emailCustomizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="color: white; margin: 0 0 15px 0;">Hello ${name || 'Innovator'}!</h2>
            <div style="color: white; line-height: 1.6;">
              ${message || 'We have an exciting update to share with you!'}
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://americainnovates.com'}" 
               style="background: ${emailCustomizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Visit ${emailCustomizations.companyName}
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>${emailCustomizations.footerText}</p>
          </div>
        </div>
      `;
    } else if (type === 'approval') {
      emailSubject = `🎉 Your Innovation Story "${productName}" Has Been Approved!`;
      const articleUrl = `${Deno.env.get('SUPABASE_URL')?.replace('enckzbxifdrihnfcqagb.supabase.co/rest/v1', 'americainnovates.us') || 'https://americainnovates.com'}/article/${slug}`;
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            ${emailCustomizations.logoUrl ? 
              `<img src="${emailCustomizations.logoUrl}" alt="${emailCustomizations.companyName}" style="max-height: 180px; margin-bottom: 15px;" />` : 
              ''
            }
            <h1 style="color: #1a202c; margin-bottom: 10px;">🎉 Congratulations!</h1>
            <p style="color: #4a5568; font-size: 18px;">Your innovation story has been approved and published!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, ${emailCustomizations.primaryColor} 0%, ${emailCustomizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">Great news, ${name}!</h2>
            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
              Your innovation story about <strong>"${productName}"</strong> has been reviewed and approved by our editorial team. It's now live on ${emailCustomizations.companyName}!
            </p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">What happens next?</h3>
            <ul style="color: #4a5568; line-height: 1.8;">
              <li>📖 Your story is now visible to thousands of readers</li>
              <li>📈 Share it with your network to increase visibility</li>
              <li>🤝 Connect with fellow entrepreneurs who read your story</li>
              <li>⭐ You might be selected for our featured stories section!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${articleUrl}" 
               style="background: ${emailCustomizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
              View Your Article
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>${emailCustomizations.footerText}</p>
          </div>
        </div>
      `;
    } else if (type === 'featured') {
      emailSubject = `⭐ Your Story "${productName}" is Now Featured!`;
      const articleUrl = `${Deno.env.get('SUPABASE_URL')?.replace('enckzbxifdrihnfcqagb.supabase.co/rest/v1', 'americainnovates.us') || 'https://americainnovates.com'}/article/${slug}`;
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            ${emailCustomizations.logoUrl ? 
              `<img src="${emailCustomizations.logoUrl}" alt="${emailCustomizations.companyName}" style="max-height: 180px; margin-bottom: 15px;" />` : 
              ''
            }
            <h1 style="color: #1a202c; margin-bottom: 10px;">⭐ You're Featured!</h1>
            <p style="color: #4a5568; font-size: 18px;">Your innovation story has been selected as a featured article!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, ${emailCustomizations.primaryColor} 0%, ${emailCustomizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">Amazing news, ${name}! ⭐</h2>
            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
              Your innovation story about <strong>"${productName}"</strong> has been selected as a featured article on ${emailCustomizations.companyName}! This means it will receive premium placement and increased visibility.
            </p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">Featured Story Benefits:</h3>
            <ul style="color: #4a5568; line-height: 1.8;">
              <li>🏆 Premium placement on our homepage</li>
              <li>📧 Inclusion in our newsletter to subscribers</li>
              <li>📱 Social media promotion across our channels</li>
              <li>🎯 Increased reach to potential customers and investors</li>
              <li>🏅 Recognition as an exemplary entrepreneurial story</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${articleUrl}" 
               style="background: ${emailCustomizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
              View Featured Article
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>${emailCustomizations.footerText}</p>
          </div>
        </div>
      `;
    } else if (type === 'recommendation') {
      emailSubject = 'America Innovates Magazine Interview Recommendation';
      const submitUrl = `${Deno.env.get('SUPABASE_URL')?.replace('enckzbxifdrihnfcqagb.supabase.co/rest/v1', 'americainnovates.us') || 'https://americainnovates.com'}/submit`;
      emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            ${emailCustomizations.logoUrl ? 
              `<img src="${emailCustomizations.logoUrl}" alt="${emailCustomizations.companyName}" style="max-height: 180px; margin-bottom: 15px;" />` : 
              ''
            }
            <h1 style="color: #1a202c; margin-bottom: 10px;">${emailCustomizations.companyName}</h1>
            <p style="color: #4a5568; font-size: 18px;">Interview Recommendation</p>
          </div>
          
          <div style="background: linear-gradient(135deg, ${emailCustomizations.primaryColor} 0%, ${emailCustomizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; font-size: 24px;">Hello ${name}!</h2>
            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
              ${recommenderName} thought you would be a great fit for our magazine. We're excited to learn more about you and share your story with our readers. There is no cost involved, but we'll of course need some of your time for the interview.
            </p>
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">
              I'm sure our readers would love hearing your story and many would benefit from learning from your experiences.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${submitUrl}" 
               style="background: ${emailCustomizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Click here to begin the interview process
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>Thank you,<br/>America Innovates Staff</p>
            <p style="margin-top: 15px;">${emailCustomizations.footerText}</p>
          </div>
        </div>
      `;
    }

    console.log("About to send email with Resend...");
    console.log("Email details:", {
      from: "America Innovates Magazine <noreply@americainnovates.us>",
      to: [to],
      subject: emailSubject
    });

    const emailResponse = await resend.emails.send({
      from: "America Innovates Magazine <noreply@americainnovates.us>",
      to: [to],
      subject: emailSubject,
      html: emailContent,
    });

    console.log("Resend API response:", emailResponse);
    
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Resend API error: ${emailResponse.error.message || emailResponse.error}`);
    }

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