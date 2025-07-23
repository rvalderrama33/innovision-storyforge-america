import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StripeTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTestPayment = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      console.log("Starting Stripe test payment...");
      
      // Get an approved submission for testing
      const { data: submissions, error: fetchError } = await supabase
        .from('submissions')
        .select('id, product_name, status')
        .eq('status', 'approved')
        .eq('featured', false)
        .limit(1);

      console.log("Submissions query result:", { submissions, fetchError });

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(`Failed to fetch submissions: ${fetchError.message}`);
      }

      if (!submissions || submissions.length === 0) {
        console.error("No submissions found");
        throw new Error('No approved submissions available for testing');
      }

      const testSubmission = submissions[0];
      console.log("Using test submission:", testSubmission);

      // Create a test order for $1
      console.log("Calling stripe-payment function...");
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action: 'create-order',
          submission_id: testSubmission.id,
          amount: 100 // $1.00 for testing
        }
      });

      console.log("Stripe function response:", { data, error });

      if (error) {
        console.error("Stripe function error details:", error);
        throw new Error(`Stripe function error: ${error.message}`);
      }

      if (data.error) {
        console.error("Stripe function returned error:", data.error);
        throw new Error(data.error);
      }

      // Open Stripe checkout in a new tab
      if (data.url) {
        console.log("Opening Stripe checkout URL:", data.url);
        window.open(data.url, '_blank');
        setTestResult(`✅ Test checkout created! Session ID: ${data.session_id}`);
        toast({
          title: "Test Payment Created",
          description: "Stripe checkout opened in new tab. Complete the test payment with test card 4242 4242 4242 4242.",
        });
      } else {
        console.error("No checkout URL received:", data);
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("Test payment error:", error);
      setTestResult(`❌ Error: ${errorMessage}`);
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration Test</CardTitle>
          <CardDescription>
            Test your Stripe connection with a $1 test transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">This will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create a $1 test checkout session</li>
              <li>Open Stripe checkout in a new tab</li>
              <li>Use test card: 4242 4242 4242 4242</li>
              <li>Verify the payment flow works correctly</li>
            </ul>
          </div>

          <Button 
            onClick={handleTestPayment} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating Test Payment..." : "Test Stripe Payment ($1)"}
          </Button>

          {testResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Test Result:</h4>
              <p className="text-sm">{testResult}</p>
              {testResult.includes('✅') && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p><strong>Test Card Details:</strong></p>
                  <p>Card Number: 4242 4242 4242 4242</p>
                  <p>Expiry: Any future date</p>
                  <p>CVC: Any 3-digit number</p>
                  <p>ZIP: Any valid ZIP code</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeTest;