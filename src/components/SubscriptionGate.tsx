import React from 'react';
import { Lock, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface SubscriptionGateProps {
  articleTitle?: string;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ articleTitle }) => {
  return (
    <div className="relative">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent z-10 pointer-events-none" />
      
      {/* Subscription prompt */}
      <Card className="relative z-20 max-w-2xl mx-auto mt-8 border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground mb-2">
            Continue Reading with Free Subscription
          </CardTitle>
          <p className="text-muted-foreground">
            {articleTitle ? `Unlock the full story of "${articleTitle}" and access all our innovation stories` : 'Access unlimited innovation stories and insights'}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Unlimited access to all innovation stories</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Weekly newsletter with latest innovations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Submit your own innovation story</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">100% Free - No credit card required</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center pt-4">
            <Link to="/auth">
              <Button size="lg" className="w-full gap-2">
                <Lock className="w-4 h-4" />
                Get Free Access
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Already have an account? <Link to="/auth" className="text-primary hover:underline">Sign in here</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGate;