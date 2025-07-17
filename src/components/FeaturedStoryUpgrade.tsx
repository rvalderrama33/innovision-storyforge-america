
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

declare global {
  interface Window {
    paypal: any;
  }
}

const FeaturedStoryUpgrade = ({ submission, onPaymentSuccess }: FeaturedStoryUpgradeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const { toast } = useToast();

  // PayPal Client ID for production
  const PAYPAL_CLIENT_ID = "ASS7CDATty_wFE_ArsuvMaNAkVeRTu_0-AXfW6htus-edLPHmeIeyJXygyFIE9FQIGpEterVd5bid6ft";

  const loadPayPalScript = () => {
    if (window.paypal || paypalLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
      script.onload = () => {
        setPaypalLoaded(true);
        resolve(undefined);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
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
      await loadPayPalScript();

      if (!window.paypal) {
        throw new Error('PayPal SDK failed to load');
      }

      // Create PayPal buttons
      window.paypal.Buttons({
        createOrder: async () => {
          console.log('Creating PayPal order for submission ID:', submission.id);
          
          const { data, error } = await supabase.functions.invoke('paypal-payment', {
            body: {
              action: 'create-order',
              submissionId: submission.id,
              amount: 5000, // $50.00 in cents
              currency: 'USD'
            }
          });

          console.log('PayPal create order response:', { data, error });

          if (error) {
            console.error('Error creating PayPal order:', error);
            throw new Error(`Failed to create payment order: ${error.message}`);
          }

          if (!data || !data.orderID) {
            console.error('No order ID received:', data);
            throw new Error('Failed to create payment order - no order ID received');
          }

          return data.orderID;
        },

        onApprove: async (data: any) => {
          console.log('PayPal payment approved:', data);
          
          const { data: captureData, error } = await supabase.functions.invoke('paypal-payment', {
            body: {
              action: 'capture-order',
              orderID: data.orderID,
              submissionId: submission.id
            }
          });

          console.log('PayPal capture response:', { captureData, error });

          if (error) {
            console.error('Error capturing PayPal payment:', error);
            toast({
              title: "Payment Failed",
              description: `There was an error processing your payment: ${error.message}`,
              variant: "destructive"
            });
            return;
          }

          toast({
            title: "Payment Successful!",
            description: "Your story has been upgraded to featured status for 30 days.",
            variant: "default"
          });

          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        },

        onError: (err: any) => {
          console.error('PayPal error:', err);
          toast({
            title: "Payment Error",
            description: "There was an error with the payment process. Please try again.",
            variant: "destructive"
          });
        },

        onCancel: () => {
          console.log('PayPal payment cancelled');
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled. You can try again anytime.",
            variant: "default"
          });
        }
      }).render('#paypal-button-container');

    } catch (error) {
      console.error('Error setting up PayPal:', error);
      toast({
        title: "Setup Error",
        description: `Failed to initialize payment system: ${error.message}`,
        variant: "destructive"
      });
    } finally {
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

          {!paypalLoaded ? (
            <Button 
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Loading Payment...' : 'Upgrade to Featured'}
            </Button>
          ) : (
            <div id="paypal-button-container" className="w-full"></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedStoryUpgrade;
