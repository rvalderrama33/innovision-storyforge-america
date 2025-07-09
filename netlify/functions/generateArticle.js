
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
Write a comprehensive, in-depth feature article about: ${body.personName}

Background Information: ${body.description}

${body.sourceLinks && body.sourceLinks.length > 0 ? `
IMPORTANT: Use these source links to research and gather detailed information about ${body.personName}:
${body.sourceLinks.map((link, index) => `[${index + 1}] ${link}`).join('\n')}

Based on the information available from these sources, write a thorough, well-researched article that covers:
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

Make sure to prominently feature the person's name (${body.personName}) throughout the article and write as if you have thoroughly researched their business journey using the provided sources.
      `;
    } else {
      prompt = `
You are a motivational journalist writing for America Innovates Magazine.
Write a feature article based on this entrepreneurial submission:

Entrepreneur Name: ${body.fullName || 'Not provided'}
Location: ${body.city && body.state ? `${body.city}, ${body.state}` : 'Not provided'}
Background: ${body.background || 'Not provided'}
Business/Product: ${body.productName || 'Not provided'}
Industry: ${body.category || 'Not provided'}
Business Description: ${body.description || 'Not provided'}
Market Problem Solved: ${body.problemSolved || 'Not provided'}
Business Origin Story: ${body.ideaOrigin || 'Not provided'}
Biggest Entrepreneurial Challenge: ${body.biggestChallenge || 'Not provided'}
Proudest Business Moment: ${body.proudestMoment || 'Not provided'}
Inspiration/Mentor: ${body.inspiration || 'Not provided'}
Business Motivation: ${body.motivation || 'Not provided'}
Website: ${body.website || 'Not provided'}
Social Media: ${body.socialMedia || 'Not provided'}

CRITICAL FOCUS: Write this as an ENTREPRENEURIAL SUCCESS STORY. If the person has a background in sports, entertainment, or other fields, frame it as how those experiences developed their business acumen, leadership skills, and entrepreneurial mindset. Focus on business building, innovation, leadership, and entrepreneurial lessons.

Write in an enthusiastic and inspirational tone, like a feature article that celebrates their entrepreneurial journey and business impact. 
Focus on the human story behind the business venture and how they identified and solved market problems.
Make it engaging and motivational for other entrepreneurs and business leaders to read.
Include a compelling headline focused on their business success and structure it as a complete magazine article.
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
        requestData: body,
        defaultSources: [
          'https://www.wikipedia.org/',
          'https://www.reddit.com/',
          'https://myproduct.today/',
          'https://www.linkedin.com/'
        ]
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
