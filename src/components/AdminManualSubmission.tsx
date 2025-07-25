import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { sanitizeText, validateUrl, adminActionRateLimiter } from '@/lib/inputValidation';

interface ManualSubmissionForm {
  personName: string;
  description: string;
  sourceLinks: string[];
  imageUrls: string[];
}

const AdminManualSubmission = ({ onSubmissionCreated }: { onSubmissionCreated: () => void }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ManualSubmissionForm>({
    personName: '',
    description: '',
    sourceLinks: [''],
    imageUrls: ['']
  });

  const addSourceLink = () => {
    if (formData.sourceLinks.length < 3) {
      setFormData(prev => ({
        ...prev,
        sourceLinks: [...prev.sourceLinks, '']
      }));
    }
  };

  const removeSourceLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sourceLinks: prev.sourceLinks.filter((_, i) => i !== index)
    }));
  };

  const updateSourceLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      sourceLinks: prev.sourceLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const addImageUrl = () => {
    if (formData.imageUrls.length < 3) {
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, '']
      }));
    }
  };

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const updateImageUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.map((url, i) => i === index ? value : url)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const rateLimitKey = 'admin-manual-submission';
    const rateLimitCheck = adminActionRateLimiter.checkLimit(rateLimitKey, 10, 60000); // 10 attempts per minute
    
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Rate Limited",
        description: "Too many submission attempts. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.personName.trim() || !formData.description.trim()) {
      toast({
        title: "Error",
        description: "Person name and description are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize and validate inputs
      const sanitizedPersonName = sanitizeText(formData.personName);
      const sanitizedDescription = sanitizeText(formData.description);
      
      // Filter and validate links and URLs
      const validSourceLinks = formData.sourceLinks
        .filter(link => link.trim() !== '')
        .map(link => {
          const validation = validateUrl(link);
          if (!validation.isValid) {
            throw new Error(`Invalid source URL: ${validation.error}`);
          }
          return link.trim();
        });
        
      const validImageUrls = formData.imageUrls
        .filter(url => url.trim() !== '')
        .map(url => {
          const validation = validateUrl(url);
          if (!validation.isValid) {
            throw new Error(`Invalid image URL: ${validation.error}`);
          }
          return url.trim();
        });

      // Create the submission with sanitized data
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          full_name: sanitizedPersonName,
          product_name: `Story about ${sanitizedPersonName}`,
          description: sanitizedDescription,
          source_links: validSourceLinks.length > 0 ? validSourceLinks : null,
          image_urls: validImageUrls.length > 0 ? validImageUrls : null,
          is_manual_submission: true,
          status: 'pending',
          email: 'noreply@americainnovates.us'
        })
        .select()
        .single();

      if (error) throw error;

      // Generate AI article
      const { data: articleData, error: articleError } = await supabase.functions.invoke('generate-article', {
        body: {
          submissionId: data.id,
          isManualSubmission: true,
          personName: sanitizedPersonName,
          description: sanitizedDescription,
          sourceLinks: validSourceLinks
        }
      });

      if (articleError) {
        console.error('Article generation error:', articleError);
        throw new Error(`Failed to generate article: ${articleError.message}`);
      }

      console.log('Article generated successfully:', articleData);

      toast({
        title: "Success",
        description: "Manual submission created and article generation started!",
      });

      // Reset form
      setFormData({
        personName: '',
        description: '',
        sourceLinks: [''],
        imageUrls: ['']
      });

      onSubmissionCreated();
    } catch (error) {
      console.error('Error creating manual submission:', error);
      toast({
        title: "Error",
        description: "Failed to create manual submission",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Manual Article Submission</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="personName">Person Name *</Label>
            <Input
              id="personName"
              value={formData.personName}
              onChange={(e) => setFormData(prev => ({ ...prev, personName: e.target.value }))}
              placeholder="Enter the person's name to highlight in the article"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description/Story *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter the story or information about this person"
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Source Links (up to 3)</Label>
            {formData.sourceLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={link}
                  onChange={(e) => updateSourceLink(index, e.target.value)}
                  placeholder={`Source link ${index + 1}`}
                />
                {formData.sourceLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSourceLink(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {formData.sourceLinks.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSourceLink}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Source Link
              </Button>
            )}
          </div>

          <div>
            <Label>Image URLs (up to 3)</Label>
            {formData.imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={url}
                  onChange={(e) => updateImageUrl(index, e.target.value)}
                  placeholder={`Image URL ${index + 1}`}
                />
                {formData.imageUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImageUrl(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {formData.imageUrls.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImageUrl}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image URL
              </Button>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Article...
              </>
            ) : (
              'Create Manual Article'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminManualSubmission;