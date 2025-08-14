import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

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
  type: 'welcome' | 'notification' | 'approval' | 'featured' | 'recommendation' | 'draft_follow_up' | 'featured_story_promotion';
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
    primaryColor: '#000000',
    accentColor: '#333333', 
    companyName: 'America Innovates Marketplace',
    logoUrl: customizations?.logo_url || '',
    footerText: 'America Innovates Marketplace - Celebrating Innovation and Entrepreneurship'
  };
};

const getEmailHeader = (title: string, subtitle?: string, logoUrl?: string) => `
  <div style="text-align: center; margin-bottom: 30px;">
    ${logoUrl ? 
      `<img src="${logoUrl}" alt="America Innovates Marketplace" style="max-height: 180px; margin-bottom: 15px;" />` : 
      ''
    }
    <h1 style="color: #000000; margin-bottom: 10px; font-size: 28px;">${title}</h1>
    ${subtitle ? `<p style="color: #374151; font-size: 18px; margin: 0;">${subtitle}</p>` : ''}
  </div>
`;

const getEmailFooter = (recipientEmail?: string) => {
  const unsubscribeUrl = `https://americainnovates.us/unsubscribe?email=${encodeURIComponent(recipientEmail || '')}`;
  
  return `
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px; margin-top: 40px;">
      <p style="margin: 0 0 10px 0;">America Innovates Marketplace - Celebrating Innovation and Entrepreneurship</p>
      ${recipientEmail ? `<p style="margin: 0;"><a href="${unsubscribeUrl}" style="color: #718096; text-decoration: underline;">Unsubscribe from emails</a></p>` : ''}
    </div>
  `;
};

const wrapEmailContent = (content: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    <style>
      a { color: #000000 !important; text-decoration: underline !important; }
      .button-link { color: white !important; text-decoration: none !important; }
    </style>
    ${content}
  </div>
`;

const createWelcomeEmail = (name: string, email: string) => {
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader('Welcome to America Innovates Marketplace!', 'Discover the latest breakthrough consumer products from visionary entrepreneurs')}
    
    <div style="background: #ffffff; color: #000000; padding: 30px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #000000;">Hello ${name}! 👋</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Welcome to America Innovates Marketplace! We're thrilled to have you join our community of innovators and entrepreneurs.
      </p>
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Start exploring breakthrough products and discover the stories behind America's most innovative entrepreneurs.
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://americainnovates.us" 
         class="button-link"
         style="background: #000000; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        Explore the Marketplace
      </a>
    </div>
    
    ${getEmailFooter(email)}
  `);

  return {
    subject: 'Welcome to America Innovates Marketplace!',
    html: htmlContent,
    text: `Welcome to America Innovates Marketplace!\n\nHello ${name}!\n\nWelcome to America Innovates Marketplace! We're thrilled to have you join our community of innovators and entrepreneurs.\n\nStart exploring breakthrough products and discover the stories behind America's most innovative entrepreneurs.\n\nExplore the Marketplace: https://americainnovates.us\n\nAmerica Innovates Marketplace - Celebrating Innovation and Entrepreneurship\n\nTo unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}`
  };
};

const createNotificationEmail = (name: string, subject: string, message: string, email: string) => {
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader('America Innovates Marketplace')}
    
    <div style="background: #ffffff; color: #000000; padding: 30px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="color: #000000; margin: 0 0 15px 0;">Hello ${name || 'Innovator'}!</h2>
      <div style="color: #374151; line-height: 1.6;">
        ${message || 'We have an exciting update to share with you!'}
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://americainnovates.us" 
         class="button-link"
         style="background: #000000; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        Visit America Innovates Marketplace
      </a>
    </div>
    
    ${getEmailFooter(email)}
  `);

  return {
    subject: subject || 'New Update from America Innovates Marketplace',
    html: htmlContent,
    text: `America Innovates Marketplace\n\nHello ${name || 'Innovator'}!\n\n${message || 'We have an exciting update to share with you!'}\n\nVisit America Innovates Marketplace: https://americainnovates.us\n\nAmerica Innovates Marketplace - Celebrating Innovation and Entrepreneurship\n\nTo unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}`
  };
};

const createApprovalEmail = (name: string, productName: string, slug: string, email: string) => {
  const articleUrl = `https://americainnovates.us/article/${slug}`;
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader('🎉 Congratulations!', 'Your innovation story has been approved and published!')}
    
    <div style="background: #ffffff; color: #000000; padding: 30px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #000000;">Great news, ${name}! 🎉</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Your innovation story about <strong>"${productName}"</strong> has been reviewed and approved by our editorial team. It's now live on America Innovates Magazine!
      </p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #000000; margin-bottom: 15px;">What happens next?</h3>
      <ul style="color: #374151; line-height: 1.8;">
        <li>📖 Your story is now visible to thousands of readers</li>
        <li>📈 Share it with your network to increase visibility</li>
        <li>🤝 Connect with fellow entrepreneurs who read your story</li>
        <li>⭐ You might be selected for our featured stories section!</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${articleUrl}" 
         class="button-link"
         style="background: #000000; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        View Your Published Story
      </a>
    </div>
    
    ${getEmailFooter(email)}
  `);

  return {
    subject: `🎉 Your Innovation Story "${productName}" Has Been Approved!`,
    html: htmlContent,
    text: `🎉 Congratulations!\nYour innovation story has been approved and published!\n\nGreat news, ${name}!\n\nYour innovation story about "${productName}" has been reviewed and approved by our editorial team. It's now live on America Innovates Magazine!\n\nWhat happens next?\n- Your story is now visible to thousands of readers\n- Share it with your network to increase visibility\n- Connect with fellow entrepreneurs who read your story\n- You might be selected for our featured stories section!\n\nView Your Published Story: ${articleUrl}\n\nAmerica Innovates Marketplace - Celebrating Innovation and Entrepreneurship\n\nTo unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}`
  };
};

