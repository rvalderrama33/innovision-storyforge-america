import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract text content (basic HTML parsing)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent.substring(0, 2000); // Limit content length
  } catch (error) {
    console.error('Error fetching website content:', error);
    return '';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, basicDescription, category, salesLinks, images } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fetch content from sales links
    const websiteContents = [];
    if (salesLinks && salesLinks.length > 0) {
      for (const link of salesLinks.slice(0, 3)) { // Limit to 3 links
        const content = await fetchWebsiteContent(link);
        if (content) {
          websiteContents.push(`Content from ${link}:\n${content}`);
        }
      }
    }

    const prompt = `
You are an expert product copywriter and marketing specialist. Create compelling, detailed product content for an e-commerce marketplace.

Product Information:
- Name: ${productName}
- Category: ${category || 'Not specified'}
- Basic Description: ${basicDescription || 'Not provided'}
- Number of Images: ${images?.length || 0}

${websiteContents.length > 0 ? `
Website Content Analysis:
${websiteContents.join('\n\n')}
` : ''}

Please generate:

1. An enhanced, compelling product description (2-3 paragraphs) that:
   - Highlights key features and benefits
   - Uses persuasive language
   - Addresses potential customer pain points
   - Includes emotional triggers
   - Is SEO-friendly

2. 8-12 relevant product tags that:
   - Include the product category
   - Cover key features
   - Include search-friendly terms
   - Mix broad and specific terms

3. Product specifications object with relevant technical details based on the category and available information

Return your response as a JSON object with this exact structure:
{
  "description": "Enhanced product description here",
  "tags": ["tag1", "tag2", "tag3", ...],
  "specifications": {
    "key1": "value1",
    "key2": "value2",
    ...
  }
}

Make sure the content is professional, engaging, and tailored to the product category. If specific details aren't available, create reasonable specifications based on the product name and category.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert product copywriter. Always respond with valid JSON only, no additional text or formatting.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    try {
      const parsedContent = JSON.parse(generatedContent);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: parsedContent 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', generatedContent);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse AI response' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in generate-product-content function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});