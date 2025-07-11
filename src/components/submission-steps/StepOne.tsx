
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  // Use useCallback to prevent onUpdate from changing on every render
  const stableOnUpdate = useCallback(onUpdate, [onUpdate]);

  const validateForm = useCallback(() => {
    const requiredFields = ['fullName', 'email', 'phoneNumber', 'city', 'state', 'background'];
    const isValid = requiredFields.every(field => 
      formData[field as keyof typeof formData]?.trim() !== ""
    );
    onValidationChange(isValid);
    return isValid;
  }, [formData, onValidationChange]);

  useEffect(() => {
    stableOnUpdate(formData);
    validateForm();
  }, [formData, stableOnUpdate, validateForm]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Tell us about yourself
        </h3>
        <p className="text-gray-600">
          We'd love to know more about the innovator behind the idea.
        </p>
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

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="you@example.com"
            className="text-lg py-3"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            placeholder="(555) 123-4567"
            className="text-lg py-3"
          />
        </div>

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
