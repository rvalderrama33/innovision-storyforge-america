
import { useState, useCallback, useRef } from "react";
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
import StepSix from "@/components/submission-steps/StepSix";

interface FormData {
  full_name?: string;
  recommendations?: Array<{
    name: string;
    email: string;
    reason: string;
  }>;
  [key: string]: any;
}

const SubmissionWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [stepValidations, setStepValidations] = useState<Record<number, boolean>>({});
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { number: 1, title: "About You", component: StepOne },
    { number: 2, title: "Your Innovation", component: StepTwo },
    { number: 3, title: "Your Journey", component: StepThree },
    { number: 4, title: "Supporting Images", component: StepFour },
    { number: 5, title: "Recommendations", component: StepFive },
    { number: 6, title: "Review & Submit", component: StepSix }
  ];

  const progress = (currentStep / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep - 1].component;

  const handleNext = async () => {
    const isCurrentStepValid = stepValidations[currentStep];
    if (!isCurrentStepValid) {
      // Show validation error - you could add a toast or visual feedback here
      return;
    }
    
    // Send recommendation emails when moving from step 5 to step 6
    if (currentStep === 5 && formData.recommendations) {
      await sendRecommendationEmails();
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const sendRecommendationEmails = async () => {
    const { recommendations } = formData;
    const recommenderName = formData.fullName || 'Someone';
    
    if (recommendations && Array.isArray(recommendations)) {
      for (const rec of recommendations) {
        if (rec.name && rec.email) {
          try {
            const { supabase } = await import("@/integrations/supabase/client");
            await supabase.functions.invoke('send-email', {
              body: {
                type: 'recommendation',
                to: rec.email,
                name: rec.name,
                recommenderName: recommenderName
              }
            });
          } catch (error) {
            console.error('Error sending recommendation email:', error);
          }
        }
      }
    }
  };

  const deleteDraft = async () => {
    if (savedDraftId) {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase
          .from('submissions')
          .delete()
          .eq('id', savedDraftId)
          .eq('status', 'draft');
        setSavedDraftId(null);
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const debouncedSaveDraft = useCallback((data: any) => {
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }
    draftTimeoutRef.current = setTimeout(() => {
      saveDraft(data);
    }, 2000); // Wait 2 seconds before saving
  }, []);

  const updateFormData = (stepData: any) => {
    const newData = { ...formData, ...stepData };
    setFormData(newData);
    // Debounced auto-save to prevent excessive database calls
    debouncedSaveDraft(newData);
  };

  const saveDraft = async (data: any) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      if (savedDraftId) {
        // Update existing draft
        await supabase
          .from('submissions')
          .update({
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
            status: 'draft'
          })
          .eq('id', savedDraftId);
      } else {
        // Create new draft
        const { data: newDraft, error } = await supabase
          .from('submissions')
          .insert({
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
            status: 'draft'
          })
          .select()
          .single();
        
        if (!error && newDraft) {
          setSavedDraftId(newDraft.id);
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleValidationChange = (stepNumber: number, isValid: boolean) => {
    setStepValidations(prev => ({ ...prev, [stepNumber]: isValid }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-blue-900">
              {/* Removed AI America Innovates branding per request */}
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
              Share Your Product Innovation or Entrepreneurial Story
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
              onValidationChange={(isValid: boolean) => handleValidationChange(currentStep, isValid)}
              {...(currentStep === 6 && { onSubmissionComplete: deleteDraft })}
            />
          </CardContent>
        </Card>

        {/* Save Draft Notice */}
        {savedDraftId && (
          <div className="text-center mb-4">
            <p className="text-sm text-green-600">
              ✓ Your progress is automatically saved. You can return to complete this form later.
            </p>
          </div>
        )}

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

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => saveDraft(formData)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Save Draft
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length || !stepValidations[currentStep]}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionWizard;
