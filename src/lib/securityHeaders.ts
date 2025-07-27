// Security headers configuration for API responses
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://enckzbxifdrihnfcqagb.supabase.co https://api.openai.com https://api.stripe.com https://www.paypal.com https://www.google-analytics.com https://api.ipify.org",
    "frame-src 'self' https://js.stripe.com https://www.paypal.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
});

// CORS headers for edge functions
export const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': 'https://americainnovates.us',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
});

// Enhanced CORS headers for development
export const getDevCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
});