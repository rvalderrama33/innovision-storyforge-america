
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { PasswordInput } from '@/components/ui/password-input';
import { rateLimiter } from '@/lib/validation';
import { useSEO } from '@/hooks/useSEO';
import { Shield, Clock } from 'lucide-react';
import { subscribeToNewsletter } from '@/lib/newsletterService';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    isLimited: boolean;
    resetTime: number;
    remaining: number;
  }>({ isLimited: false, resetTime: 0, remaining: 5 });
  const { signIn, signUp, signInWithGoogle, user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || '/';

  useSEO({
    title: "Sign In | America Innovates Magazine",
    description: "Sign in to your America Innovates Magazine account to submit innovation stories, manage subscriptions, and access exclusive content.",
    url: "https://americainnovates.us/auth"
  });

  useEffect(() => {
    if (user && !authLoading) {
      // Check if user has admin privileges and redirect to admin choice page if no specific destination
      if (from === '/' && isAdmin) {
        navigate('/admin/choice', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, from, isAdmin, authLoading]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const userKey = `signin-${email}`;
    const limitCheck = rateLimiter.checkLimit(userKey, 5, 15 * 60 * 1000);
    
    if (!limitCheck.allowed) {
      const resetTimeMinutes = Math.ceil((limitCheck.resetTime - Date.now()) / (60 * 1000));
      setRateLimitInfo({
        isLimited: true,
        resetTime: limitCheck.resetTime,
        remaining: limitCheck.remaining
      });
      
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${resetTimeMinutes} minutes before trying again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!emailValid || !email || !password) {
      toast({
        title: "Invalid Input",
        description: "Please check your email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRateLimitInfo({ 
      isLimited: false, 
      resetTime: 0, 
      remaining: limitCheck.remaining 
    });

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Reset rate limiter on successful login
        rateLimiter.reset(userKey);
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        // Redirect will be handled by useEffect after roles are loaded
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const userKey = `signup-${email}`;
    const limitCheck = rateLimiter.checkLimit(userKey, 3, 60 * 60 * 1000); // 3 attempts per hour
    
    if (!limitCheck.allowed) {
      const resetTimeMinutes = Math.ceil((limitCheck.resetTime - Date.now()) / (60 * 1000));
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${resetTimeMinutes} minutes before trying again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!email || !password || !fullName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Reset rate limiter on successful signup
        rateLimiter.reset(userKey);
        
        // Subscribe user to newsletter
        try {
          await subscribeToNewsletter(email, fullName);
          console.log('User automatically subscribed to newsletter');
        } catch (newsletterError) {
          console.error('Newsletter subscription failed:', newsletterError);
          // Don't show error to user as account creation was successful
        }
        
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account. You've been subscribed to our newsletter.",
        });

        // Redirect to home page after successful signup
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-2">
          <Link to="/" className="block">
            <img 
              src="/lovable-uploads/1f7bd9f1-6251-4e7e-87ea-a2a66117e1d1.png" 
              alt="America Innovates Magazine" 
              className="h-64 mx-auto"
            />
          </Link>
          <p className="text-gray-600 mt-1">Sign in to your account or create a free subscription</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-blue-800 text-sm text-center">
              You must be logged in to begin the Story Submission Process
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <div className="mb-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50" 
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? 'Signing In...' : 'Continue with Google'}
                  </Button>
                </div>
                
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <EnhancedInput
                    type="email"
                    placeholder="Email address"
                    validation="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onValidationChange={(isValid) => setEmailValid(isValid)}
                    required
                  />
                  
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  
                  {rateLimitInfo.isLimited && (
                    <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        Too many failed attempts. Please wait before trying again.
                      </span>
                    </div>
                  )}
                  
                  {!rateLimitInfo.isLimited && rateLimitInfo.remaining < 3 && (
                    <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <Shield className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-700">
                        {rateLimitInfo.remaining} attempts remaining
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !emailValid || rateLimitInfo.isLimited}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <div className="mb-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50" 
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? 'Creating Account...' : 'Continue with Google'}
                  </Button>
                </div>
                
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  
                  <EnhancedInput
                    type="email"
                    placeholder="Email address"
                    validation="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onValidationChange={(isValid) => setEmailValid(isValid)}
                    required
                  />
                  
                  <PasswordInput
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onValidationChange={(isValid) => setPasswordValid(isValid)}
                    showStrengthMeter={true}
                    required
                  />
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">Password Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>At least 8 characters long</li>
                      <li>Include uppercase and lowercase letters</li>
                      <li>Include at least one number</li>
                      <li>Include at least one special character</li>
                    </ul>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !email || !password || !fullName.trim()}
                  >
                    {isLoading ? 'Creating Free Account...' : 'Create Free Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
