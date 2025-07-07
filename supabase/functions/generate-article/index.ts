
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    console.log("Article generation function called");
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'Please set the OPENAI_API_KEY environment variable' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.json();
    console.log("Received form data for article generation:", JSON.stringify(formData, null, 2));

    // Create a detailed prompt for article generation
    const prompt = `Write a professional magazine article about an innovative consumer product. Use the following information:

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

    console.log("Sending request to OpenAI...");
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
            content: 'You are a professional magazine writer specializing in innovation and technology stories. Write engaging, well-structured articles that inspire and inform readers about breakthrough products and the entrepreneurs behind them.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    console.log("OpenAI response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log("OpenAI response received successfully");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI',
        details: 'Response structure is not as expected' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const article = data.choices[0].message.content;
    console.log("Article generated successfully, length:", article?.length);

    return new Response(JSON.stringify({ article }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-article function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: 'Article generation failed',
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
