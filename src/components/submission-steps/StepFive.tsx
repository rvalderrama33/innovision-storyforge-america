
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface StepFiveProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const StepFive = ({ data }: StepFiveProps) => {
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!consent) return;
    
    // In a real app, this would submit to your backend
    console.log("Submitting story:", data);
    setSubmitted(true);
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
          disabled={!consent}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg"
        >
          Submit My Story
        </Button>
        
        {!consent && (
          <p className="text-sm text-red-600 mt-2">
            Please provide consent to feature your story before submitting.
          </p>
        )}
      </div>
    </div>
  );
};

export default StepFive;
