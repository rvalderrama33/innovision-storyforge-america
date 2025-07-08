
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Check if this is a manual submission and create appropriate prompt
    let prompt;
    
    if (formData.isManualSubmission) {
      prompt = `
You are a motivational journalist writing for America Innovates Magazine.
Write a comprehensive, in-depth feature article about: ${formData.personName}

Background Information: ${formData.description}

${formData.sourceLinks && formData.sourceLinks.length > 0 ? `
IMPORTANT: Use these source links to research and gather detailed information about ${formData.personName}:
${formData.sourceLinks.map((link, index) => `[${index + 1}] ${link}`).join('\n')}

Based on the information available from these sources, write a thorough, well-researched article that covers:
- Their background and early life/career
- Their major achievements and contributions
- Their impact on their industry or community
- Any innovations or breakthrough work they've done
- Their vision for the future
- Personal insights and quotes if available from the sources
` : ''}

Write a long-form, comprehensive article (1200-1800 words) in an enthusiastic and inspirational tone that celebrates this person's achievements and contributions. 
Structure it as a complete magazine feature article with:
- A compelling headline
- An engaging opening that hooks the reader
- Multiple detailed sections covering different aspects of their work and impact
- Rich details and specific examples from the source material
- A strong conclusion that inspires readers

Make sure to prominently feature the person's name (${formData.personName}) throughout the article and write as if you have thoroughly researched them using the provided sources.
      `;
    } else {
      prompt = `Write a professional magazine article about an innovative consumer product. Use the following information:

INNOVATOR PROFILE:
- Name: ${formData.fullName || 'Not provided'}
- Location: ${formData.city || 'Not provided'}, ${formData.state || 'Not provided'}
- Background: ${formData.background || 'Not provided'}
- Website: ${formData.website || 'Not provided'}
- Social Media: ${formData.socialMedia || 'Not provided'}

PRODUCT DETAILS:
- Product Name: ${formData.productName || 'Not provided'}
- Category: ${formData.category || 'Not provided'}
- Stage: ${formData.stage || 'Not provided'}
- Description: ${formData.description || 'Not provided'}
- Problem Solved: ${formData.problemSolved || 'Not provided'}

THE INNOVATION STORY:
- How the idea originated: ${formData.ideaOrigin || 'Not provided'}
- Biggest challenge faced: ${formData.biggestChallenge || 'Not provided'}
- Proudest moment: ${formData.proudestMoment || 'Not provided'}
- Key inspiration/support: ${formData.inspiration || 'Not provided'}
- What motivates continued development: ${formData.motivation || 'Not provided'}

Please write a compelling, professional magazine article (800-1200 words) that tells this innovation story. Include:
1. An engaging headline
2. A strong opening that hooks the reader
3. The innovator's background and what led to the product idea
4. The problem the product solves and its market potential
5. Key challenges overcome during development
6. The innovator's proudest moments and future vision
7. A conclusion that inspires other innovators

Write in the style of a feature article for America Innovates Magazine, focusing on the human story behind the innovation while highlighting the product's impact and potential.`;
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
    
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ generated_article: article })
      .eq('id', formData.submissionId);
    
    if (updateError) {
      console.error('Failed to save article to database:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save article',
        details: updateError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
