
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepTwoProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const StepTwo = ({ data, onUpdate }: StepTwoProps) => {
  const [formData, setFormData] = useState({
    productName: data.productName || "",
    description: data.description || "",
    problemSolved: data.problemSolved || "",
    stage: data.stage || "",
    category: data.category || ""
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your Consumer Product Innovation
        </h3>
        <p className="text-gray-600">
          Help us understand your product and how it improves people's daily lives.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">Name of Your Product *</Label>
        <Input
          id="productName"
          value={formData.productName}
          onChange={(e) => handleChange("productName", e.target.value)}
          placeholder="What do you call your product?"
          className="text-lg py-3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Product Category *</Label>
        <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
          <SelectTrigger className="text-lg py-3">
            <SelectValue placeholder="Select the category that best fits your product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="home-living">Home & Living</SelectItem>
            <SelectItem value="health-wellness">Health & Wellness</SelectItem>
            <SelectItem value="kitchen-food">Kitchen & Food</SelectItem>
            <SelectItem value="tech-accessories">Tech Accessories</SelectItem>
            <SelectItem value="outdoor-travel">Outdoor & Travel</SelectItem>
            <SelectItem value="kids-family">Kids & Family</SelectItem>
            <SelectItem value="beauty-personal">Beauty & Personal Care</SelectItem>
            <SelectItem value="automotive">Automotive</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Product Description and Purpose *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe your product - what is it, how does it work, and what makes it special for consumers?"
          className="min-h-32 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problemSolved">What Consumer Problem Does It Solve? *</Label>
        <Textarea
          id="problemSolved"
          value={formData.problemSolved}
          onChange={(e) => handleChange("problemSolved", e.target.value)}
          placeholder="Explain the everyday problem or frustration your product addresses for consumers..."
          className="min-h-32 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage">Current Stage *</Label>
        <Select value={formData.stage} onValueChange={(value) => handleChange("stage", value)}>
          <SelectTrigger className="text-lg py-3">
            <SelectValue placeholder="Select the current stage of your product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concept">Concept/Idea Stage</SelectItem>
            <SelectItem value="prototype">Prototype Development</SelectItem>
            <SelectItem value="testing">Consumer Testing</SelectItem>
            <SelectItem value="production">In Production</SelectItem>
            <SelectItem value="market">Available for Purchase</SelectItem>
            <SelectItem value="scaling">Scaling & Expanding</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StepTwo;
