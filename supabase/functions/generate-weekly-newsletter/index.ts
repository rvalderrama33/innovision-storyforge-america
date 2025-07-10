import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const requestBody = await req.json();
    const isTest = requestBody?.isTest || false;
    const testEmail = requestBody?.testEmail || null;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting weekly newsletter generation...');

    // Get the latest 5 approved articles
    const { data: articles, error: articlesError } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'approved')
      .not('generated_article', 'is', null)
      .order('approved_at', { ascending: false })
      .limit(5);

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    if (!articles || articles.length === 0) {
      console.log('No articles found for newsletter');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No articles found for newsletter' 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log(`Found ${articles.length} articles for newsletter`);

    // Get current date for newsletter title
    const currentDate = new Date();
    const weekOf = currentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Generate newsletter content
    const newsletterTitle = isTest ? `[TEST] America Innovates Weekly - Week of ${weekOf}` : `America Innovates Weekly - Week of ${weekOf}`;
    const newsletterSubject = isTest ? `[TEST] 🚀 This Week's Innovation Stories - ${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : `🚀 This Week's Innovation Stories - ${currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

    // Create HTML content
    let htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">America Innovates Weekly</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Celebrating Innovation and Entrepreneurship</p>
        </div>

        <!-- Intro -->
        <div style="padding: 30px 20px 20px; background-color: #f8fafc;">
          <h2 style="color: #1a202c; margin: 0 0 15px 0; font-size: 20px;">This Week's Featured Innovation Stories</h2>
          <p style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6;">Discover the latest entrepreneurial journeys and breakthrough innovations from America's most inspiring innovators.</p>
        </div>

        <!-- Articles -->
        <div style="padding: 0 20px 20px; background-color: #f8fafc;">
    `;

    // Add each article
    for (const article of articles) {
      const imageUrl = article.image_urls && article.image_urls.length > 0 ? article.image_urls[0] : '';
      const firstParagraph = extractFirstParagraph(article.generated_article || article.description || '');
      const articleUrl = `https://americainnovates.us/article/${article.slug}`;

      htmlContent += `
        <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          ${imageUrl ? `
            <div style="margin-bottom: 20px;">
              <img src="${imageUrl}" alt="${article.product_name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px;">
            </div>
          ` : ''}
          
          <div style="margin-bottom: 12px;">
            <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              ${article.category || 'Innovation'}
            </span>
          </div>
          
          <h3 style="color: #1a202c; margin: 0 0 15px 0; font-size: 22px; font-weight: bold; line-height: 1.3;">
            ${article.product_name || 'Innovation Story'}
          </h3>
          
          <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            ${firstParagraph}
          </p>
          
          <div style="margin: 20px 0;">
            <a href="${articleUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Continue Reading →
            </a>
          </div>
          
          <div style="padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; margin: 0; font-size: 14px;">
              <strong>Entrepreneur:</strong> ${article.full_name || 'Anonymous'} 
              ${article.city && article.state ? `• <strong>Location:</strong> ${article.city}, ${article.state}` : ''}
            </p>
          </div>
        </div>
      `;
    }

    htmlContent += `
        </div>

        <!-- Footer -->
        <div style="background-color: #2d3748; padding: 30px 20px; text-align: center;">
          <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Share Your Innovation Story</h3>
          <p style="color: #a0aec0; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
            Have an innovation story to tell? We'd love to feature your entrepreneurial journey in our magazine.
          </p>
          <a href="https://americainnovates.us/submit" style="display: inline-block; background: transparent; color: white; border: 2px solid white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-bottom: 20px;">
            Submit Your Story
          </a>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #4a5568;">
            <p style="color: #718096; margin: 0; font-size: 12px;">
              America Innovates Magazine - Celebrating Innovation and Entrepreneurship
            </p>
          </div>
        </div>
      </div>
    `;

    // Create the newsletter in database
    const { data: newsletter, error: createError } = await supabase
      .from('newsletters')
      .insert({
        title: newsletterTitle,
        subject: newsletterSubject,
        content: `Weekly newsletter featuring ${articles.length} innovation stories`,
        html_content: htmlContent,
        status: 'draft',
        created_by: null // System generated
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create newsletter: ${createError.message}`);
    }

    console.log(`Newsletter created with ID: ${newsletter.id}`);

    // Send the newsletter (test mode or full send)
    const sendPayload = isTest && testEmail ? 
      { newsletterId: newsletter.id, testEmail: testEmail } : 
      { newsletterId: newsletter.id };
    
    const sendResponse = await supabase.functions.invoke('send-newsletter', {
      body: sendPayload
    });

    if (sendResponse.error) {
      console.error('Error sending newsletter:', sendResponse.error);
      throw new Error(`Failed to send newsletter: ${sendResponse.error.message}`);
    }

    console.log('Weekly newsletter sent successfully');

    return new Response(JSON.stringify({
      success: true,
      newsletter: newsletter,
      articles: articles.length,
      sendResult: sendResponse.data
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in generate-weekly-newsletter function:", error);
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

// Helper function to extract first paragraph
function extractFirstParagraph(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags and get plain text
  const plainText = text.replace(/<[^>]*>/g, '');
  
  // Split by paragraph breaks and get first meaningful paragraph
  const paragraphs = plainText.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) return '';
  
  let firstParagraph = paragraphs[0].trim();
  
  // If first paragraph is too short, combine with second
  if (firstParagraph.length < 100 && paragraphs.length > 1) {
    firstParagraph += ' ' + paragraphs[1].trim();
  }
  
  // Limit to reasonable length
  if (firstParagraph.length > 300) {
    firstParagraph = firstParagraph.substring(0, 297) + '...';
  }
  
  return firstParagraph;
}

serve(handler);