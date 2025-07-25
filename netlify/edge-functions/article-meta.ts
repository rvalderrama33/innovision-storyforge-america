export default async (request: Request) => {
  console.log('🚀 Article Meta Edge Function triggered!', request.url);
  const url = new URL(request.url);
  console.log('🔍 URL pathname:', url.pathname);
  
  // Extract slug from URL path like /article/slug-here
  const pathSegments = url.pathname.split('/');
  if (pathSegments.length < 3 || pathSegments[1] !== 'article') {
    console.log('❌ Invalid article URL path:', url.pathname);
    return new Response('Invalid article URL', { status: 400 });
  }
  
  const slug = pathSegments[2];
  console.log('✅ Processing article request for slug:', slug);
  
  // For now, return a simple HTML page with meta tags for testing
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Article: ${slug}</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Test Article: ${slug}">
    <meta property="og:description" content="This is a test article for ${slug}">
    <meta property="og:image" content="https://americainnovates.netlify.app/placeholder.svg">
    <meta property="og:url" content="${request.url}">
    <meta property="og:type" content="article">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Test Article: ${slug}">
    <meta name="twitter:description" content="This is a test article for ${slug}">
    <meta name="twitter:image" content="https://americainnovates.netlify.app/placeholder.svg">
    
    <script>
      // Redirect non-crawlers to the main app
      const userAgent = navigator.userAgent.toLowerCase();
      const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot/i.test(userAgent);
      
      if (!isCrawler) {
        window.location.href = 'https://americainnovates.netlify.app/article/${slug}';
      }
    </script>
</head>
<body>
    <h1>Test Article: ${slug}</h1>
    <p>This is a test page for social media crawlers.</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=300',
    },
  });
};

export const config = {
  path: "/article/*"
};