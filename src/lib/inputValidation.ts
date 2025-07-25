import DOMPurify from 'dompurify';

// Sanitize HTML input to prevent XSS attacks
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: []
  });
};

// Sanitize plain text input
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Validate URL format and security
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url) return { isValid: true }; // Empty URLs are allowed
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    // Block suspicious domains
    const suspiciousDomains = ['javascript', 'data', 'vbscript'];
    if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
      return { isValid: false, error: 'Suspicious URL detected' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Validate email format
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) return { isValid: false, error: 'Email is required' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  // Block suspicious email patterns
  const suspiciousPatterns = ['javascript', 'script', '<', '>'];
  if (suspiciousPatterns.some(pattern => email.toLowerCase().includes(pattern))) {
    return { isValid: false, error: 'Suspicious email format detected' };
  }
  
  return { isValid: true };
};

// Rate limiting for sensitive operations
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  checkLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now - record.lastAttempt > windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
    }
    
    if (record.count >= maxAttempts) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: record.lastAttempt + windowMs 
      };
    }
    
    record.count++;
    record.lastAttempt = now;
    return { 
      allowed: true, 
      remaining: maxAttempts - record.count, 
      resetTime: record.lastAttempt + windowMs 
    };
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const adminActionRateLimiter = new RateLimiter();
export const submissionRateLimiter = new RateLimiter();