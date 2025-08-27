
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepThreeProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onValidationChange: (isValid: boolean) => void;
}

const StepThree = ({ data, onUpdate, onValidationChange }: StepThreeProps) => {
  const [formData, setFormData] = useState({
    ideaOrigin: data.ideaOrigin || "",
    biggestChallenge: data.biggestChallenge || "",
    motivation: data.motivation || ""
  });

  useEffect(() => {
    // Sync when parent data changes (restored draft)
    setFormData(prev => ({
      ...prev,
      ideaOrigin: data.ideaOrigin || "",
      biggestChallenge: data.biggestChallenge || "",
      motivation: data.motivation || ""
    }));
  }, [data]);

  const validateForm = () => {
    const requiredFields = ['ideaOrigin', 'biggestChallenge', 'motivation'];
    const isValid = requiredFields.every(field => 
      formData[field as keyof typeof formData]?.trim() !== ""
    );
    onValidationChange(isValid);
    return isValid;
  };

  useEffect(() => {
    onUpdate(formData);
    validateForm();
  }, [formData, onUpdate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const questions = [
    {
      key: "ideaOrigin",
      label: "How did the idea come to you?",
      placeholder: "Describe the moment or experience that sparked your innovation or business idea..."
    },
    {
      key: "biggestChallenge",
      label: "What was your biggest challenge in building this innovation/business?",
      placeholder: "Tell us about the most difficult obstacle you've faced and how you overcame it..."
    },
    {
      key: "motivation",
      label: "What motivates you to keep pursuing this innovation?",
      placeholder: "What drives you to continue developing and growing your business or innovation?"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your Innovation Journey
        </h3>
        <p className="text-gray-600">
          Share the story behind your innovation or business - the challenges, victories, and what drives you forward.
        </p>
      </div>

      {questions.map((question, index) => (
        <div key={question.key} className="space-y-2">
          <Label htmlFor={question.key} className="text-base font-medium">
            {index + 1}. {question.label} *
          </Label>
          <Textarea
            id={question.key}
            value={formData[question.key as keyof typeof formData]}
            onChange={(e) => handleChange(question.key, e.target.value)}
            placeholder={question.placeholder}
            className="min-h-28 text-lg"
          />
        </div>
      ))}

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> These stories help us craft a compelling narrative that will resonate with readers and fellow innovators. 
          Be authentic and detailed - your entrepreneurial journey is what makes your story truly inspiring.
        </p>
      </div>
    </div>
  );
};

export default StepThree;
