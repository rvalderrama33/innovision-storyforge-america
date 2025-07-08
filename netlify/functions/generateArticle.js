
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    
    console.log('Generate Article function called with:', body);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'OpenAI API key not configured',
        }),
      };
    }

    let prompt;
    
    if (body.isManualSubmission) {
      prompt = `
You are a motivational journalist writing for America Innovates Magazine.
Write a feature article about: ${body.personName}

Description/Story: ${body.description}

${body.sourceLinks && body.sourceLinks.length > 0 ? `
Source Links for reference:
${body.sourceLinks.map((link, index) => `[${index + 1}] ${link}`).join('\n')}
` : ''}

Write in an enthusiastic and inspirational tone, like a feature article that celebrates this person's achievements and contributions. 
Focus on the human story and their impact.
Make it engaging and motivational for readers.
Include a compelling headline and structure it as a complete magazine article.
Make sure to prominently feature the person's name (${body.personName}) throughout the article.
      `;
    } else {
      prompt = `
You are a motivational journalist writing for America Innovates Magazine.
Write a feature article based on this submission:

Name: ${body.fullName || 'Not provided'}
Location: ${body.city && body.state ? `${body.city}, ${body.state}` : 'Not provided'}
Background: ${body.background || 'Not provided'}
Product: ${body.productName || 'Not provided'}
Category: ${body.category || 'Not provided'}
Description: ${body.description || 'Not provided'}
Problem Solved: ${body.problemSolved || 'Not provided'}
Origin Story: ${body.ideaOrigin || 'Not provided'}
Biggest Challenge: ${body.biggestChallenge || 'Not provided'}
Proudest Moment: ${body.proudestMoment || 'Not provided'}
Inspiration/Mentor: ${body.inspiration || 'Not provided'}
Motivation: ${body.motivation || 'Not provided'}
Website: ${body.website || 'Not provided'}
Social Media: ${body.socialMedia || 'Not provided'}

Write in an enthusiastic and inspirational tone, like a feature article that celebrates their innovation journey. 
Focus on the human story behind the product and how it solves real consumer problems.
Make it engaging and motivational for other innovators to read.
Include a compelling headline and structure it as a complete magazine article.
      `;
    }

    // Use the modern OpenAI API with fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a motivational journalist writing inspiring feature articles for America Innovates Magazine.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const article = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        article,
        timestamp: new Date().toISOString(),
        requestData: body
      }),
    };
  } catch (error) {
    console.error('Error in generateArticle function:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate article',
        message: error.message,
      }),
    };
  }
};
