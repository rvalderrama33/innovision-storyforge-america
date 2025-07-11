// Email validation utilities
export const emailValidation = {
  // Comprehensive email regex that follows RFC 5322 standards
  regex: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  validate: (email: string): { isValid: boolean; error?: string } => {
    if (!email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (email.length > 254) {
      return { isValid: false, error: 'Email is too long' };
    }
    
    if (!emailValidation.regex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (domain) {
      // Check for common typos in popular domains
      const typos = {
        'gmai.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gnail.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
        'hotmil.com': 'hotmail.com',
      };
      
      if (typos[domain]) {
        return { 
          isValid: false, 
          error: `Did you mean ${email.replace(domain, typos[domain])}?` 
        };
      }
    }
    
    return { isValid: true };
  }
};

// Password strength validation
export const passwordValidation = {
  validate: (password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[];
    error?: string;
  } => {
    const feedback: string[] = [];
    let score = 0;
    
    if (!password) {
      return { 
        isValid: false, 
        score: 0, 
        feedback: [], 
        error: 'Password is required' 
      };
    }
    
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }
    
    if (!/[a-z]/.test(password)) {
      feedback.push('Add lowercase letters');
    } else {
      score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      feedback.push('Add uppercase letters');
    } else {
      score += 1;
    }
    
    if (!/\d/.test(password)) {
      feedback.push('Add numbers');
    } else {
      score += 1;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Add special characters (!@#$%^&* etc.)');
    } else {
      score += 1;
    }
    
    // Check for common weak patterns
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
    ];
    
    if (weakPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Avoid common patterns');
      score = Math.max(0, score - 2);
    }
    
    const isValid = score >= 3 && password.length >= 8;
    
    return {
      isValid,
      score,
      feedback,
    };
  },
  
  getStrengthLabel: (score: number): { label: string; color: string } => {
    if (score <= 1) return { label: 'Very Weak', color: 'text-red-600' };
    if (score <= 2) return { label: 'Weak', color: 'text-orange-600' };
    if (score <= 3) return { label: 'Fair', color: 'text-yellow-600' };
    if (score <= 4) return { label: 'Good', color: 'text-blue-600' };
    return { label: 'Strong', color: 'text-green-600' };
  }
};

// Phone number validation
export const phoneValidation = {
  validate: (phone: string): { isValid: boolean; error?: string } => {
    if (!phone.trim()) {
      return { isValid: false, error: 'Phone number is required' };
    }
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check for valid US phone number (10 digits, optionally with country code)
    if (digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))) {
      return { isValid: true };
    }
    
    return { 
      isValid: false, 
      error: 'Please enter a valid phone number (10 digits)' 
    };
  },
  
  format: (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }
};

// Rate limiting utilities
export const rateLimiter = {
  attempts: new Map<string, { count: number; lastAttempt: number }>(),
  
  checkLimit: (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } => {
    const now = Date.now();
    const record = rateLimiter.attempts.get(key);
    
    if (!record || now - record.lastAttempt > windowMs) {
      // Reset or create new record
      rateLimiter.attempts.set(key, { count: 1, lastAttempt: now });
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetTime: now + windowMs
      };
    }
    
    if (record.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.lastAttempt + windowMs
      };
    }
    
    // Increment attempts
    record.count++;
    record.lastAttempt = now;
    
    return {
      allowed: true,
      remaining: maxAttempts - record.count,
      resetTime: record.lastAttempt + windowMs
    };
  },
  
  reset: (key: string): void => {
    rateLimiter.attempts.delete(key);
  }
};