
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedInput } from "@/components/ui/enhanced-input";

interface StepOneProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onValidationChange: (isValid: boolean) => void;
}

const StepOne = ({ data, onUpdate, onValidationChange }: StepOneProps) => {
  const [formData, setFormData] = useState({
    fullName: data.fullName || "",
    city: data.city || "",
    state: data.state || "",
    email: data.email || "",
    phoneNumber: data.phoneNumber || "",
    background: data.background || "",
    website: data.website || "",
    socialMedia: data.socialMedia || ""
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Sync local state when parent data changes (e.g., after restoring from localStorage)
    const next = {
      fullName: data.fullName || "",
      city: data.city || "",
      state: data.state || "",
      email: data.email || "",
      phoneNumber: data.phoneNumber || "",
      background: data.background || "",
      website: data.website || "",
      socialMedia: data.socialMedia || ""
    };

    const isDifferent = Object.keys(next).some(
      (k) => (next as any)[k] !== (formData as any)[k]
    );

    if (isDifferent) {
      setIsSyncing(true);
      setFormData(next);
      // Defer turning off syncing to next tick to avoid echo updates
      setTimeout(() => setIsSyncing(false), 0);
    }
  }, [data]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const requiredFields = ['fullName', 'email', 'phoneNumber', 'city', 'state', 'background'];
    const hasRequiredFields = requiredFields.every(field => 
      formData[field as keyof typeof formData]?.trim() !== ""
    );
    const hasNoValidationErrors = Object.keys(validationErrors).length === 0;
    const isValid = hasRequiredFields && hasNoValidationErrors;
    onValidationChange(isValid);
    return isValid;
  }, [formData, validationErrors, onValidationChange]);

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
    // Only update parent when not syncing from parent
    if (!isSyncing) {
      onUpdate(formData);
      validateForm();
    }
  }, [formData, onUpdate, validateForm, isSyncing]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Tell us about yourself
        </h3>
        <p className="text-gray-600 mb-3">
          We'd love to know more about the innovator behind the idea.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">
            💡 Be brief and informal. We will use your answers to write a compelling story about you and your journey.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="Your full name"
            className="text-lg py-3"
          />
        </div>

        <EnhancedInput
          id="email"
          label="Email Address"
          type="email"
          validation="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onValidationChange={(isValid, error) => handleValidationChange("email", isValid, error)}
          placeholder="you@example.com"
          className="text-lg py-3"
          required
        />

        <EnhancedInput
          id="phoneNumber"
          label="Phone Number"
          type="tel"
          validation="phone"
          value={formData.phoneNumber}
          onChange={(e) => handleChange("phoneNumber", e.target.value)}
          onValidationChange={(isValid, error) => handleValidationChange("phoneNumber", isValid, error)}
          placeholder="(555) 123-4567"
          className="text-lg py-3"
          required
        />

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Your city"
            className="text-lg py-3"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="Your state"
            className="text-lg py-3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="background">Personal Background *</Label>
        <Textarea
          id="background"
          value={formData.background}
          onChange={(e) => handleChange("background", e.target.value)}
          placeholder="Tell us about your background, experience, or what drives you as an innovator..."
          className="min-h-32 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website URL (Optional)</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => handleChange("website", e.target.value)}
          placeholder="https://yourwebsite.com"
          className="text-lg py-3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="socialMedia">Social Media Handles (Optional)</Label>
        <Input
          id="socialMedia"
          value={formData.socialMedia}
          onChange={(e) => handleChange("socialMedia", e.target.value)}
          placeholder="@username on Twitter, LinkedIn, etc."
          className="text-lg py-3"
        />
      </div>
    </div>
  );
};

export default StepOne;
