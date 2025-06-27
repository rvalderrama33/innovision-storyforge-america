
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import StepOne from "@/components/submission-steps/StepOne";
import StepTwo from "@/components/submission-steps/StepTwo";
import StepThree from "@/components/submission-steps/StepThree";
import StepFour from "@/components/submission-steps/StepFour";
import StepFive from "@/components/submission-steps/StepFive";

const SubmissionWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const steps = [
    { number: 1, title: "About You", component: StepOne },
    { number: 2, title: "Your Product", component: StepTwo },
    { number: 3, title: "Your Journey", component: StepThree },
    { number: 4, title: "Product Photos", component: StepFour },
    { number: 5, title: "Review & Submit", component: StepFive }
  ];

  const progress = (currentStep / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep - 1].component;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-blue-900">
              <div className="h-8 w-8 bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold">America Innovates</span>
            </Link>
            
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Share Your Product Innovation Story
            </h1>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div 
                key={step.number} 
                className={`flex flex-col items-center ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.number}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <CurrentStepComponent 
              data={formData} 
              onUpdate={updateFormData}
              onNext={handleNext}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentStep === steps.length}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionWizard;