const createFeaturedEmail = (name: string, productName: string, slug: string, email: string) => {
  const articleUrl = `https://americainnovates.us/article/${slug}`;
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader('⭐ You\'re Featured!', 'Your innovation story has been selected as a featured article!')}
    
    <div style="background: #ffffff; color: #000000; padding: 30px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #000000;">Amazing news, ${name}! ⭐</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Your innovation story about <strong>"${productName}"</strong> has been selected as a featured article on America Innovates Magazine!
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${articleUrl}" 
         class="button-link"
         style="background: #000000; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        View Featured Article
      </a>
    </div>
    
    ${getEmailFooter(email)}
  `);

  return {
    subject: `⭐ Your Story "${productName}" is Now Featured!`,
    html: htmlContent,
    text: `⭐ You're Featured!\nYour innovation story has been selected as a featured article!\n\nAmazing news, ${name}! ⭐\n\nYour innovation story about "${productName}" has been selected as a featured article on America Innovates Magazine!\n\nView Featured Article: ${articleUrl}\n\nAmerica Innovates Marketplace - Celebrating Innovation and Entrepreneurship\n\nTo unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}`
  };
};

const createRecommendationEmail = (name: string, recommenderName: string, email: string) => {
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader('America Innovates Magazine', 'Interview Recommendation')}
    
    <div style="background: #ffffff; color: #000000; padding: 30px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #000000;">Hello ${name}!</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        ${recommenderName} thought you would be a great fit for our magazine. We're excited to learn more about you and share your story with our readers.
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://americainnovates.us/submit" 
         class="button-link"
         style="background: #000000; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        Begin Interview Process
      </a>
    </div>
    
    ${getEmailFooter(email)}
  `);

  return {
    subject: 'America Innovates Magazine Interview Recommendation',
    html: htmlContent,
    text: `America Innovates Magazine\nInterview Recommendation\n\nHello ${name}!\n\n${recommenderName} thought you would be a great fit for our magazine. We're excited to learn more about you and share your story with our readers.\n\nBegin Interview Process: https://americainnovates.us/submit\n\nAmerica Innovates Marketplace - Celebrating Innovation and Entrepreneurship\n\nTo unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}`
  };
};

const createFeaturedStoryPromotionEmail = (name: string, subject: string, message: string, email: string) => {
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader('🌟 Featured Stories', 'Discover breakthrough innovations from America\'s entrepreneurs')}
    
    <div style="background: #ffffff; color: #000000; padding: 30px; border: 2px solid #e5e7eb; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #000000;">Hello ${name || 'Innovator'}! 🌟</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        ${message || 'We\'ve curated some amazing featured stories from innovative entrepreneurs that we think you\'ll love!'}
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://americainnovates.us/stories" 
         class="button-link"
         style="background: #000000; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        Read Featured Stories
      </a>
    </div>
    
    ${getEmailFooter(email)}
  `);

  return {
    subject: subject || '🌟 Featured Innovation Stories You\'ll Love',
    html: htmlContent,
    text: `🌟 Featured Stories\nDiscover breakthrough innovations from America's entrepreneurs\n\nHello ${name || 'Innovator'}! 🌟\n\n${message || 'We\'ve curated some amazing featured stories from innovative entrepreneurs that we think you\'ll love!'}\n\nRead Featured Stories: https://americainnovates.us/stories\n\nAmerica Innovates Marketplace - Celebrating Innovation and Entrepreneurship\n\nTo unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}`
  };
};

const handler = async (req: Request): Promise<Response> => {
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
    const resend = getResendClient();
    const { type, to, name, subject, message, productName, slug, recommenderName }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, to);

    let emailData: { subject: string; html: string; text?: string };
    
    switch (type) {
      case 'welcome':
        emailData = createWelcomeEmail(name || '', to);
        break;
      case 'notification':
        emailData = createNotificationEmail(name || '', subject || '', message || '', to);
        break;
      case 'approval':
        emailData = createApprovalEmail(name || '', productName || '', slug || '', to);
        break;
      case 'featured':
        emailData = createFeaturedEmail(name || '', productName || '', slug || '', to);
        break;
      case 'recommendation':
        emailData = createRecommendationEmail(name || '', recommenderName || '', to);
        break;
      case 'featured_story_promotion':
        emailData = createFeaturedStoryPromotionEmail(name || '', subject || '', message || '', to);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    console.log("About to send email with Resend...");
    console.log("Email details:", {
      from: "America Innovates Marketplace <noreply@americainnovates.us>",
      to: [to],
      subject: emailData.subject
    });

    const emailResponse = await resend.emails.send({
      from: "America Innovates Marketplace <noreply@americainnovates.us>",
      to: [to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      headers: {
        'List-Unsubscribe': `<https://americainnovates.us/unsubscribe?email=${encodeURIComponent(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
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