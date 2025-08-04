import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedContent {
  textContent: string;
  imageUrls: string[];
  title: string;
  description: string;
}

async function fetchWebsiteContent(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract images
    const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const imageUrls: string[] = [];
    let match;
    while ((match = imageRegex.exec(html)) !== null) {
      let imageUrl = match[1];
      // Convert relative URLs to absolute
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (imageUrl.startsWith('./')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl.substring(1)}`;
      }
      
      // Filter for likely product images (exclude tiny icons, logos, etc.)
      if (imageUrl.includes('product') || imageUrl.includes('item') || 
          imageUrl.match(/\.(jpg|jpeg|png|webp)$/i)) {
        imageUrls.push(imageUrl);
      }
    }
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract text content (enhanced)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Remove navigation
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove header
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000); // Increased limit
    
    return {
      textContent,
      imageUrls: imageUrls.slice(0, 10), // Limit to 10 images
      title,
      description
    };
  } catch (error) {
    console.error('Error fetching website content:', error);
    return {
      textContent: '',
      imageUrls: [],
      title: '',
      description: ''
    };
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
    const scrapedImages: string[] = [];
    if (salesLinks && salesLinks.length > 0) {
      for (const link of salesLinks.slice(0, 3)) { // Limit to 3 links
        const content = await fetchWebsiteContent(link);
        if (content.textContent || content.imageUrls.length > 0) {
          websiteContents.push(`Content from ${link}:
Title: ${content.title}
Description: ${content.description}
Text: ${content.textContent}
Images found: ${content.imageUrls.length}`);
          scrapedImages.push(...content.imageUrls);
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
- Scraped Images Available: ${scrapedImages.length}

${websiteContents.length > 0 ? `
Website Content Analysis (use this information to enhance the product description):
${websiteContents.join('\n\n')}

Additional Image URLs found: ${scrapedImages.slice(0, 5).join(', ')}
` : ''}

Please generate:

1. An enhanced, compelling product description (3-4 paragraphs) that:
   - Incorporates information from the scraped website content
   - Highlights key features and benefits found in the scraped data
   - Uses persuasive language and emotional triggers
   - Addresses potential customer pain points
   - Is SEO-friendly and conversion-optimized
   - References specific details from the website analysis when available

2. 10-15 relevant product tags that:
   - Include the product category and subcategories
   - Cover key features mentioned in scraped content
   - Include search-friendly terms from the analysis
   - Mix broad and specific terms for better discoverability

3. Comprehensive product specifications object with technical details based on:
   - Information extracted from the website content
   - Industry standards for the product category
   - Reasonable inferences from available data

4. Suggested image URLs from the scraped content (if any were found)

Return your response as a JSON object with this exact structure:
{
  "description": "Enhanced product description here",
  "tags": ["tag1", "tag2", "tag3", ...],
  "specifications": {
    "key1": "value1",
    "key2": "value2",
    ...
  },
  "suggestedImages": ["url1", "url2", ...]
}

Make the content professional, engaging, and data-driven based on the scraped information. Use specific details from the website analysis to create authentic, compelling copy.
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