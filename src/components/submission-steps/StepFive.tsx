
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { EnhancedInput } from "@/components/ui/enhanced-input";

interface Recommendation {
  name: string;
  email: string;
  reason: string;
}

interface StepFiveProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onValidationChange: (isValid: boolean) => void;
}

const StepFive = ({ data, onUpdate, onValidationChange }: StepFiveProps) => {
  const recommendations: Recommendation[] =
    (data.recommendations && data.recommendations.length > 0)
      ? data.recommendations
      : [{ name: "", email: "", reason: "" }];
  
  

  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    // Recommendations are now optional
    const hasNoValidationErrors = Object.keys(validationErrors).length === 0;
    const isValid = hasNoValidationErrors;
    onValidationChange(isValid);
    return isValid;
  };

  const handleValidationChange = (field: string, isValid: boolean, error?: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (isValid || !error) {
        delete newErrors[field];
      } else {
        newErrors[field] = error;
      }
      return newErrors;
    });
  };

  useEffect(() => {
    validateForm();
  }, [validationErrors]);

  const addRecommendation = () => {
    const next = [...recommendations, { name: "", email: "", reason: "" }];
    onUpdate({ recommendations: next });
  };

  const removeRecommendation = (index: number) => {
    if (recommendations.length > 1) {
      const next = recommendations.filter((_, i) => i !== index);
      onUpdate({ recommendations: next });
    }
  };

  const updateRecommendation = (index: number, field: keyof Recommendation, value: string) => {
    const next = recommendations.map((rec, i) => 
      i === index ? { ...rec, [field]: value } : rec
    );
    onUpdate({ recommendations: next });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Recommend Other Innovators
        </h3>
        <p className="text-gray-600">
          Help us discover other entrepreneurs or product innovators who have compelling stories worth sharing. <strong>This section is optional.</strong>
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Recommendation {index + 1}
                </CardTitle>
                {recommendations.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRecommendation(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>
                    Full Name
                  </Label>
                  <Input
                    id={`name-${index}`}
                    value={recommendation.name}
                    onChange={(e) => updateRecommendation(index, "name", e.target.value)}
                    placeholder="Enter their full name"
                    className="text-lg py-3"
                  />
                </div>
                
                <EnhancedInput
                  id={`email-${index}`}
                  label="Email Address"
                  type="email"
                  validation="email"
                  value={recommendation.email}
                  onChange={(e) => updateRecommendation(index, "email", e.target.value)}
                  onValidationChange={(isValid, error) => handleValidationChange(`email-${index}`, isValid, error)}
                  placeholder="their.email@example.com"
                  className="text-lg py-3"
                  required={false}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`reason-${index}`}>
                  Why do you recommend them? (Optional)
                </Label>
                <Textarea
                  id={`reason-${index}`}
                  value={recommendation.reason}
                  onChange={(e) => updateRecommendation(index, "reason", e.target.value)}
                  placeholder="What makes their innovation or entrepreneurial journey noteworthy? What problem are they solving?"
                  className="min-h-24 text-lg"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addRecommendation}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Another Recommendation</span>
        </Button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Help us grow the community:</strong> By recommending other innovators, you're helping us discover and feature more inspiring entrepreneurial stories. We may reach out to your recommendations to learn about their innovations and potentially feature them in future articles.
        </p>
      </div>
    </div>
  );
};

export default StepFive;
