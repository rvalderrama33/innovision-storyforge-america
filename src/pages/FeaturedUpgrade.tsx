import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, TrendingUp, Users, Zap } from "lucide-react";
import { toast } from "sonner";

const FeaturedUpgrade = () => {
  const [searchParams] = useSearchParams();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const submissionId = searchParams.get("submission_id");
  const amount = searchParams.get("amount") || "5000";

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) {
        toast.error("No submission ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .eq("id", submissionId)
          .eq("status", "approved")
          .single();

        if (error) {
          console.error("Error fetching submission:", error);
          toast.error("Submission not found or not approved");
          return;
        }

        setSubmission(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load submission details");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleUpgrade = async () => {
    if (!submission) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-payment", {
        body: {
          action: "create-order",
          submission_id: submission.id,
          amount: parseInt(amount)
        }
      });

      if (error) {
        console.error("Payment error:", error);
        toast.error("Failed to create payment session");
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast.success("Redirecting to payment...");
      } else {
        toast.error("No payment URL received");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your story...</span>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Story Not Found</CardTitle>
            <CardDescription>
              This story upgrade link is invalid or the story is not approved yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submission.featured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Already Featured!
            </CardTitle>
            <CardDescription>
              Your story "{submission.product_name}" is already featured on our platform.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const price = parseInt(amount) / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Upgrade to Featured Story
          </h1>
          <p className="text-lg text-muted-foreground">
            Give your innovation story the spotlight it deserves
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Story: {submission.product_name}</span>
              <Badge variant="secondary">Approved</Badge>
            </CardTitle>
            <CardDescription>
              Submitted by {submission.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {submission.description}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Category:</span>
                <span className="ml-2 capitalize">{submission.category || "Innovation"}</span>
              </div>
              <div>
                <span className="font-medium">Stage:</span>
                <span className="ml-2 capitalize">{submission.stage || "Development"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Story Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Front Page Placement</h4>
                  <p className="text-sm text-muted-foreground">
                    Your story prominently displayed on our magazine's front page
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">30 Days of Exposure</h4>
                  <p className="text-sm text-muted-foreground">
                    Featured placement for a full month
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Newsletter Feature</h4>
                  <p className="text-sm text-muted-foreground">
                    Highlighted in our weekly newsletter to thousands of subscribers
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade Now</CardTitle>
            <CardDescription>
              One-time payment for 30 days of featured placement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-medium">Featured Story Upgrade</span>
              <span className="text-2xl font-bold">${price}</span>
            </div>
            
            <Button 
              onClick={handleUpgrade}
              disabled={processing}
              className="w-full text-lg py-6"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Star className="h-5 w-5 mr-2" />
                  Upgrade to Featured - ${price}
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Secure payment powered by Stripe. You'll be redirected to complete your purchase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeaturedUpgrade;