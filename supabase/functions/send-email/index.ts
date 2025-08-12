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
  type: 'welcome' | 'notification' | 'approval' | 'featured' | 'recommendation' | 'draft_follow_up';
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
    primaryColor: customizations?.primary_color || '#3b82f6',
    accentColor: customizations?.accent_color || '#10b981',
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
    <h1 style="color: #1f2937; margin-bottom: 10px;">${title}</h1>
    ${subtitle ? `<p style="color: #374151; font-size: 18px;">${subtitle}</p>` : ''}
  </div>
`;

// Common email footer template
const getEmailFooter = (customizations: EmailCustomizations, customFooter?: string, recipientEmail?: string) => {
  const unsubscribeUrl = `https://americainnovates.us/unsubscribe?email=${encodeURIComponent(recipientEmail || '')}`;
  
  return `
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
      ${customFooter ? `<p>${customFooter}</p>` : ''}
      <p>${customizations.footerText}</p>
      ${recipientEmail ? `<p style="margin-top: 15px;"><a href="${unsubscribeUrl}" style="color: #718096; text-decoration: underline;">Unsubscribe from emails</a></p>` : ''}
    </div>
  `;
};

// Common email wrapper
const wrapEmailContent = (content: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
    <style>
      a { color: #000000 !important; text-decoration: underline !important; }
      .button-link { color: white !important; text-decoration: none !important; }
    </style>
    ${content}
  </div>
`;

// Welcome email template
const createWelcomeEmail = (customizations: EmailCustomizations, name: string, email: string) => {
  const baseUrl = 'https://americainnovates.us';
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader(customizations, customizations.companyName, 'Discover the latest breakthrough consumer products from visionary entrepreneurs')}
    
    <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: #1f2937; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #1f2937;">Hello ${name || 'Innovator'}! 👋</h2>
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Thank you for joining our community of entrepreneurs and innovators. You're now part of a network that celebrates creativity, innovation, and the entrepreneurial spirit.
      </p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">What's Next?</h3>
      <ul style="color: #374151; line-height: 1.8;">
        <li>📖 Read inspiring stories of successful entrepreneurs</li>
        <li>💡 Submit your own innovation story</li>
        <li>🤝 Connect with fellow innovators</li>
        <li>🚀 Get featured in our magazine</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${baseUrl}" 
         class="button-link"
         style="background: ${customizations.primaryColor}; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        Explore Stories
      </a>
    </div>
    
    ${getEmailFooter(customizations, undefined, email)}
  `);

  const textContent = `
Welcome to ${customizations.companyName}!

Hello ${name || 'Innovator'}!

Thank you for joining our community of entrepreneurs and innovators. You're now part of a network that celebrates creativity, innovation, and the entrepreneurial spirit.

What's Next?
- Read inspiring stories of successful entrepreneurs
- Submit your own innovation story
- Connect with fellow innovators
- Get featured in our magazine

Explore Stories: ${baseUrl}

${customizations.footerText}

To unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();
  
  return {
    subject: `Welcome to ${customizations.companyName}!`,
    html: htmlContent,
    text: textContent
  };
};

// Draft follow-up email template
const createDraftFollowUpEmail = (customizations: EmailCustomizations, name: string, productName: string, email: string) => {
  const submitUrl = 'https://americainnovates.us/submit';
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader(customizations, 'We\'re Here to Help!', 'Complete your innovation story submission')}
    
    <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: #1f2937; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #1f2937;">Hello ${name || 'Innovator'}! 👋</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        We noticed you started submitting your innovation story${productName ? ` about "${productName}"` : ''} but haven't completed it yet. We understand that sharing your entrepreneurial journey can sometimes feel overwhelming.
      </p>
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
        <strong>Are you experiencing any difficulties or have questions?</strong> Our team is here to help make the process as smooth as possible.
      </p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">We're here to help with:</h3>
      <ul style="color: #374151; line-height: 1.8;">
        <li>📝 Questions about what information to include</li>
        <li>📸 Help with image uploads or formatting</li>
        <li>💭 Guidance on telling your story effectively</li>
        <li>🤔 Technical issues with the submission form</li>
        <li>⏰ Need more time? We can extend your draft</li>
      </ul>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">
        <strong>Need assistance?</strong> Simply reply to this email or contact our friendly staff at:
      </p>
      <p style="margin: 0; color: #2563eb; font-size: 16px; font-weight: 600;">
        📧 admin@americainnovates.us
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${submitUrl}" 
         class="button-link"
         style="background: ${customizations.primaryColor}; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
        Continue Your Submission
      </a>
    </div>
    
    ${getEmailFooter(customizations, 'We believe your story matters and look forward to sharing it with our community.<br/><br/>Warm regards,<br/>America Innovates Magazine Staff', email)}
  `);

  const textContent = `
We're Here to Help!
Complete your innovation story submission

Hello ${name || 'Innovator'}!

We noticed you started submitting your innovation story${productName ? ` about "${productName}"` : ''} but haven't completed it yet. We understand that sharing your entrepreneurial journey can sometimes feel overwhelming.

Are you experiencing any difficulties or have questions? Our team is here to help make the process as smooth as possible.

We're here to help with:
- Questions about what information to include
- Help with image uploads or formatting
- Guidance on telling your story effectively
- Technical issues with the submission form
- Need more time? We can extend your draft

Need assistance? Simply reply to this email or contact our friendly staff at:
admin@americainnovates.us

Continue Your Submission: ${submitUrl}

We believe your story matters and look forward to sharing it with our community.

Warm regards,
America Innovates Magazine Staff

${customizations.footerText}

To unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();
  
  return {
    subject: 'Need help completing your story submission?',
    html: htmlContent,
    text: textContent
  };
};

// Notification email template
const createNotificationEmail = (customizations: EmailCustomizations, name: string, subject: string, message: string, email: string) => {
  const baseUrl = 'https://americainnovates.us';
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader(customizations, customizations.companyName)}
    
    <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: #1f2937; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="color: #1f2937; margin: 0 0 15px 0;">Hello ${name || 'Innovator'}!</h2>
      <div style="color: #374151; line-height: 1.6;">
        ${message || 'We have an exciting update to share with you!'}
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${baseUrl}" 
         class="button-link"
         style="background: ${customizations.primaryColor}; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        Visit ${customizations.companyName}
      </a>
    </div>
    
    ${getEmailFooter(customizations, undefined, email)}
  `);

  const textContent = `
${customizations.companyName}

Hello ${name || 'Innovator'}!

${message || 'We have an exciting update to share with you!'}

Visit ${customizations.companyName}: ${baseUrl}

${customizations.footerText}

To unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();
  
  return {
    subject: subject || `New Update from ${customizations.companyName}`,
    html: htmlContent,
    text: textContent
  };
};

// Approval email template with featured upgrade option
const createApprovalEmail = (customizations: EmailCustomizations, name: string, productName: string, slug: string, email: string) => {
  const articleUrl = `https://americainnovates.us/article/${slug}`;
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader(customizations, '🎉 Congratulations!', 'Your innovation story has been approved and published!')}
    
    <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: #1f2937; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #1f2937;">Great news, ${name}!</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Your innovation story about <strong>"${productName}"</strong> has been reviewed and approved by our editorial team. It's now live on ${customizations.companyName}!
      </p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">What happens next?</h3>
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
         style="background: ${customizations.primaryColor}; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
        View Your Published Story
      </a>
    </div>
    
    <!-- Share Your Story Section -->
    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 20px; text-align: center;">📢 Help Us Spread Your Innovation Story!</h3>
      <p style="color: #166534; margin: 0 0 20px 0; text-align: center; font-size: 16px; font-weight: 600;">
        🎉 We're SO excited about your story and we know others will be too! 
      </p>
      <p style="color: #374151; margin: 0 0 20px 0; text-align: center; font-size: 15px; line-height: 1.6;">
        <strong>Please share your published article with ALL your friends, family, colleagues, and social media networks!</strong> 
        Your entrepreneurial journey deserves to be celebrated and can inspire countless others to pursue their own innovations.
      </p>
      <div style="text-align: center; margin-bottom: 15px;">
        <p style="color: #374151; margin: 0; font-size: 14px;">
          📱 Post on Facebook, LinkedIn, Twitter, Instagram<br/>
          📧 Email to your network • 💬 Share in your groups<br/>
          🗣️ Tell everyone about your feature!
        </p>
      </div>
      <p style="color: #059669; margin: 0; text-align: center; font-size: 14px; font-weight: 600;">
        The more people who read your story, the greater impact you'll have! 🚀
      </p>
    </div>
    
    ${getEmailFooter(customizations, undefined, email)}
  `);

  const textContent = `
