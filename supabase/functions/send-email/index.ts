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

interface EmailCustomizations {
  primaryColor: string;
  accentColor: string;
  companyName: string;
  logoUrl: string;
  footerText: string;
}

// Load email customizations from database
const loadEmailCustomizations = async (): Promise<EmailCustomizations> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const { data: customizations } = await supabase
    .from('email_customizations')
    .select('*')
    .limit(1)
    .single();

  return {
    primaryColor: customizations?.primary_color || '#667eea',
    accentColor: customizations?.accent_color || '#764ba2',
    companyName: customizations?.company_name || 'America Innovates Magazine',
    logoUrl: customizations?.logo_url || '',
    footerText: customizations?.footer_text || 'America Innovates Magazine - Celebrating Innovation and Entrepreneurship'
  };
};

// Common email header template
const getEmailHeader = (customizations: EmailCustomizations, title: string, subtitle?: string) => `
  <div style="text-align: center; margin-bottom: 30px;">
    ${customizations.logoUrl ? 
      `<img src="${customizations.logoUrl}" alt="${customizations.companyName}" style="max-height: 180px; margin-bottom: 15px;" />` : 
      ''
    }
    <h1 style="color: #1a202c; margin-bottom: 10px;">${title}</h1>
    ${subtitle ? `<p style="color: #4a5568; font-size: 18px;">${subtitle}</p>` : ''}
  </div>
`;

// Common email footer template
const getEmailFooter = (customizations: EmailCustomizations, customFooter?: string) => `
  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
    ${customFooter ? `<p>${customFooter}</p>` : ''}
    <p>${customizations.footerText}</p>
  </div>
`;

// Common email wrapper
const wrapEmailContent = (content: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    ${content}
  </div>
`;

// Welcome email template
const createWelcomeEmail = (customizations: EmailCustomizations, name: string) => {
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://americainnovates.com';
  
  return {
    subject: `Welcome to ${customizations.companyName}!`,
    html: wrapEmailContent(`
      ${getEmailHeader(customizations, customizations.companyName, 'Discover the latest breakthrough consumer products from visionary entrepreneurs')}
      
      <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
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
        <a href="${baseUrl}" 
           style="background: ${customizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Explore Stories
        </a>
      </div>
      
      ${getEmailFooter(customizations)}
    `)
  };
};

// Notification email template
const createNotificationEmail = (customizations: EmailCustomizations, name: string, subject: string, message: string) => {
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://americainnovates.com';
  
  return {
    subject: subject || `New Update from ${customizations.companyName}`,
    html: wrapEmailContent(`
      ${getEmailHeader(customizations, customizations.companyName)}
      
      <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="color: white; margin: 0 0 15px 0;">Hello ${name || 'Innovator'}!</h2>
        <div style="color: white; line-height: 1.6;">
          ${message || 'We have an exciting update to share with you!'}
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${baseUrl}" 
           style="background: ${customizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Visit ${customizations.companyName}
        </a>
      </div>
      
      ${getEmailFooter(customizations)}
    `)
  };
};

// Approval email template
const createApprovalEmail = (customizations: EmailCustomizations, name: string, productName: string, slug: string) => {
  const articleUrl = `${Deno.env.get('SUPABASE_URL')?.replace('enckzbxifdrihnfcqagb.supabase.co/rest/v1', 'americainnovates.us') || 'https://americainnovates.com'}/article/${slug}`;
  
  return {
    subject: `🎉 Your Innovation Story "${productName}" Has Been Approved!`,
    html: wrapEmailContent(`
      ${getEmailHeader(customizations, '🎉 Congratulations!', 'Your innovation story has been approved and published!')}
      
      <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; font-size: 24px;">Great news, ${name}!</h2>
        <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
          Your innovation story about <strong>"${productName}"</strong> has been reviewed and approved by our editorial team. It's now live on ${customizations.companyName}!
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
           style="background: ${customizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
          View Your Article
        </a>
      </div>
      
      ${getEmailFooter(customizations)}
    `)
  };
};

// Featured email template
const createFeaturedEmail = (customizations: EmailCustomizations, name: string, productName: string, slug: string) => {
  const articleUrl = `${Deno.env.get('SUPABASE_URL')?.replace('enckzbxifdrihnfcqagb.supabase.co/rest/v1', 'americainnovates.us') || 'https://americainnovates.com'}/article/${slug}`;
  
  return {
    subject: `⭐ Your Story "${productName}" is Now Featured!`,
    html: wrapEmailContent(`
      ${getEmailHeader(customizations, '⭐ You\'re Featured!', 'Your innovation story has been selected as a featured article!')}
      
      <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; font-size: 24px;">Amazing news, ${name}! ⭐</h2>
        <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
          Your innovation story about <strong>"${productName}"</strong> has been selected as a featured article on ${customizations.companyName}! This means it will receive premium placement and increased visibility.
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
           style="background: ${customizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
          View Featured Article
        </a>
      </div>
      
      ${getEmailFooter(customizations)}
    `)
  };
};

// Recommendation email template
const createRecommendationEmail = (customizations: EmailCustomizations, name: string, recommenderName: string) => {
  const submitUrl = `${Deno.env.get('SUPABASE_URL')?.replace('enckzbxifdrihnfcqagb.supabase.co/rest/v1', 'americainnovates.us') || 'https://americainnovates.com'}/submit`;
  
  return {
    subject: 'America Innovates Magazine Interview Recommendation',
    html: wrapEmailContent(`
      ${getEmailHeader(customizations, customizations.companyName, 'Interview Recommendation')}
      
      <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
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
           style="background: ${customizations.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Click here to begin the interview process
        </a>
      </div>
      
      ${getEmailFooter(customizations, 'Thank you,<br/>America Innovates Staff')}
    `)
  };
};

// Main handler
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
    
    const { type, to, name, subject, message, productName, slug, recommenderName }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, to);

    // Load email customizations from database
    const emailCustomizations = await loadEmailCustomizations();

    let emailData: { subject: string; html: string };

    // Generate email content based on type
    switch (type) {
      case 'welcome':
        emailData = createWelcomeEmail(emailCustomizations, name || '');
        break;
      case 'notification':
        emailData = createNotificationEmail(emailCustomizations, name || '', subject || '', message || '');
        break;
      case 'approval':
        emailData = createApprovalEmail(emailCustomizations, name || '', productName || '', slug || '');
        break;
      case 'featured':
        emailData = createFeaturedEmail(emailCustomizations, name || '', productName || '', slug || '');
        break;
      case 'recommendation':
        emailData = createRecommendationEmail(emailCustomizations, name || '', recommenderName || '');
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    console.log("About to send email with Resend...");
    console.log("Email details:", {
      from: "America Innovates Magazine <noreply@americainnovates.us>",
      to: [to],
      subject: emailData.subject
    });

    const emailResponse = await resend.emails.send({
      from: "America Innovates Magazine <noreply@americainnovates.us>",
      to: [to],
      subject: emailData.subject,
      html: emailData.html,
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