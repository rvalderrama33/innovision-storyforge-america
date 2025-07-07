
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
    const formData = await req.json();
    console.log("Received form data for article generation:", formData);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a detailed prompt for article generation
    const prompt = `Write a professional magazine article about an innovative consumer product. Use the following information:

INNOVATOR PROFILE:
- Name: ${formData.fullName}
- Location: ${formData.city}, ${formData.state}
- Background: ${formData.background}
- Website: ${formData.website || 'Not provided'}
- Social Media: ${formData.socialMedia || 'Not provided'}

PRODUCT DETAILS:
- Product Name: ${formData.productName}
- Category: ${formData.category}
- Stage: ${formData.stage}
- Description: ${formData.description}
- Problem Solved: ${formData.problemSolved}

THE INNOVATION STORY:
- How the idea originated: ${formData.ideaOrigin}
- Biggest challenge faced: ${formData.biggestChallenge}
- Proudest moment: ${formData.proudestMoment}
- Key inspiration/support: ${formData.inspiration}
- What motivates continued development: ${formData.motivation}

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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const article = data.choices[0].message.content;

    console.log("Article generated successfully");
    return new Response(JSON.stringify({ article }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-article function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Article generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
