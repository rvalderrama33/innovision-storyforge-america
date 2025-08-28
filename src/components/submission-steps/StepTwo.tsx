
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepTwoProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onValidationChange: (isValid: boolean) => void;
}

const StepTwo = ({ data, onUpdate, onValidationChange }: StepTwoProps) => {
  const [formData, setFormData] = useState({
    productName: data.productName || "",
    description: data.description || "",
    problemSolved: data.problemSolved || "",
    stage: data.stage || "",
    category: data.category || ""
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Sync when parent data changes (restored draft)
    const next = {
      productName: data.productName || "",
      description: data.description || "",
      problemSolved: data.problemSolved || "",
      stage: data.stage || "",
      category: data.category || ""
    };

    const isDifferent = Object.keys(next).some(
      (k) => (next as any)[k] !== (formData as any)[k]
    );

    if (isDifferent) {
      setIsSyncing(true);
      setFormData(next);
      setTimeout(() => setIsSyncing(false), 0);
    }
  }, [data]);

  const validateForm = () => {
    const requiredFields = ['productName', 'category', 'description', 'problemSolved', 'stage'];
    const isValid = requiredFields.every(field => 
      formData[field as keyof typeof formData]?.trim() !== ""
    );
    onValidationChange(isValid);
    return isValid;
  };

  useEffect(() => {
    // Only update parent when not syncing from parent
    if (!isSyncing) {
      onUpdate(formData);
      validateForm();
    }
  }, [formData, onUpdate, isSyncing]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your Innovation or Business
        </h3>
        <p className="text-gray-600">
          Tell us about your product, service, or entrepreneurial venture that's making an impact.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">Name of Your Innovation/Business *</Label>
        <Input
          id="productName"
          value={formData.productName}
          onChange={(e) => handleChange("productName", e.target.value)}
          placeholder="What do you call your product, service, or business?"
          className="text-lg py-3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Industry/Category *</Label>
        <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
          <SelectTrigger className="text-lg py-3">
            <SelectValue placeholder="Select the category that best fits your innovation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">Technology & Software</SelectItem>
            <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
            <SelectItem value="sustainability">Sustainability & Environment</SelectItem>
            <SelectItem value="fintech">Financial Technology</SelectItem>
            <SelectItem value="education">Education & Learning</SelectItem>
            <SelectItem value="consumer-goods">Consumer Products</SelectItem>
            <SelectItem value="food-beverage">Food & Beverage</SelectItem>
            <SelectItem value="manufacturing">Manufacturing & Industrial</SelectItem>
            <SelectItem value="services">Professional Services</SelectItem>
            <SelectItem value="social-impact">Social Impact</SelectItem>
            <SelectItem value="retail">Retail & E-commerce</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description and Purpose *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe your innovation - what is it, how does it work, and what makes it unique or impactful?"
          className="min-h-32 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problemSolved">What Problem Does It Solve? *</Label>
        <Textarea
          id="problemSolved"
          value={formData.problemSolved}
          onChange={(e) => handleChange("problemSolved", e.target.value)}
          placeholder="Explain the problem, challenge, or need your innovation addresses in the market or society..."
          className="min-h-32 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage">Current Stage *</Label>
        <Select value={formData.stage} onValueChange={(value) => handleChange("stage", value)}>
          <SelectTrigger className="text-lg py-3">
            <SelectValue placeholder="Select the current stage of your innovation/business" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concept">Concept/Idea Stage</SelectItem>
            <SelectItem value="prototype">Prototype/MVP Development</SelectItem>
            <SelectItem value="testing">Testing/Validation</SelectItem>
            <SelectItem value="launch">Recently Launched</SelectItem>
            <SelectItem value="growth">Growing/Expanding</SelectItem>
            <SelectItem value="established">Established Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StepTwo;
