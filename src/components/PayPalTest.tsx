import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    paypal: any;
  }
}

const PayPalTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
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

  const handleTestPayment = async () => {
    console.log('Starting PayPal $1 test transaction');
    setIsLoading(true);
    setTestResult(null);

    try {
      await loadPayPalScript();

      if (!window.paypal) {
        throw new Error('PayPal SDK failed to load');
      }

      // Clear any existing PayPal buttons
      const container = document.getElementById('paypal-test-container');
      if (container) {
        container.innerHTML = '';
      }

      // Create PayPal buttons for $1 test
      window.paypal.Buttons({
        createOrder: async () => {
          console.log('Creating PayPal test order for $1');
          
          const { data, error } = await supabase.functions.invoke('paypal-payment', {
            body: {
              action: 'create-order',
              submissionId: 'test-transaction-' + Date.now(),
              amount: 100, // $1.00 in cents
              currency: 'USD',
              isTest: true
            }
          });

          console.log('PayPal test order response:', { data, error });

          if (error) {
            console.error('Error creating PayPal test order:', error);
            setTestResult('error');
            throw new Error(`Failed to create test payment order: ${error.message}`);
          }

          if (!data || !data.orderID) {
            console.error('No order ID received for test:', data);
            setTestResult('error');
            throw new Error('Failed to create test payment order - no order ID received');
          }

          return data.orderID;
        },

        onApprove: async (data: any) => {
          console.log('PayPal test payment approved:', data);
          
          const { data: captureData, error } = await supabase.functions.invoke('paypal-payment', {
            body: {
              action: 'capture-order',
              orderID: data.orderID,
              submissionId: 'test-transaction-' + Date.now(),
              isTest: true
            }
          });

          console.log('PayPal test capture response:', { captureData, error });

          if (error) {
            console.error('Error capturing PayPal test payment:', error);
            setTestResult('error');
            toast({
              title: "Test Payment Failed",
              description: `There was an error processing the test payment: ${error.message}`,
              variant: "destructive"
            });
            return;
          }

          setTestResult('success');
          toast({
            title: "Test Payment Successful!",
            description: "Your $1 test transaction completed successfully. PayPal connection is working!",
            variant: "default"
          });
        },

        onError: (err: any) => {
          console.error('PayPal test error:', err);
          setTestResult('error');
          toast({
            title: "Test Payment Error",
            description: "There was an error with the test payment process.",
            variant: "destructive"
          });
        },

        onCancel: () => {
          console.log('PayPal test payment cancelled');
          toast({
            title: "Test Payment Cancelled",
            description: "Test payment was cancelled.",
            variant: "default"
          });
        }
      }).render('#paypal-test-container');

    } catch (error) {
      console.error('Error setting up PayPal test:', error);
      setTestResult('error');
      toast({
        title: "Test Setup Error",
        description: `Failed to initialize test payment system: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <DollarSign className="h-5 w-5" />
          PayPal Connection Test
        </CardTitle>
        <CardDescription className="text-blue-700">
          Test your PayPal integration with a $1 transaction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <h4 className="font-semibold">Test Transaction</h4>
            <p className="text-sm text-gray-600">Verify PayPal connection</p>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            $1.00
          </Badge>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            testResult === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {testResult === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {testResult === 'success' 
                ? 'PayPal connection working!' 
                : 'PayPal connection failed'}
            </span>
          </div>
        )}

        {!paypalLoaded ? (
          <Button 
            onClick={handleTestPayment}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Loading Test...' : 'Run $1 Test Transaction'}
          </Button>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">Click the PayPal button below to test:</p>
            <div id="paypal-test-container" className="w-full"></div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• This will charge $1.00 to test the connection</p>
          <p>• Check browser console for detailed logs</p>
          <p>• Using production PayPal environment</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayPalTest;