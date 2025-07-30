
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeaturedStoryUpgradeProps {
  submission: any;
  onPaymentSuccess?: () => void;
}

const FeaturedStoryUpgrade = ({ submission, onPaymentSuccess }: FeaturedStoryUpgradeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStripeUpgrade = async () => {
    console.log('Starting Stripe upgrade process for submission:', submission);
    
    if (!submission || !submission.id) {
      console.error('No submission or submission ID provided:', submission);
      toast({
        title: "Error",
        description: "Invalid submission data. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action: 'create-order',
          submission_id: submission.id,
          amount: 5000 // $50.00 in cents
        }
      });

      console.log('Stripe create order response:', { data, error });

      if (error) {
        console.error('Error creating Stripe checkout:', error);
        throw new Error(`Failed to create checkout: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Error setting up Stripe:', error);
      toast({
        title: "Stripe Payment Error",
        description: `Failed to initialize Stripe payment: ${error.message}`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handlePayPalUpgrade = async () => {
    console.log('Starting PayPal upgrade process for submission:', submission);
    
    if (!submission || !submission.id) {
      console.error('No submission or submission ID provided:', submission);
      toast({
        title: "Error", 
        description: "Invalid submission data. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create PayPal order
      const { data, error } = await supabase.functions.invoke('paypal-payment', {
        body: {
          action: 'create-order',
          submissionId: submission.id,
          amount: 50.00,
          currency: 'USD'
        }
      });

      console.log('PayPal create order response:', { data, error });

      if (error) {
        console.error('Error creating PayPal order:', error);
        throw new Error(`Failed to create PayPal order: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.orderID) {
        // Redirect to PayPal checkout
        const paypalCheckoutUrl = `https://www.paypal.com/checkoutnow?token=${data.orderID}`;
        window.location.href = paypalCheckoutUrl;
      } else {
        throw new Error('No PayPal order ID received');
      }

    } catch (error) {
      console.error('Error setting up PayPal:', error);
      toast({
        title: "PayPal Payment Error",
        description: `Failed to initialize PayPal payment: ${error.message}`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Don't show if story is already featured
  if (submission?.featured) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Star className="h-5 w-5 fill-current" />
            Featured Story
          </CardTitle>
          <CardDescription className="text-green-600">
            This story is currently featured and highlighted on the homepage.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Only show for approved stories
  if (submission?.status !== 'approved') {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Star className="h-5 w-5" />
          Upgrade to Featured Story
        </CardTitle>
        <CardDescription className="text-blue-700">
          Make your story stand out with premium placement and highlighting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Homepage highlighting</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm">30 days featured</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-sm">Only $50</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-lg">Featured Story Upgrade</h4>
              <p className="text-sm text-gray-600">30-day premium placement</p>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              $50
            </Badge>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleStripeUpgrade}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Creating Checkout...' : 'Pay with Stripe'}
            </Button>
            
            <Button 
              onClick={handlePayPalUpgrade}
              disabled={isLoading}
              variant="outline"
              className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              {isLoading ? 'Creating Order...' : 'Pay with PayPal'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedStoryUpgrade;
