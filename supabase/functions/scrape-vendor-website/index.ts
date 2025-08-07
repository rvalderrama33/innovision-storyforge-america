import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.29.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Scraping vendor website:', url);
    
    const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    // Scrape the website
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['markdown'],
      includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'span', 'div'],
      excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside'],
      onlyMainContent: true
    });

    if (!scrapeResult.success) {
      throw new Error(scrapeResult.error || 'Failed to scrape website');
    }

    console.log('Website scraped successfully');

    // Extract vendor information using pattern matching
    const content = scrapeResult.data?.markdown || '';
    const metadata = scrapeResult.data?.metadata || {};
    
    // Extract business information
    const vendorInfo = extractVendorInfo(content, metadata, url);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        vendorInfo,
        rawContent: content.substring(0, 1000) // First 1000 chars for reference
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error scraping vendor website:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape website', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function extractVendorInfo(content: string, metadata: any, url: string) {
  const vendorInfo: any = {};
  
  // Extract business name from title or content
  const businessName = extractBusinessName(content, metadata);
  if (businessName) {
    vendorInfo.businessName = businessName;
  }
  
  // Extract contact email
  const email = extractEmail(content);
  if (email) {
    vendorInfo.contactEmail = email;
  }
  
  // Extract phone number
  const phone = extractPhone(content);
  if (phone) {
    vendorInfo.contactPhone = phone;
  }
  
  // Extract business description/bio
  const bio = extractBusinessBio(content);
  if (bio) {
    vendorInfo.vendorBio = bio;
  }
  
  // Extract country/location
  const country = extractCountry(content);
  if (country) {
    vendorInfo.shippingCountry = country;
  }
  
  return vendorInfo;
}

function extractBusinessName(content: string, metadata: any): string | null {
  // Try metadata title first
  if (metadata.title && metadata.title.length > 0 && metadata.title.length < 100) {
    let title = metadata.title.trim();
    // Remove common suffixes
    title = title.replace(/\s*[\-\|]\s*(Home|Welcome|Official Site|Website).*$/i, '');
    if (title.length > 2) {
      return title;
    }
  }
  
  // Look for company name patterns in content
  const companyPatterns = [
    /(?:company|business|corp|corporation|inc|llc|ltd)[\s\:]+([^\n\r]{2,50})/i,
    /(?:about|welcome to|founded)\s+([A-Z][^\n\r]{2,50})/i,
    /^([A-Z][A-Za-z\s&]{2,50})(?:\s+is|was|\-|:)/m
  ];
  
  for (const pattern of companyPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractEmail(content: string): string | null {
  // Look for email patterns
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = content.match(emailPattern);
  
  if (emails && emails.length > 0) {
    // Filter out common generic emails
    const filteredEmails = emails.filter(email => 
      !email.includes('noreply') && 
      !email.includes('no-reply') &&
      !email.includes('example.com') &&
      !email.includes('test.com')
    );
    
    // Prefer contact, info, hello, support emails
    const preferredEmail = filteredEmails.find(email => 
      /^(contact|info|hello|support|sales|business)@/i.test(email)
    );
    
    return preferredEmail || filteredEmails[0] || null;
  }
  
  return null;
}

function extractPhone(content: string): string | null {
  // Look for phone number patterns
  const phonePatterns = [
    /(?:phone|tel|call|contact)[\s\:]*([+]?[\d\s\-\(\)\.]{10,20})/i,
    /([+]?1?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{4})/g
  ];
  
  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const phone = match[1].trim().replace(/[^\d+\(\)\-\s]/g, '');
      if (phone.replace(/[^\d]/g, '').length >= 10) {
        return phone;
      }
    }
  }
  
  return null;
}

function extractBusinessBio(content: string): string | null {
  // Look for about us sections or company descriptions
  const bioPatterns = [
    /(?:about us|about our company|our story|who we are|our mission)[\s\:]*([^\n\r]{50,500})/i,
    /(?:we are|we specialize|founded in|established)([^\n\r]{50,300})/i,
    /^([A-Z][^.!?]*(?:[.!?][^.!?]*){2,5}[.!?])/m // First few sentences
  ];
  
  for (const pattern of bioPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      let bio = match[1].trim();
      // Clean up the bio
      bio = bio.replace(/\s+/g, ' ');
      if (bio.length > 50 && bio.length < 1000) {
        return bio;
      }
    }
  }
  
  // Fallback: extract first paragraph that's substantial
  const paragraphs = content.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    const cleaned = paragraph.trim().replace(/\s+/g, ' ');
    if (cleaned.length > 100 && cleaned.length < 800 && !cleaned.match(/^(home|welcome|menu|navigation)/i)) {
      return cleaned;
    }
  }
  
  return null;
}

function extractCountry(content: string): string | null {
  // Look for country/location patterns
  const locationPatterns = [
    /(?:located|based|headquarters|head office)[\s\w]*in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:country|nation|shipping from)\s*[\:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  ];
  
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
    'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
    'Belgium', 'Switzerland', 'Austria', 'Ireland', 'Finland', 'Japan',
    'South Korea', 'Singapore', 'New Zealand', 'Poland', 'Czech Republic'
  ];
  
  for (const pattern of locationPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      // Check if it matches a known country
      const matchedCountry = countries.find(country => 
        country.toLowerCase().includes(location.toLowerCase()) ||
        location.toLowerCase().includes(country.toLowerCase())
      );
      if (matchedCountry) {
        return matchedCountry;
      }
    }
  }
  
  return null;
}