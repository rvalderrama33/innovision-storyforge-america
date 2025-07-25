// CSRF protection utilities
import { supabase } from '@/integrations/supabase/client';

// Generate a CSRF token
export const generateCSRFToken = (): string => {
  const token = crypto.randomUUID();
  sessionStorage.setItem('csrf_token', token);
  return token;
};

// Validate CSRF token
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === token && token !== null;
};

// Get current CSRF token
export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem('csrf_token');
};

// Remove CSRF token
export const clearCSRFToken = (): void => {
  sessionStorage.removeItem('csrf_token');
};

// CSRF protected request wrapper
export const csrfProtectedRequest = async (
  requestFn: () => Promise<any>,
  skipCSRF: boolean = false
): Promise<any> => {
  if (!skipCSRF) {
    const token = getCSRFToken();
    if (!token) {
      throw new Error('CSRF token missing');
    }
  }
  
  try {
    return await requestFn();
  } catch (error) {
    // Clear CSRF token on certain errors
    if (error instanceof Error && error.message.includes('CSRF')) {
      clearCSRFToken();
    }
    throw error;
  }
};

// Initialize CSRF token on app start
export const initializeCSRF = () => {
  if (!getCSRFToken()) {
    generateCSRFToken();
  }
};