🎉 Congratulations!
Your innovation story has been approved and published!

Great news, ${name}!

Your innovation story about "${productName}" has been reviewed and approved by our editorial team. It's now live on ${customizations.companyName}!

What happens next?
- Your story is now visible to thousands of readers
- Share it with your network to increase visibility
- Connect with fellow entrepreneurs who read your story
- You might be selected for our featured stories section!

View Your Published Story: ${articleUrl}

📢 Help Us Spread Your Innovation Story!

🎉 We're SO excited about your story and we know others will be too!

Please share your published article with ALL your friends, family, colleagues, and social media networks! Your entrepreneurial journey deserves to be celebrated and can inspire countless others to pursue their own innovations.

- Post on Facebook, LinkedIn, Twitter, Instagram
- Email to your network • Share in your groups
- Tell everyone about your feature!

The more people who read your story, the greater impact you'll have! 🚀

${customizations.footerText}

To unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();
  
  return {
    subject: `🎉 Your Innovation Story "${productName}" Has Been Approved!`,
    html: htmlContent,
    text: textContent
  };
};

// Featured email template
const createFeaturedEmail = (customizations: EmailCustomizations, name: string, productName: string, slug: string, email: string) => {
  const articleUrl = `https://americainnovates.us/article/${slug}`;
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader(customizations, '⭐ You\'re Featured!', 'Your innovation story has been selected as a featured article!')}
    
    <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: #1f2937; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #1f2937;">Amazing news, ${name}! ⭐</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        Your innovation story about <strong>"${productName}"</strong> has been selected as a featured article on ${customizations.companyName}! This means it will receive premium placement and increased visibility.
      </p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">Featured Story Benefits:</h3>
      <ul style="color: #374151; line-height: 1.8;">
        <li>🏆 Premium placement on our homepage</li>
        <li>📧 Inclusion in our newsletter to subscribers</li>
        <li>📱 Social media promotion across our channels</li>
        <li>🎯 Increased reach to potential customers and investors</li>
        <li>🏅 Recognition as an exemplary entrepreneurial story</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${articleUrl}" 
         class="button-link"
         style="background: ${customizations.primaryColor}; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
        View Featured Article
      </a>
    </div>
    
    ${getEmailFooter(customizations, undefined, email)}
  `);

  const textContent = `
