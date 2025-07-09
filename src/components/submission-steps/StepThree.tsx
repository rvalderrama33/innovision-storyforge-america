
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StepThreeProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const StepThree = ({ data, onUpdate }: StepThreeProps) => {
  const [formData, setFormData] = useState({
    ideaOrigin: data.ideaOrigin || "",
    biggestChallenge: data.biggestChallenge || "",
    proudestMoment: data.proudestMoment || "",
    inspiration: data.inspiration || "",
    motivation: data.motivation || ""
  });

  useEffect(() => {
    onUpdate(formData);
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
      key: "proudestMoment",
      label: "What was your proudest moment so far?",
      placeholder: "Share a moment when you felt most proud of your progress, achievement, or impact..."
    },
    {
      key: "inspiration",
      label: "Who helped or inspired you most in this journey?",
      placeholder: "Mention mentors, family, colleagues, or anyone who supported your entrepreneurial journey..."
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
