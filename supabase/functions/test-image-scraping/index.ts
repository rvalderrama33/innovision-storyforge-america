import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  console.log(`🔍 Starting to scrape: ${url}`);
  try {
    console.log(`📡 Fetching ${url}...`);
    const response = await fetch(url);
    console.log(`📊 Response status: ${response.status} for ${url}`);
    
    if (!response.ok) {
      console.log(`❌ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return { textContent: '', imageUrls: [], title: '', description: '' };
    }
    
    const html = await response.text();
    console.log(`📄 HTML length: ${html.length} characters from ${url}`);

    // Extract ALL images aggressively
    const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const imageUrls: string[] = [];
    let match;
    let totalImgTags = 0;
    let skippedImages = 0;
    
    console.log(`🖼️ Looking for images in HTML...`);
    
    while ((match = imageRegex.exec(html)) !== null) {
      totalImgTags++;
      let imageUrl = match[1];
      console.log(`🔍 Found img tag #${totalImgTags}: ${imageUrl}`);
      
      // Skip only obvious non-product images
      if (imageUrl.startsWith('data:') || 
          imageUrl.includes('favicon') || 
          imageUrl.includes('.svg') ||
          imageUrl.endsWith('.gif') ||
          (imageUrl.includes('logo') && imageUrl.includes('header'))) {
        console.log(`⏭️ Skipping non-product image: ${imageUrl}`);
        skippedImages++;
        continue;
      }
      
      // Convert relative URLs to absolute
      const originalUrl = imageUrl;
      if (imageUrl.startsWith('//')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}${imageUrl}`;
      } else if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (imageUrl.startsWith('./')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl.substring(1)}`;
      } else if (!imageUrl.startsWith('http')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
      }
      
      if (originalUrl !== imageUrl) {
        console.log(`🔗 Converted relative URL: ${originalUrl} → ${imageUrl}`);
      }
      
      // Include ALL images that are likely product-related (be very inclusive)
      if (imageUrl.match(/\.(jpg|jpeg|png|webp)$/i) && imageUrl.length < 1000) {
        console.log(`✅ Adding image: ${imageUrl}`);
        imageUrls.push(imageUrl);
      } else {
        console.log(`❌ Rejected image (no valid extension or too long): ${imageUrl}`);
        skippedImages++;
      }
    }
    
    console.log(`📊 Image extraction summary: ${totalImgTags} total img tags, ${imageUrls.length} accepted, ${skippedImages} skipped`);

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
      imageUrls: [...new Set(imageUrls)], // Remove duplicates
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
    const { url } = await req.json();
    console.log(`🧪 Testing image scraping for: ${url}`);
    
    const result = await fetchWebsiteContent(url);
    
    console.log(`✅ Test complete. Found ${result.imageUrls.length} images`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        url,
        title: result.title,
        description: result.description,
        imageUrls: result.imageUrls,
        imageCount: result.imageUrls.length,
        textLength: result.textContent.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in test-image-scraping function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});