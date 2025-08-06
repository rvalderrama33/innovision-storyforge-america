import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedContent {
  textContent: string;
  imageUrls: string[];
  videoUrls: string[]; // Add video URLs
  title: string;
  description: string;
  price?: string;
  rating?: number;
  reviewCount?: number;
}

async function fetchWebsiteContentWithFirecrawl(url: string): Promise<ScrapedContent> {
  console.log(`🔥 Starting Firecrawl scrape: ${url}`);
  try {
    if (!firecrawlApiKey) {
      console.log('⚠️ Firecrawl API key not found, falling back to basic scraping');
      return await fetchWebsiteContentBasic(url);
    }
    
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        includeTags: ['img', 'video', 'source', 'picture'],
        onlyMainContent: false,
        includeRawHtml: true,
        waitFor: 5000, // Wait longer for dynamic content
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'screenshot' }
        ],
        extractorOptions: {
          extractImages: true,
          extractVideos: true,
          mode: 'llm-extraction',
          extractionSchema: {
            type: 'object',
            properties: {
              images: {
                type: 'array',
                items: { type: 'string' },
                description: 'All image URLs found on the page'
              },
              videos: {
                type: 'array', 
                items: { type: 'string' },
                description: 'All video URLs found on the page'
              }
            }
          }
        }
      })
    });

    if (!firecrawlResponse.ok) {
      console.log(`❌ Firecrawl API error: ${firecrawlResponse.status}, falling back to basic scraping`);
      return await fetchWebsiteContentBasic(url);
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log(`🔥 Firecrawl response received for ${url}`);
    console.log(`🔥 Firecrawl data keys:`, Object.keys(firecrawlData));
    console.log(`🔥 Firecrawl full response:`, JSON.stringify(firecrawlData, null, 2));
    
    if (!firecrawlData.success) {
      console.log(`❌ Firecrawl failed: ${firecrawlData.error}, falling back to basic scraping`);
      return await fetchWebsiteContentBasic(url);
    }

    const html = firecrawlData.data.html || '';
    const markdown = firecrawlData.data.markdown || '';
    
    console.log(`📄 HTML length: ${html.length}, Markdown length: ${markdown.length}`);
    
    // If we have no HTML content, fall back to basic scraping
    if (!html || html.length < 100) {
      console.log(`⚠️ Firecrawl returned insufficient HTML content, falling back to basic scraping`);
      return await fetchWebsiteContentBasic(url);
    }
    
    // Extract images from Firecrawl data more aggressively
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];
    
    // Check if Firecrawl extracted images directly
    if (firecrawlData.data.images && Array.isArray(firecrawlData.data.images)) {
      console.log(`🔥 Firecrawl provided ${firecrawlData.data.images.length} images directly`);
      imageUrls.push(...firecrawlData.data.images);
    }
    
    // Extract images from HTML with multiple patterns
    const imagePatterns = [
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]+data-src=["']([^"']+)["'][^>]*>/gi, // Lazy loading
      /<source[^>]+src=["']([^"']+)["'][^>]*>/gi,
      /<source[^>]+srcset=["']([^"']+)["'][^>]*>/gi,
      /data-image-src=["']([^"']+)["']/gi, // Amazon specific
      /data-old-hires=["']([^"']+)["']/gi, // Amazon high-res
      /data-a-dynamic-image=["']([^"']+)["']/gi // Amazon dynamic
    ];
    
    let totalImgTags = 0;
    imagePatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        totalImgTags++;
        let imageUrl = match[1];
        
        // Handle srcset (comma-separated URLs with sizes)
        if (imageUrl.includes(',')) {
          // Take the highest resolution image from srcset
          const urls = imageUrl.split(',').map(s => s.trim().split(' ')[0]);
          imageUrl = urls[urls.length - 1] || urls[0];
        }
        
        console.log(`🔍 Pattern ${index + 1} found img #${totalImgTags}: ${imageUrl.substring(0, 100)}...`);
        
        // Skip obvious non-product images
        if (imageUrl.startsWith('data:') || 
            imageUrl.includes('favicon') || 
            imageUrl.includes('spacer.gif') ||
            imageUrl.includes('tracking') ||
            imageUrl.includes('analytics') ||
            (imageUrl.includes('logo') && imageUrl.includes('header'))) {
          console.log(`⏭️ Skipping non-product image: ${imageUrl.substring(0, 50)}...`);
          continue;
        }
        
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('//')) {
          const urlObj = new URL(url);
          imageUrl = `${urlObj.protocol}${imageUrl}`;
        } else if (imageUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          const urlObj = new URL(url);
          imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
        }
        
        // Accept more image formats and be less restrictive
        if ((imageUrl.match(/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i) || 
             imageUrl.includes('images-amazon.com') ||
             imageUrl.includes('ssl-images-amazon.com') ||
             imageUrl.includes('m.media-amazon.com')) && 
            imageUrl.length < 2000) {
          console.log(`✅ Adding image: ${imageUrl.substring(0, 100)}...`);
          imageUrls.push(imageUrl);
        } else {
          console.log(`❌ Rejected image: ${imageUrl.substring(0, 100)}...`);
        }
      }
    });
    
    console.log(`📊 Image extraction summary: ${totalImgTags} total patterns matched, ${imageUrls.length} images accepted`);
    
    // Extract videos with enhanced patterns
    const videoPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi,
      /src=["']([^"']*youtube[^"']*)["']/gi,
      /href=["']([^"']*youtube[^"']*)["']/gi,
      /(?:vimeo\.com\/)(\d+)/gi,
      /src=["']([^"']*vimeo[^"']*)["']/gi,
      /src=["']([^"']*\.(mp4|webm|ogg|mov|avi)(\?[^"']*)?)["']/gi,
      /data-video-url=["']([^"']+)["']/gi, // Common e-commerce pattern
      /video.*src=["']([^"']+)["']/gi
    ];
    
    videoPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let videoUrl = match[1] || match[0];
        if (match[1] && match[1].length === 11 && pattern.toString().includes('youtube')) {
          videoUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        }
        if (match[1] && /^\d+$/.test(match[1]) && pattern.toString().includes('vimeo')) {
          videoUrl = `https://vimeo.com/${match[1]}`;
        }
        if (videoUrl && (videoUrl.includes('youtube') || videoUrl.includes('vimeo') || videoUrl.includes('.mp4') || videoUrl.includes('.webm'))) {
          console.log(`🎬 Found video: ${videoUrl}`);
          videoUrls.push(videoUrl);
        }
      }
    });
    
    console.log(`🎬 Video extraction summary: ${videoUrls.length} videos found`);
    
    // Extract title and description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : firecrawlData.data.title || '';
    
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const description = descMatch ? descMatch[1].trim() : firecrawlData.data.description || '';
    
    console.log(`🔥 Final extraction results: ${imageUrls.length} images, ${videoUrls.length} videos`);
    if (imageUrls.length > 0) {
      console.log(`🖼️ Sample images: ${imageUrls.slice(0, 3).map(img => img.substring(0, 80)).join(', ')}`);
    }
    
    // If no images found with Firecrawl, try basic scraping as fallback
    if (imageUrls.length === 0) {
      console.log(`⚠️ Firecrawl found no images, trying basic scraping fallback`);
      const basicResult = await fetchWebsiteContentBasic(url);
      if (basicResult.imageUrls.length > 0) {
        console.log(`✅ Basic scraping found ${basicResult.imageUrls.length} images`);
        return basicResult;
      }
    }
    
    return {
      textContent: markdown.substring(0, 3000),
      imageUrls: [...new Set(imageUrls)],
      videoUrls: [...new Set(videoUrls)],
      title,
      description
    };
    
  } catch (error) {
    console.error('Firecrawl error, falling back to basic scraping:', error);
    return await fetchWebsiteContentBasic(url);
  }
}

