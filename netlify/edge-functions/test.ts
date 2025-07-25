export default async (request: Request) => {
  console.log('🚀 TEST Edge Function triggered!', request.url);
  
  return new Response(JSON.stringify({
    message: 'Test edge function working!',
    url: request.url,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const config = {
  path: "/test-edge"
};