import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Capture the payment and update the database
      capturePayment(sessionId);
    } else {
      setProcessing(false);
    }
  }, [searchParams]);

  const capturePayment = async (sessionId: string) => {
    try {
      console.log("Capturing payment for session:", sessionId);
      
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action: 'capture-order',
          session_id: sessionId
        }
      });

      if (error) {
        console.error("Capture error:", error);
        throw new Error(`Failed to process payment: ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPaymentDetails(data);
      toast({
        title: "Payment Successful!",
        description: "Your story has been featured successfully and will appear prominently for 30 days.",
      });

    } catch (error) {
      console.error("Payment capture failed:", error);
      toast({
        title: "Payment Processing Error",
        description: "Your payment was successful, but there was an error processing it. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {processing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  Processing Payment...
                </CardTitle>
                <CardDescription>
                  Please wait while we confirm your payment and activate your featured story.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-6 w-6" />
                  Payment Successful!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your story has been upgraded to featured status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li>• Your story will be prominently displayed on the homepage</li>
                    <li>• Featured status will last for 30 days</li>
                    <li>• Increased visibility and engagement</li>
                    <li>• Professional highlighting and placement</li>
                  </ul>
                </div>

                {paymentDetails && (
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Payment Details</h3>
                    <p className="text-sm text-green-700">
                      {paymentDetails.message || "Payment processed successfully"}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Return to Homepage
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/stories'}
                    className="flex-1"
                  >
                    View All Stories
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;