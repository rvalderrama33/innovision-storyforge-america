
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StepFourProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onValidationChange: (isValid: boolean) => void;
}

const StepFour = ({ data, onUpdate, onValidationChange }: StepFourProps) => {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    headshot: data.headshot || null,
    productImages: data.productImages || [],
    logo: data.logo || null,
    lifestyleImages: data.lifestyleImages || [],
    packagingImages: data.packagingImages || [],
    imageUrls: data.imageUrls || []
  });

  const validateForm = () => {
    // Required: headshot and productImages
    const hasHeadshot = formData.headshot !== null;
    const hasProductImages = Array.isArray(formData.productImages) && formData.productImages.length > 0;
    const isValid = hasHeadshot && hasProductImages;
    onValidationChange(isValid);
    return isValid;
  };

  useEffect(() => {
    onUpdate(formData);
    validateForm();
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

  const handleFileUpload = async (key: string, files: FileList | null) => {
    if (!files) return;
    
    // Check if we would exceed the 3 image limit for multi-image categories
    const currentImages = Array.isArray(formData[key as keyof typeof formData]) 
      ? (formData[key as keyof typeof formData] as any[]) 
      : [];
    const newFileCount = Array.from(files).length;
    const totalCount = currentImages.length + newFileCount;
    
    if (key.includes("Images") && totalCount > 3) {
      toast({
        title: "Upload limit exceeded",
        description: `Maximum 3 images allowed per category. You can upload ${Math.max(0, 3 - currentImages.length)} more image(s).`,
        variant: "destructive",
      });
      return;
    }
    
    setUploadingFiles(prev => ({ ...prev, [key]: true }));
    
    try {
      const fileArray = Array.from(files);
      const uploadedUrls: string[] = [];
      
      for (const file of fileArray) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${key}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('submission-images')
          .upload(filePath, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('submission-images')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }
      
      setFormData(prev => ({
        ...prev,
        [key]: key.includes("Images") ? [...currentImages, ...fileArray] : fileArray[0],
        imageUrls: [...prev.imageUrls, ...uploadedUrls]
      }));
      
      toast({
        title: "Upload successful",
        description: `${fileArray.length} image(s) uploaded successfully.`,
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [key]: false }));
    }
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

      {/* Professional headshot promotion */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            A professional headshot will make all the difference
          </h4>
          <p className="text-gray-700 mb-4">
            We want your headshot to be spectacular. Let AI create professional headshots for you in minutes.
          </p>
          <Button
            onClick={() => window.open('https://www.headshot.kiwi/?ref=ricardo', '_blank')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <span>Get Professional Headshots</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
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
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploadingFiles[area.key] ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingFiles[area.key] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    `Choose ${area.multiple ? "Files" : "File"}`
                  )}
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
          • Multiple angles help tell the complete story<br />
          • Maximum 3 images per category (except headshot)
        </p>
      </div>
    </div>
  );
};

export default StepFour;
