import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

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
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    data.recommendations || [{ name: "", email: "", reason: "" }, { name: "", email: "", reason: "" }]
  );

  const validateForm = () => {
    // At least 2 recommendations with name and email filled
    const validRecommendations = recommendations.filter(rec => 
      rec.name.trim() !== "" && rec.email.trim() !== ""
    );
    const hasMinimumRecommendations = validRecommendations.length >= 2;
    onValidationChange(hasMinimumRecommendations);
    return hasMinimumRecommendations;
  };

  useEffect(() => {
    onUpdate({ recommendations });
    validateForm();
  }, [recommendations, onUpdate]);

  const addRecommendation = () => {
    setRecommendations([...recommendations, { name: "", email: "", reason: "" }]);
  };

  const removeRecommendation = (index: number) => {
    if (recommendations.length > 2) {
      setRecommendations(recommendations.filter((_, i) => i !== index));
    }
  };

  const updateRecommendation = (index: number, field: keyof Recommendation, value: string) => {
    setRecommendations(recommendations.map((rec, i) => 
      i === index ? { ...rec, [field]: value } : rec
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Recommend Other Innovators
        </h3>
        <p className="text-gray-600">
          Help us discover other entrepreneurs or product innovators who have compelling stories worth sharing. <strong>Please provide at least 2 recommendations.</strong>
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Recommendation {index + 1}
                  {index < 2 && <span className="text-red-500 ml-1">*</span>}
                </CardTitle>
                {recommendations.length > 2 && (
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
                    Full Name {index < 2 && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id={`name-${index}`}
                    value={recommendation.name}
                    onChange={(e) => updateRecommendation(index, "name", e.target.value)}
                    placeholder="Enter their full name"
                    className="text-lg py-3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>
                    Email Address {index < 2 && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={recommendation.email}
                    onChange={(e) => updateRecommendation(index, "email", e.target.value)}
                    placeholder="their.email@example.com"
                    className="text-lg py-3"
                  />
                </div>
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