⭐ You're Featured!
Your innovation story has been selected as a featured article!

Amazing news, ${name}! ⭐

Your innovation story about "${productName}" has been selected as a featured article on ${customizations.companyName}! This means it will receive premium placement and increased visibility.

Featured Story Benefits:
- Premium placement on our homepage
- Inclusion in our newsletter to subscribers
- Social media promotion across our channels
- Increased reach to potential customers and investors
- Recognition as an exemplary entrepreneurial story

View Featured Article: ${articleUrl}

${customizations.footerText}

To unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();
  
  return {
    subject: `⭐ Your Story "${productName}" is Now Featured!`,
    html: htmlContent,
    text: textContent
  };
};

// Recommendation email template
const createRecommendationEmail = (customizations: EmailCustomizations, name: string, recommenderName: string, email: string) => {
  const submitUrl = 'https://americainnovates.us/submit';
  
  const htmlContent = wrapEmailContent(`
    ${getEmailHeader(customizations, customizations.companyName, 'Interview Recommendation')}
    
    <div style="background: linear-gradient(135deg, ${customizations.primaryColor} 0%, ${customizations.accentColor} 100%); color: #1f2937; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #1f2937;">Hello ${name}!</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #374151;">
        ${recommenderName} thought you would be a great fit for our magazine. We're excited to learn more about you and share your story with our readers. There is no cost involved, but we'll of course need some of your time for the interview.
      </p>
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
        I'm sure our readers would love hearing your story and many would benefit from learning from your experiences.
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${submitUrl}" 
         class="button-link"
         style="background: ${customizations.primaryColor}; color: #ffffff !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block;">
        Click here to begin the interview process
      </a>
    </div>
    
    ${getEmailFooter(customizations, 'Thank you,<br/>America Innovates Staff', email)}
  `);

  const textContent = `
${customizations.companyName}
Interview Recommendation

Hello ${name}!

${recommenderName} thought you would be a great fit for our magazine. We're excited to learn more about you and share your story with our readers. There is no cost involved, but we'll of course need some of your time for the interview.

I'm sure our readers would love hearing your story and many would benefit from learning from your experiences.

Click here to begin the interview process: ${submitUrl}

Thank you,
America Innovates Staff

${customizations.footerText}

To unsubscribe from emails, visit: https://americainnovates.us/unsubscribe?email=${encodeURIComponent(email)}
  `.trim();
  
  return {
    subject: 'America Innovates Magazine Interview Recommendation',
    html: htmlContent,
    text: textContent
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

    // Generate email content based on type
    let emailData: { subject: string; html: string; text?: string };
    switch (type) {
      case 'welcome':
        emailData = createWelcomeEmail(emailCustomizations, name || '', to);
        break;
      case 'notification':
        emailData = createNotificationEmail(emailCustomizations, name || '', subject || '', message || '', to);
        break;
      case 'approval':
        emailData = createApprovalEmail(emailCustomizations, name || '', productName || '', slug || '', to);
        break;
      case 'featured':
        emailData = createFeaturedEmail(emailCustomizations, name || '', productName || '', slug || '', to);
        break;
      case 'recommendation':
        emailData = createRecommendationEmail(emailCustomizations, name || '', recommenderName || '', to);
        break;
      case 'draft_follow_up':
        emailData = createDraftFollowUpEmail(emailCustomizations, name || '', productName || '', to);
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
