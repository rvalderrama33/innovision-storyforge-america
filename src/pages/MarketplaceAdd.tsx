import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { Upload, X, Plus, Sparkles } from "lucide-react";

const categories = [
  "Electronics",
  "Home & Garden",
  "Health & Beauty",
  "Fashion",
  "Sports & Outdoors",
  "Automotive",
  "Food & Beverage",
  "Arts & Crafts",
  "Books & Media",
  "Other"
];

const MarketplaceAdd = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useSEO({
    title: "Add Product | Marketplace",
    description: "Add your innovative product to the America Innovates Marketplace.",
    url: "https://americainnovates.us/marketplace/add"
  });

  // Restrict access to admins only for now
  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    category: "",
    status: "draft",
    featured: false,
    stock_quantity: "",
    images: [] as string[],
    specifications: {},
    shipping_info: {},
    tags: [] as string[],
    sales_links: [] as string[]
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [newSalesLink, setNewSalesLink] = useState("");
  const [newTag, setNewTag] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedImages = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `marketplace/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('submission-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('submission-images')
          .getPublicUrl(filePath);

        uploadedImages.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));

      toast({
        title: "Success",
        description: `${uploadedImages.length} image(s) uploaded successfully!`
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addSalesLink = () => {
    if (newSalesLink.trim()) {
      setFormData(prev => ({
        ...prev,
        sales_links: [...prev.sales_links, newSalesLink.trim()]
      }));
      setNewSalesLink("");
    }
  };

  const removeSalesLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sales_links: prev.sales_links.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const generateContentWithAI = async () => {
    if (formData.sales_links.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one sales link first",
        variant: "destructive"
      });
      return;
    }

    setGeneratingContent(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName: formData.name,
          basicDescription: formData.description,
          category: formData.category,
          salesLinks: formData.sales_links,
          images: formData.images
        }
      });

      if (error) throw error;

      if (data.success) {
        const content = data.content;
        
        // Update form data with AI-generated content
        setFormData(prev => ({
          ...prev,
          name: content.productName || prev.name, // Use AI-generated name if available
          description: content.description,
          tags: [...new Set([...prev.tags, ...content.tags])],
          specifications: content.specifications
        }));

        // Add scraped images to the existing images
        if (content.scrapedImages && content.scrapedImages.length > 0) {
          console.log('Scraped images found:', content.scrapedImages);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...content.scrapedImages]
          }));
          
          toast({
            title: "Success",
            description: `AI content generated and added ${content.scrapedImages.length} images from sales links!`
          });
        } else {
          console.log('No scraped images found in response:', content);
          console.log('Full response content:', JSON.stringify(content, null, 2));
          toast({
            title: "Success",
            description: "AI-enhanced content generated successfully!"
          });
        }
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI content",
        variant: "destructive"
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(formData.name);
      const priceInCents = Math.round(parseFloat(formData.price) * 100);

      const { data, error } = await supabase
        .from('marketplace_products')
        .insert({
          vendor_id: user.id,
          name: formData.name,
          description: formData.description,
          price: priceInCents,
          currency: formData.currency,
          category: formData.category,
          status: formData.status,
          featured: formData.featured,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          slug,
          images: formData.images,
          specifications: formData.specifications,
          shipping_info: formData.shipping_info,
          tags: formData.tags,
          sales_links: formData.sales_links
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully!"
      });

      navigate('/marketplace/manage');
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Add New Product</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Content Generation - MOVED TO TOP */}
              <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <Label className="text-sm font-medium">🚀 Start Here: AI-Enhanced Content</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Start by adding sales links below, then generate product name, description, images, tags, and specifications automatically using AI.
                  {formData.sales_links.length > 0 
                    ? ` Ready to analyze ${formData.sales_links.length} sales link(s) and extract product information!`
                    : " Add sales links first to enable AI content generation."
                  }
                </p>
                <Button
                  type="button"
                  onClick={generateContentWithAI}
                  disabled={generatingContent || formData.sales_links.length === 0}
                  variant="outline"
                  size="sm"
                >
                  {generatingContent ? "Generating..." : "Generate AI Content"}
                </Button>
              </div>

              {/* Sales Links - MOVED TO SECOND */}
              <div>
                <Label className="text-sm font-medium">Where is this product currently sold? 🔗</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Add links to websites where this product is sold. AI will analyze these to generate all product details.
                </p>
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newSalesLink}
                      onChange={(e) => setNewSalesLink(e.target.value)}
                      placeholder="https://example.com/product"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSalesLink())}
                    />
                    <Button type="button" onClick={addSalesLink} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.sales_links.length > 0 && (
                    <div className="space-y-2">
                      {formData.sales_links.map((link, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted rounded-lg p-3">
                          <span className="text-sm truncate flex-1 mr-2">{link}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSalesLink(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name (or generate with AI)"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product (or generate with AI)"
                  rows={4}
                  required
                />
              </div>

              {/* Product Images */}
              <div>
                <Label className="text-sm font-medium">Product Images</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Upload images or let AI extract them from your sales links
                </p>
                <div className="mt-2 space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploadingImages ? "Uploading..." : "Click to upload images or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, JPEG up to 10MB each
                      </p>
                    </label>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Enter a tag (or generate with AI)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stock_quantity" className="text-sm font-medium">
                    Stock Quantity
                  </Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured" className="text-sm font-medium">
                  Featured Product
                </Label>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/marketplace')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding Product..." : "Add Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketplaceAdd;