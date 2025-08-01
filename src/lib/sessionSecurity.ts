// Session security utilities
import { supabase } from '@/integrations/supabase/client';

interface SessionInfo {
  lastActivity: number;
  userAgent: string;
  ipHash: string;
}

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours (better for long forms)
const SESSION_KEY = 'auth_session_info';

// Hash IP address for privacy (basic implementation)
const hashIP = (ip: string): string => {
  return btoa(ip).substring(0, 10);
};

// Get basic browser fingerprint
const getBrowserFingerprint = (): string => {
  return btoa(navigator.userAgent + navigator.language + screen.width + screen.height).substring(0, 16);
};

// Initialize session security
export const initializeSessionSecurity = async () => {
  try {
    // Get user's IP (this is approximate using a public service)
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();
    
    const sessionInfo: SessionInfo = {
      lastActivity: Date.now(),
      userAgent: getBrowserFingerprint(),
      ipHash: hashIP(ip)
    };
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionInfo));
  } catch (error) {
    console.warn('Failed to initialize session security:', error);
    // Continue without IP tracking if it fails
    const sessionInfo: SessionInfo = {
      lastActivity: Date.now(),
      userAgent: getBrowserFingerprint(),
      ipHash: 'unknown'
    };
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionInfo));
  }
};

// Update session activity
export const updateSessionActivity = () => {
  const sessionData = getSessionInfo();
  if (sessionData) {
    sessionData.lastActivity = Date.now();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }
};

// Get session info
export const getSessionInfo = (): SessionInfo | null => {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// Check if session is valid
export const isSessionValid = (): boolean => {
  const sessionInfo = getSessionInfo();
  if (!sessionInfo) return false;
  
  const timeSinceLastActivity = Date.now() - sessionInfo.lastActivity;
  return timeSinceLastActivity < SESSION_TIMEOUT_MS;
};

// Check for session hijacking
export const detectSessionHijacking = (): boolean => {
  const sessionInfo = getSessionInfo();
  if (!sessionInfo) return false;
  
  const currentFingerprint = getBrowserFingerprint();
  return sessionInfo.userAgent !== currentFingerprint;
};

// Clean up expired session
export const cleanupExpiredSession = async () => {
  if (!isSessionValid() || detectSessionHijacking()) {
    sessionStorage.removeItem(SESSION_KEY);
    
    // Sign out user if session is invalid or hijacked
    try {
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/auth?reason=session_expired';
    } catch (error) {
      console.error('Failed to sign out user:', error);
      window.location.href = '/auth?reason=session_error';
    }
  }
};

// Session monitoring (call this periodically)
export const monitorSession = () => {
  setInterval(() => {
    cleanupExpiredSession();
  }, 60000); // Check every minute
};