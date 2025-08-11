
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== GENERATE ARTICLE FUNCTION START ===");
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    if (!openAIApiKey) {
      console.error('CRITICAL: OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'Please set the OPENAI_API_KEY environment variable' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("OpenAI API key is present:", openAIApiKey ? "YES" : "NO");

    // Parse request body
    let formData;
    try {
      const requestText = await req.text();
      console.log("Raw request body:", requestText);
      
      if (!requestText) {
        console.error("Empty request body received");
        return new Response(JSON.stringify({ 
          error: 'Empty request body',
          details: 'Request body cannot be empty' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      formData = JSON.parse(requestText);
      console.log("Parsed form data keys:", Object.keys(formData));
      console.log("Form data values:", JSON.stringify(formData, null, 2));
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body',
        details: `Failed to parse JSON: ${parseError.message}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Function to scrape website content if URL is provided
    async function scrapeWebsiteContent(url: string): Promise<string> {
      if (!firecrawlApiKey) {
        console.log("Firecrawl API key not configured, skipping website scraping");
        return "";
      }

      try {
        console.log("Scraping website content from:", url);
        const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
        
        const scrapeResult = await app.scrapeUrl(url, {
          formats: ['markdown']
        });

        if (scrapeResult.success && scrapeResult.data?.markdown) {
          console.log("Successfully scraped website content, length:", scrapeResult.data.markdown.length);
          return scrapeResult.data.markdown;
        } else {
          console.log("Failed to scrape website or no content found");
          return "";
        }
      } catch (error) {
        console.error("Error scraping website:", error);
        return "";
      }
    }

    // Check if this is a manual submission and create appropriate prompt
    let prompt;
    let websiteContent = "";
    
    // Scrape website content if URL is provided (for both manual and regular submissions)
    if (formData.website && formData.website.trim() !== '') {
      websiteContent = await scrapeWebsiteContent(formData.website);
    }
    
    if (formData.isManualSubmission) {
      prompt = `
You are a motivational journalist writing for America Innovates Magazine.
Write a comprehensive, in-depth feature article about: ${formData.personName}

Background Information: ${formData.description}

${websiteContent ? `
ADDITIONAL WEBSITE INFORMATION:
The following content was scraped from their website (${formData.website}):
${websiteContent}

Use this website content to gather additional insights about their business, products, services, and entrepreneurial journey.
` : ''}

${formData.sourceLinks && formData.sourceLinks.length > 0 ? `
IMPORTANT: Use these source links to research and gather detailed information about ${formData.personName}:
${formData.sourceLinks.map((link, index) => `[${index + 1}] ${link}`).join('\n')}

Based on the information available from these sources${websiteContent ? ' and their website content' : ''}, write a thorough, well-researched article that covers:
- Their entrepreneurial journey and business ventures
- How their background (sports, entertainment, etc.) shaped their entrepreneurial mindset
- Key business achievements and innovations they've created
- Leadership lessons and entrepreneurial insights from their journey
- How they've built and scaled businesses or organizations
- Their vision for future business endeavors and impact
- Personal insights and quotes about entrepreneurship if available from the sources
` : ''}

CRITICAL FOCUS: This article must be centered on their ENTREPRENEURIAL JOURNEY and business accomplishments. If they have a background in sports, entertainment, or other fields, frame it as how those experiences made them a better entrepreneur, leader, and business innovator. The story should be motivational and inspirational for other entrepreneurs and business leaders.

Write a long-form, comprehensive article (1200-1800 words) in an enthusiastic and inspirational tone that celebrates their entrepreneurial achievements and business impact. 
Structure it as a complete magazine feature article with:
- A compelling headline focused on their business success
- An engaging opening that hooks entrepreneurs and business readers
- Multiple detailed sections covering their entrepreneurial journey and business impact
- Rich details about their business ventures, leadership style, and entrepreneurial lessons
- A strong conclusion that inspires other entrepreneurs

IMPORTANT: Do NOT use markdown headers (# symbols) in your response. Write the article in plain text with clear section breaks but no # symbols.

Make sure to prominently feature the person's name (${formData.personName}) throughout the article and write as if you have thoroughly researched their business journey using the provided sources${websiteContent ? ' and website information' : ''}.
      `;
    } else {
      prompt = `Write a professional magazine article about an innovative entrepreneur and their business journey. Use the following information:

ENTREPRENEUR PROFILE:
- Name: ${formData.fullName || 'Not provided'}
- Location: ${formData.city || 'Not provided'}, ${formData.state || 'Not provided'}
- Background: ${formData.background || 'Not provided'}
- Website: ${formData.website || 'Not provided'}
- Social Media: ${formData.socialMedia || 'Not provided'}

${websiteContent ? `
ADDITIONAL WEBSITE INFORMATION:
The following content was scraped from their website (${formData.website}):
${websiteContent}

Use this website content to gather additional insights about their business, products, services, team, and entrepreneurial story.
` : ''}

BUSINESS VENTURE DETAILS:
- Product/Business Name: ${formData.productName || 'Not provided'}
- Industry/Category: ${formData.category || 'Not provided'}
- Business Stage: ${formData.stage || 'Not provided'}
- Business Description: ${formData.description || 'Not provided'}
- Market Problem Solved: ${formData.problemSolved || 'Not provided'}

THE ENTREPRENEURIAL JOURNEY:
- How the business idea originated: ${formData.ideaOrigin || 'Not provided'}
- Biggest entrepreneurial challenge faced: ${formData.biggestChallenge || 'Not provided'}
- Proudest business moment: ${formData.proudestMoment || 'Not provided'}
- Key inspiration/mentorship: ${formData.inspiration || 'Not provided'}
- What motivates continued business growth: ${formData.motivation || 'Not provided'}

CRITICAL FOCUS: Write this as an ENTREPRENEURIAL SUCCESS STORY. If the person has a background in sports, entertainment, or other fields, frame it as how those experiences developed their business acumen, leadership skills, and entrepreneurial mindset. Focus on business building, innovation, leadership, and entrepreneurial lessons.

Please write a compelling, motivational magazine article (800-1200 words) that tells this entrepreneurial journey. Include:
1. An engaging headline focused on their business success
2. A strong opening that hooks entrepreneurs and business readers
3. The entrepreneur's background and how it shaped their business mindset
4. The market opportunity they identified and how they built their business
5. Key entrepreneurial challenges overcome and business lessons learned
6. Their proudest business achievements and future entrepreneurial vision
7. A conclusion that inspires other entrepreneurs and business leaders

${websiteContent ? 'Incorporate relevant details from their website content to provide deeper insights into their business, products, and entrepreneurial approach.' : ''}

Write in the style of a feature article for America Innovates Magazine, focusing on the entrepreneurial journey and business impact while highlighting leadership lessons and business innovation.

IMPORTANT: Do NOT use markdown headers (# symbols) in your response. Write the article in plain text with clear section breaks but no # symbols.`;
    }

    console.log("Generated prompt length:", prompt.length);

    // Prepare OpenAI request
    const openAIRequest = {
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: formData.isManualSubmission 
            ? 'You are a motivational journalist writing inspiring feature articles for America Innovates Magazine.'
            : 'You are a professional magazine writer specializing in innovation and technology stories. Write engaging, well-structured articles that inspire and inform readers about breakthrough products and the entrepreneurs behind them.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    };

    console.log("Making OpenAI API request...");
    console.log("Request payload:", JSON.stringify(openAIRequest, null, 2));
    
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIRequest),
      });

      console.log("OpenAI API response status:", response.status);
      console.log("OpenAI API response headers:", Object.fromEntries(response.headers.entries()));

    } catch (fetchError) {
      console.error('Network error calling OpenAI:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Network error',
        details: `Failed to connect to OpenAI API: ${fetchError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
      } catch (readError) {
        errorText = 'Could not read error response';
        console.error('Failed to read OpenAI error:', readError);
      }
      
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorText,
        status: response.status 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data;
    try {
      const responseText = await response.text();
      console.log("OpenAI response text length:", responseText.length);
      console.log("OpenAI response preview:", responseText.substring(0, 200) + "...");
      
      data = JSON.parse(responseText);
      console.log("OpenAI response structure:", {
        choices: data.choices ? data.choices.length : 'undefined',
        usage: data.usage || 'undefined',
        hasChoices: !!data.choices,
        firstChoiceHasMessage: !!(data.choices && data.choices[0] && data.choices[0].message)
      });
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response as JSON:', jsonError);
      return new Response(JSON.stringify({ 
        error: 'Invalid OpenAI response',
        details: `OpenAI returned non-JSON response: ${jsonError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI',
        details: 'Response structure is not as expected',
        received: data 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const article = data.choices[0].message.content;
    console.log("Generated article length:", article?.length || 0);
    console.log("Article preview:", article?.substring(0, 100) + "..." || "NO CONTENT");

    if (!article) {
      console.error('OpenAI returned empty article content');
      return new Response(JSON.stringify({ 
        error: 'Empty article content',
        details: 'OpenAI returned no article content',
        openAIResponse: data 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("=== SUCCESS: Saving article to database ===");
    
    // Save the generated article to the database
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract title from first line of article and create slug
    const firstLine = article.split('\n')[0].replace(/^#+\s*/, '').trim(); // Remove markdown headers
    let slug = firstLine
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Fallback slug generation if the first line doesn't produce a good slug
    if (!slug || slug.length < 5) {
      const personName = formData.personName || formData.fullName || formData.productName;
      if (personName) {
        slug = personName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      } else {
        slug = 'untitled-' + Date.now();
      }
    }
    
    // Ensure slug is not too long (max 100 characters)
    if (slug.length > 100) {
      slug = slug.substring(0, 100).replace(/-[^-]*$/, '');
    }
    
    // Add default sources to all articles
    const defaultSources = [
      'https://www.wikipedia.org/',
      'https://www.reddit.com/',
      'https://myproduct.today/',
      'https://www.linkedin.com/'
    ];
    
    const existingSources = formData.sourceLinks || [];
    const allSources = [...existingSources, ...defaultSources];
    
    // Check if this is an update (has ID) or a new submission
    if (formData.id) {
      // Update existing submission
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ 
          generated_article: article,
          source_links: allSources,
          slug: slug
        })
        .eq('id', formData.id);
      
      if (updateError) {
        console.error('Failed to update article in database:', updateError);
        return new Response(JSON.stringify({ 
          error: 'Failed to save article',
          details: updateError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Create new submission for testing purposes
      const submissionData = {
        full_name: formData.fullName || 'Test User',
        product_name: formData.productName || 'Test Product',
        description: formData.description || 'Test description',
        generated_article: article,
        source_links: allSources,
        slug: slug,
        status: 'pending',
        is_manual_submission: formData.isManualSubmission || false,
        // Don't set approved_by - let it be null
        approved_at: null
      };

      const { error: insertError } = await supabase
        .from('submissions')
        .insert(submissionData);
      
      if (insertError) {
        console.error('Failed to insert article into database:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Failed to save article',
          details: insertError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    console.log("Article successfully saved to database");
    
    return new Response(JSON.stringify({ 
      article,
      message: 'Article generated and saved successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== CRITICAL ERROR in generate-article function ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: 'Article generation failed',
      type: error.constructor.name,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