async function fetchWebsiteContentBasic(url: string): Promise<ScrapedContent> {
  console.log(`🔍 Starting basic scrape: ${url}`);
  try {
    // Add headers to mimic a real browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    console.log(`📊 Response status: ${response.status} for ${url}`);
    
    if (!response.ok) {
      console.log(`❌ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return { textContent: '', imageUrls: [], videoUrls: [], title: '', description: '' };
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
      if (imageUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i) && imageUrl.length < 1000) {
        console.log(`✅ Adding image: ${imageUrl}`);
        imageUrls.push(imageUrl);
      } else {
        console.log(`❌ Rejected image (no valid extension or too long): ${imageUrl}`);
        skippedImages++;
      }
    }
    
    console.log(`📊 Image extraction summary: ${totalImgTags} total img tags, ${imageUrls.length} accepted, ${skippedImages} skipped`);
    
    // Also try to extract from CSS background-image properties
    const cssImageRegex = /background-image:\s*url\(['"]?([^'"]+)['"]?\)/gi;
    let cssImages = 0;
    while ((match = cssImageRegex.exec(html)) !== null) {
      let imageUrl = match[1];
      cssImages++;
      console.log(`🎨 Found CSS background image: ${imageUrl}`);
      if (imageUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
        if (imageUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
        }
        console.log(`✅ Adding CSS image: ${imageUrl}`);
        imageUrls.push(imageUrl);
      }
    }
    
    console.log(`🎨 CSS images found: ${cssImages}, added to collection`);
    
    // Extract video URLs - Look for various video patterns
    const videoUrls: string[] = [];
    console.log(`🎬 Looking for videos in HTML...`);
    
    // YouTube embeds and links
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi,
      /src=["']([^"']*youtube[^"']*)["']/gi,
      /href=["']([^"']*youtube[^"']*)["']/gi
    ];
    
    // Vimeo patterns
    const vimeoPatterns = [
      /(?:vimeo\.com\/)(\d+)/gi,
      /src=["']([^"']*vimeo[^"']*)["']/gi
    ];
    
    // Generic video file patterns
    const videoFilePatterns = [
      /src=["']([^"']*\.(mp4|webm|ogg|mov|avi)(\?[^"']*)?)["']/gi,
      /href=["']([^"']*\.(mp4|webm|ogg|mov|avi)(\?[^"']*)?)["']/gi
    ];
    
    // Extract YouTube URLs
    youtubePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let videoUrl = match[1] || match[0];
        if (match[1] && match[1].length === 11) { // YouTube video ID
          videoUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        }
        if (videoUrl.includes('youtube')) {
          console.log(`🎬 Found YouTube video: ${videoUrl}`);
          videoUrls.push(videoUrl);
        }
      }
    });
    
    // Extract Vimeo URLs
    vimeoPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let videoUrl = match[1] || match[0];
        if (match[1] && /^\d+$/.test(match[1])) { // Vimeo video ID
          videoUrl = `https://vimeo.com/${match[1]}`;
        }
        if (videoUrl.includes('vimeo')) {
          console.log(`🎬 Found Vimeo video: ${videoUrl}`);
          videoUrls.push(videoUrl);
        }
      }
    });
    
    // Extract video file URLs
    videoFilePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let videoUrl = match[1];
        // Convert relative URLs to absolute
        if (videoUrl.startsWith('/')) {
          const urlObj = new URL(url);
          videoUrl = `${urlObj.protocol}//${urlObj.host}${videoUrl}`;
        }
        console.log(`🎬 Found video file: ${videoUrl}`);
        videoUrls.push(videoUrl);
      }
    });
    
    console.log(`🎬 Video extraction summary: ${videoUrls.length} videos found`);
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract price information
    let price: string | undefined;
    console.log(`💰 Looking for price information...`);
    
    // Common price patterns
    const pricePatterns = [
      /\$[\d,]+\.?\d*/g, // $19.99, $1,299
      /USD\s*[\d,]+\.?\d*/g, // USD 19.99
      /Price[:\s]*\$?[\d,]+\.?\d*/gi, // Price: $19.99
      /[\d,]+\.?\d*\s*dollars?/gi, // 19.99 dollars
      /\€[\d,]+\.?\d*/g, // €19.99
      /\£[\d,]+\.?\d*/g, // £19.99
      /[\d,]+\.?\d*\s*€/g, // 19.99 €
      /[\d,]+\.?\d*\s*£/g, // 19.99 £
    ];
    
    for (const pattern of pricePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Find the most likely price (usually the first or most prominent one)
        price = matches[0];
        console.log(`💰 Found price: ${price}`);
        break;
      }
    }
    
    // Extract rating and review count
    let rating: number | undefined;
    let reviewCount: number | undefined;
    console.log(`⭐ Looking for rating and review information...`);
    
    // Common rating patterns
    const ratingPatterns = [
      /(\d+\.?\d*)\s*out\s*of\s*(\d+)\s*stars?/gi,
      /(\d+\.?\d*)\s*\/\s*(\d+)\s*stars?/gi,
      /rating[:\s]*(\d+\.?\d*)/gi,
      /(\d+\.?\d*)\s*star[s]?/gi,
      /(\d+\.?\d*)\s*⭐/g,
    ];
    
    for (const pattern of ratingPatterns) {
      const match = pattern.exec(html);
      if (match) {
        const ratingValue = parseFloat(match[1]);
        if (ratingValue >= 0 && ratingValue <= 5) {
          rating = ratingValue;
          console.log(`⭐ Found rating: ${rating}`);
          break;
        }
      }
    }
    
    // Review count patterns
    const reviewPatterns = [
      /(\d+)\s*reviews?/gi,
      /(\d+)\s*customer\s*reviews?/gi,
      /(\d+)\s*ratings?/gi,
      /based\s*on\s*(\d+)\s*reviews?/gi,
    ];
    
    for (const pattern of reviewPatterns) {
      const match = pattern.exec(html);
      if (match) {
        reviewCount = parseInt(match[1]);
        console.log(`📝 Found review count: ${reviewCount}`);
        break;
      }
    }

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
        videoUrls: [...new Set(videoUrls)], // Remove duplicate videos
        title,
        description,
        price,
        rating,
        reviewCount
      };
  } catch (error) {
    console.error('Error fetching website content:', error);
    return {
      textContent: '',
      imageUrls: [],
      videoUrls: [],
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
    const scrapedVideos: string[] = [];
    let scrapedPrice: string | undefined;
    let scrapedRating: number | undefined;
    let scrapedReviewCount: number | undefined;
    console.log('Sales links to process:', salesLinks);
    
    if (salesLinks && salesLinks.length > 0) {
      for (const link of salesLinks.slice(0, 3)) { // Limit to 3 links
        console.log('Processing link:', link);
        const content = await fetchWebsiteContentWithFirecrawl(link);
        console.log('Extracted content from', link, ':', {
          textLength: content.textContent.length,
          imageCount: content.imageUrls.length,
          videoCount: content.videoUrls.length,
          images: content.imageUrls,
          videos: content.videoUrls,
          price: content.price,
          rating: content.rating,
          reviewCount: content.reviewCount
        });
        
        // Capture the first price and rating found
        if (content.price && !scrapedPrice) {
          scrapedPrice = content.price;
        }
        if (content.rating && !scrapedRating) {
          scrapedRating = content.rating;
        }
        if (content.reviewCount && !scrapedReviewCount) {
          scrapedReviewCount = content.reviewCount;
        }
        
        if (content.textContent || content.imageUrls.length > 0 || content.videoUrls.length > 0) {
          websiteContents.push(`Content from ${link}:
Title: ${content.title}
Description: ${content.description}
Text: ${content.textContent}
Price: ${content.price || 'Not found'}
Rating: ${content.rating ? `${content.rating} stars` : 'Not found'}
Reviews: ${content.reviewCount ? `${content.reviewCount} reviews` : 'Not found'}
Images found: ${content.imageUrls.length}
Videos found: ${content.videoUrls.length}`);
          scrapedImages.push(...content.imageUrls);
          scrapedVideos.push(...content.videoUrls);
        }
      }
    } else {
      console.log('No sales links provided');
    }
    
    console.log('Total scraped images:', scrapedImages.length, scrapedImages);
    console.log('Total scraped videos:', scrapedVideos.length, scrapedVideos);

    const prompt = `
You are an expert product copywriter and marketing specialist. Create compelling, detailed product content for an e-commerce marketplace.

IMPORTANT: Do NOT include any external links, website URLs, or references to other websites in your content. Focus solely on the product itself.

Product Information:
- Name: ${productName}
- Category: ${category || 'Not specified'}
- Basic Description: ${basicDescription || 'Not provided'}
- Number of Images: ${images?.length || 0}
- Scraped Images Available: ${scrapedImages.length}

${websiteContents.length > 0 ? `
Website Content Analysis (use this information to enhance the product description, but DO NOT mention or link to the source websites):
${websiteContents.join('\n\n')}

Additional Image URLs found: ${scrapedImages.slice(0, 5).join(', ')}
` : ''}

Please generate:

1. Extract the EXACT product name from the scraped content:
   - Use the product name as it appears on the source website
   - Do NOT change or modify the existing product name
   - If multiple names are found, use the most prominent one from the page title or main heading

2. An enhanced, compelling product description (3-4 paragraphs) that:
   - Incorporates information from the scraped website content WITHOUT mentioning the source
   - Highlights key features and benefits found in the scraped data
   - Uses persuasive language and emotional triggers
   - Addresses potential customer pain points
   - Is SEO-friendly and conversion-optimized
   - References specific product details but NEVER includes external links or website mentions
   - Focuses on why customers should buy THIS product from THIS marketplace

3. 10-15 relevant product tags that:
   - Include the product category and subcategories
   - Cover key features mentioned in scraped content
   - Include search-friendly terms from the analysis
   - Mix broad and specific terms for better discoverability

4. Comprehensive product specifications object with technical details based on:
   - Information extracted from the website content
   - Industry standards for the product category
   - Reasonable inferences from available data

Return your response as a JSON object with this exact structure:
{
  "productName": "Generated Product Name",
  "description": "Enhanced product description here (NO EXTERNAL LINKS)",
  "tags": ["tag1", "tag2", "tag3", ...],
  "specifications": {
    "key1": "value1",
    "key2": "value2",
    ...
  }
}

Make the content professional, engaging, and data-driven based on the scraped information. Use specific details from the website analysis to create authentic, compelling copy, but NEVER include external links, URLs, or website references.
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
      
      // Add the scraped images, videos, price and rating to the response
      const response = {
        success: true, 
        content: {
          ...parsedContent,
          scrapedImages: scrapedImages.slice(0, 8), // Limit to 8 images
          scrapedVideos: scrapedVideos.slice(0, 5), // Limit to 5 videos
          scrapedPrice: scrapedPrice,
          scrapedRating: scrapedRating,
          scrapedReviewCount: scrapedReviewCount
        }
      };
      
      return new Response(
        JSON.stringify(response),
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