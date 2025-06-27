
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
    stage: data.stage || ""
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
          Your Innovation Details
        </h3>
        <p className="text-gray-600">
          Help us understand what you've created and its impact.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">Name of Your Product/Invention *</Label>
        <Input
          id="productName"
          value={formData.productName}
          onChange={(e) => handleChange("productName", e.target.value)}
          placeholder="What do you call your innovation?"
          className="text-lg py-3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description and Purpose *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe your innovation - what is it, how does it work, and what makes it unique?"
          className="min-h-32 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problemSolved">What Problem Does It Solve? *</Label>
        <Textarea
          id="problemSolved"
          value={formData.problemSolved}
          onChange={(e) => handleChange("problemSolved", e.target.value)}
          placeholder="Explain the specific problem or challenge your innovation addresses..."
          className="min-h-32 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage">Current Stage *</Label>
        <Select value={formData.stage} onValueChange={(value) => handleChange("stage", value)}>
          <SelectTrigger className="text-lg py-3">
            <SelectValue placeholder="Select the current stage of your innovation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concept">Concept/Idea Stage</SelectItem>
            <SelectItem value="prototype">Prototype Development</SelectItem>
            <SelectItem value="testing">Testing & Validation</SelectItem>
            <SelectItem value="production">In Production</SelectItem>
            <SelectItem value="market">On the Market</SelectItem>
            <SelectItem value="scaling">Scaling Up</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StepTwo;
