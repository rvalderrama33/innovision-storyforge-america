
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface StepFourProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const StepFour = ({ data, onUpdate }: StepFourProps) => {
  const [formData, setFormData] = useState({
    headshot: data.headshot || null,
    productImages: data.productImages || [],
    logo: data.logo || null,
    lifestyleImages: data.lifestyleImages || [],
    packagingImages: data.packagingImages || []
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const uploadAreas = [
    {
      key: "headshot",
      title: "Professional Headshot *",
      description: "A clear, professional photo of yourself",
      required: true,
      multiple: false
    },
    {
      key: "productImages",
      title: "Product Images *",
      description: "High-quality photos of your product from multiple angles",
      required: true,
      multiple: true
    },
    {
      key: "lifestyleImages",
      title: "Lifestyle Photos",
      description: "Photos showing your product being used in real-life situations",
      required: false,
      multiple: true
    },
    {
      key: "packagingImages",
      title: "Packaging & Branding",
      description: "Photos of your product packaging, logos, or branding materials",
      required: false,
      multiple: true
    }
  ];

  const handleFileUpload = (key: string, files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    // In a real app, you'd upload these to a storage service
    console.log(`Uploading ${fileArray.length} file(s) for ${key}:`, fileArray);
    
    setFormData(prev => ({
      ...prev,
      [key]: key.includes("Images") ? fileArray : fileArray[0]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Product Visual Assets
        </h3>
        <p className="text-gray-600">
          Upload high-quality images that showcase your product and tell its story visually.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {uploadAreas.map((area) => (
          <Card key={area.key} className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label className="text-base font-medium text-gray-900">
                  {area.title}
                </Label>
                <p className="text-sm text-gray-600 mt-2 mb-4">
                  {area.description}
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple={area.multiple}
                  onChange={(e) => handleFileUpload(area.key, e.target.files)}
                  className="hidden"
                  id={area.key}
                />
                
                <label
                  htmlFor={area.key}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Choose {area.multiple ? "Files" : "File"}
                </label>
                
                {formData[area.key as keyof typeof formData] && (
                  <div className="mt-3 text-sm text-green-600">
                    ✓ {Array.isArray(formData[area.key as keyof typeof formData]) 
                      ? `${(formData[area.key as keyof typeof formData] as any[]).length} file(s) selected`
                      : "1 file selected"
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>📸 Image Guidelines:</strong><br />
          • High resolution (at least 1024px wide)<br />
          • Professional quality with good lighting<br />
          • Clean backgrounds work best for product shots<br />
          • Show your product in use for lifestyle photos<br />
          • Multiple angles help tell the complete story
        </p>
      </div>
    </div>
  );
};

export default StepFour;
