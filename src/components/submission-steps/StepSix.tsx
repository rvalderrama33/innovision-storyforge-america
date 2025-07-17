
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendNewSubmissionNotification } from "@/lib/emailService";

interface StepSixProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onValidationChange: (isValid: boolean) => void;
  onSubmissionComplete?: () => void;
}

const vendorCategories = [
  {
    category: "Product Creators and Inventors",
    services: [
      "Patent and Licensing",
      "Engineering and Prototyping",
      "Manufacturing",
      "Product Launch"
    ]
  },
  {
    category: "Entrepreneurs",
    services: [
      "Operational Help",
      "Business Technology",
      "Sales and Marketing"
    ]
  }
];

const StepSix = ({ data, onUpdate, onValidationChange, onSubmissionComplete }: StepSixProps) => {
  const [consent, setConsent] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>(data.selectedVendors || []);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    onValidationChange(consent && selectedVendors.length > 0);
    onUpdate({ selectedVendors });
  }, [consent, selectedVendors, onValidationChange, onUpdate]);

  const handleSubmit = async () => {
    if (!consent || selectedVendors.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting submission process with data:", data);

      // Save to Supabase first
      console.log("Saving to Supabase...");
      const { data: submission, error } = await supabase.from('submissions').insert({
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber,
        city: data.city,
        state: data.state,
        background: data.background,
        website: data.website,
        social_media: data.socialMedia,
        product_name: data.productName,
        category: data.category,
        description: data.description,
        problem_solved: data.problemSolved,
        stage: data.stage,
        idea_origin: data.ideaOrigin,
        biggest_challenge: data.biggestChallenge,
        proudest_moment: data.proudestMoment,
        inspiration: data.inspiration,
        motivation: data.motivation,
        image_urls: data.imageUrls || [],
        recommendations: data.recommendations || [],
        selected_vendors: data.selectedVendors || [],
        status: 'pending'
      }).select().single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // Save individual recommendations for tracking
      if (data.recommendations && data.recommendations.length > 0) {
        console.log("Saving individual recommendations for tracking...");
        const recommendationRecords = data.recommendations.map((rec: any) => ({
          name: rec.name,
          email: rec.email,
          reason: rec.reason || null,
          submission_id: submission.id,
          recommender_name: data.fullName,
          recommender_email: data.email,
          email_sent_at: new Date().toISOString()
        }));

        const { error: recError } = await supabase
          .from('recommendations')
          .insert(recommendationRecords);

        if (recError) {
          console.error("Error saving recommendation records:", recError);
          // Don't fail the whole submission for this
        }
      }

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Successfully saved to Supabase, now generating article...");

      // Generate article using Supabase Edge Function
      console.log("Calling Supabase Edge Function to generate article...");
      const { data: articleResult, error: functionError } = await supabase.functions.invoke('generate-article', {
        body: { ...data, submissionId: submission.id }
      });

      console.log("Edge function response:", { articleResult, functionError });

      if (functionError) {
        console.error("Edge function error:", functionError);
        
        // Check if it's an OpenAI API key issue
        if (functionError.message?.includes('OpenAI API key') || functionError.message?.includes('not configured')) {
          throw new Error("OpenAI API key is not configured. Please contact the administrator to set up the OpenAI API key in Supabase Edge Function secrets.");
        }
        
        throw new Error(`Failed to generate article: ${functionError.message || 'Unknown error'}`);
      }

      if (!articleResult || !articleResult.article) {
        console.error("Invalid response from edge function:", articleResult);
        throw new Error("Invalid response from article generation service. Please try again or contact support.");
      }

      console.log("Article generated successfully");

      // Send notification email to admin
      try {
        await sendNewSubmissionNotification(submission);
        console.log("Admin notification email sent successfully");
      } catch (emailError) {
        console.error("Failed to send admin notification email:", emailError);
        // Don't fail the submission if email fails
      }

      // Delete the draft after successful submission
      if (onSubmissionComplete) {
        onSubmissionComplete();
      }

      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your story has been submitted successfully.",
      });
    } catch (error) {
      console.error('Detailed submission error:', error);
      toast({
        title: "Error",
        description: `Failed to submit your story: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Story Submitted Successfully!
        </h3>
        <p className="text-gray-600 mb-6">
          Thank you for sharing your innovation story with America Innovates Magazine. 
          Our editorial team will review your submission and may reach out for additional information.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>What's Next?</strong><br />
            • Our team will review your submission within 5-7 business days<br />
            • We may contact you for additional details or quotes<br />
            • If selected, we'll work with you to craft a compelling feature article<br />
            • Published stories are shared across our digital platforms and newsletter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Review & Submit Your Story
        </h3>
        <p className="text-gray-600">
          Please review your submission and provide consent to feature your story.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {data.fullName || "Not provided"}</p>
            <p><strong>Location:</strong> {data.city && data.state ? `${data.city}, ${data.state}` : "Not provided"}</p>
            <p><strong>Email:</strong> {data.email || "Not provided"}</p>
            <p><strong>Phone:</strong> {data.phoneNumber || "Not provided"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Innovation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Product:</strong> {data.productName || "Not provided"}</p>
            <p><strong>Stage:</strong> {data.stage ? <Badge>{data.stage}</Badge> : "Not provided"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Summary */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              You recommended {data.recommendations.length} innovator{data.recommendations.length > 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {data.recommendations.map((rec: any, index: number) => (
                <div key={index} className="text-sm">
                  <strong>{rec.name}</strong> ({rec.email})
                  {rec.reason && (
                    <p className="text-gray-600 mt-1">{rec.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Network Section */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg">Business Growth Network</CardTitle>
          <p className="text-sm text-gray-600">
            America Innovates Magazine has created a network of trusted vendors that may be able to help you grow your business. 
            If you would like to be connected with someone please select from the list below. <strong>You must select at least one category.</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {vendorCategories.map((category) => (
            <div key={category.category} className="space-y-3">
              <h4 className="font-semibold text-gray-900">{category.category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {category.services.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={selectedVendors.includes(service)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVendors([...selectedVendors, service]);
                        } else {
                          setSelectedVendors(selectedVendors.filter(v => v !== service));
                        }
                      }}
                    />
                    <label htmlFor={service} className="text-sm cursor-pointer">
                      {service}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* I don't need any help option */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-help"
                checked={selectedVendors.includes("I don't need any help")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedVendors(["I don't need any help"]);
                  } else {
                    setSelectedVendors([]);
                  }
                }}
              />
              <label htmlFor="no-help" className="text-sm cursor-pointer font-medium">
                I don't need any help
              </label>
            </div>
          </div>
          
          {selectedVendors.length === 0 && (
            <p className="text-sm text-red-600">
              Please select at least one option to continue.
            </p>
          )}
          
          {selectedVendors.length > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Selected:</strong> {selectedVendors.includes("I don't need any help") ? "No assistance needed" : `${selectedVendors.length} service${selectedVendors.length > 1 ? 's' : ''}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent */}
      <Card className="border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked as boolean)}
              className="mt-1"
            />
            <div>
              <label htmlFor="consent" className="text-sm font-medium text-gray-900 cursor-pointer">
                Permission to Feature Your Story *
              </label>
              <p className="text-sm text-gray-600 mt-1">
                I agree to allow America Innovates Magazine to feature my story and submitted materials 
                in their digital publication, newsletter, and related promotional materials. I understand 
                that proper attribution will be given and that I retain ownership of my intellectual property.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="text-center">
        <Button
          onClick={handleSubmit}
          disabled={!consent || selectedVendors.length === 0 || isSubmitting}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Article...
            </>
          ) : (
            "Submit My Story"
          )}
        </Button>
        
        {(!consent || selectedVendors.length === 0) && !isSubmitting && (
          <p className="text-sm text-red-600 mt-2">
            {!consent && "Please provide consent to feature your story"}{!consent && selectedVendors.length === 0 && " and"} {selectedVendors.length === 0 && "select at least one option"} before submitting.
          </p>
        )}
      </div>
    </div>
  );
};

export default StepSix;
