import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useParams } from "react-router-dom";
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
import { Upload, X, Plus, Sparkles, Star, ArrowLeft, Video } from "lucide-react";

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

const MarketplaceEdit = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const isMarketplaceLive = false;

  useSEO({
    title: "Edit Product | Marketplace",
    description: "Edit your marketplace product details.",
    url: `https://americainnovates.us/marketplace/edit/${id}`
  });

  if (!isMarketplaceLive && !isAdmin) {
    return <Navigate to="/" />;
  }

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
    primaryImageIndex: 0,
    specifications: {},
    shipping_info: {},
    tags: [] as string[],
    sales_links: [] as string[],
    video_urls: [] as string[] // Add video URLs
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [newSalesLink, setNewSalesLink] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);

  // Load existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('id', id)
          .eq('vendor_id', user.id) // Ensure user can only edit their own products
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Error",
            description: "Product not found or you don't have permission to edit it.",
            variant: "destructive"
          });
          navigate('/marketplace/manage');
          return;
        }

        // Populate form with existing data
        setFormData({
          name: data.name || "",
          description: data.description || "",
          price: (data.price / 100).toString(),
          currency: data.currency || "USD",
          category: data.category || "",
          status: data.status || "draft",
          featured: data.featured || false,
          stock_quantity: data.stock_quantity?.toString() || "",
          images: data.images || [],
          primaryImageIndex: data.primary_image_index || 0, // Load from database
          specifications: data.specifications || {},
          shipping_info: data.shipping_info || {},
          tags: data.tags || [],
          sales_links: data.sales_links || [],
          video_urls: data.video_urls || [] // Load video URLs from database
        });
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load product data.",
          variant: "destructive"
        });
        navigate('/marketplace/manage');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProduct();
  }, [id, user.id, navigate, toast]);

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
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      let newPrimaryIndex = prev.primaryImageIndex;
      if (index === prev.primaryImageIndex) {
        newPrimaryIndex = 0;
      } else if (index < prev.primaryImageIndex) {
        newPrimaryIndex = prev.primaryImageIndex - 1;
      }
      
      return {
        ...prev,
        images: newImages,
        primaryImageIndex: newImages.length > 0 ? Math.min(newPrimaryIndex, newImages.length - 1) : 0
      };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      primaryImageIndex: index
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

  const addVideoUrl = () => {
    if (newVideoUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        video_urls: [...prev.video_urls, newVideoUrl.trim()]
      }));
      setNewVideoUrl("");
    }
  };

  const removeVideoUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      video_urls: prev.video_urls.filter((_, i) => i !== index)
    }));
  };

  const isValidVideoUrl = (url: string) => {
    const patterns = [
      /youtube\.com\/watch\?v=/,
      /youtu\.be\//,
      /youtube\.com\/embed\//,
      /vimeo\.com\//,
      /\.(mp4|webm|ogg|mov|avi)$/i
    ];
    return patterns.some(pattern => pattern.test(url));
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
        
        setFormData(prev => ({
          ...prev,
          name: content.productName || prev.name,
          description: content.description,
          tags: [...new Set([...prev.tags, ...content.tags])],
          specifications: content.specifications
        }));

        if (content.scrapedImages && content.scrapedImages.length > 0) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...content.scrapedImages]
          }));
          
          toast({
            title: "Success",
            description: `AI content updated and added ${content.scrapedImages.length} images!`
          });
        } else {
          toast({
            title: "Success",
            description: "AI-enhanced content updated successfully!"
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
      const priceInCents = Math.round(parseFloat(formData.price) * 100);

      const { error } = await supabase
        .from('marketplace_products')
        .update({
          name: formData.name,
          description: formData.description,
          price: priceInCents,
          currency: formData.currency,
          category: formData.category,
          status: formData.status,
          featured: formData.featured,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          images: formData.images,
          primary_image_index: formData.primaryImageIndex, // Save primary image index
          specifications: formData.specifications,
          shipping_info: formData.shipping_info,
          tags: formData.tags,
          sales_links: formData.sales_links,
          video_urls: formData.video_urls // Save video URLs
        })
        .eq('id', id)
        .eq('vendor_id', user.id); // Ensure user can only update their own products

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully!"
      });

      navigate('/marketplace/manage');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/marketplace/manage')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Product</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Content Generation Section */}
              <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <Label className="text-sm font-medium">🚀 Update with AI-Enhanced Content</Label>
                </div>
                
                {/* Sales Links Section */}
                <div className="mb-4">
                  <Label className="text-sm font-medium">Where is this product currently sold? 🔗</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Add or update sales links. AI will analyze these to enhance product details.
                  </p>
                  <div className="space-y-3">
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

                {/* AI Generation Button */}
                <div className="pt-3 border-t border-primary/10">
                  <p className="text-xs text-muted-foreground mb-3">
                    {formData.sales_links.length > 0 
                      ? `Ready to analyze ${formData.sales_links.length} sales link(s) and update product information!`
                      : "Add sales links above to enable AI content generation."
                    }
                  </p>
                  <Button
                    type="button"
                    onClick={generateContentWithAI}
                    disabled={generatingContent || formData.sales_links.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    {generatingContent ? "Updating..." : "Update with AI Content"}
                  </Button>
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
                  placeholder="Enter product name"
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
                  placeholder="Describe your product"
                  rows={4}
                  required
                />
              </div>

              {/* Product Images */}
              <div>
                <Label className="text-sm font-medium">Product Images</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Upload new images or manage existing ones
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
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Product Images ({formData.images.length})</p>
                        <p className="text-xs text-muted-foreground">Click star to set as primary image</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className={`w-full h-24 object-cover rounded-lg border-2 transition-colors ${
                                index === formData.primaryImageIndex 
                                  ? 'border-primary' 
                                  : 'border-muted'
                              }`}
                            />
                            
                            {/* Primary Image Star */}
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className={`absolute top-1 left-1 p-1 rounded-full transition-all ${
                                index === formData.primaryImageIndex
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                              }`}
                              title="Set as primary image"
                            >
                              <Star className="h-3 w-3" fill={index === formData.primaryImageIndex ? "currentColor" : "none"} />
                            </button>
                            
                            {/* Primary Label */}
                            {index === formData.primaryImageIndex && (
                              <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                                Primary
                              </div>
                            )}
                            
                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
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
                      placeholder="Enter a tag"
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

              {/* Video URLs */}
              <div>
                <Label className="text-sm font-medium">Product Videos 🎬</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Add YouTube, Vimeo, or direct video links. AI can also extract these from sales links.
                </p>
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVideoUrl())}
                    />
                    <Button type="button" onClick={addVideoUrl} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.video_urls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Product Videos ({formData.video_urls.length})</p>
                      {formData.video_urls.map((videoUrl, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">
                              {videoUrl.includes('youtube') ? '📺 YouTube' : 
                               videoUrl.includes('vimeo') ? '🎞️ Vimeo' : 
                               '🎬 Video'}: {videoUrl}
                            </span>
                            {!isValidVideoUrl(videoUrl) && (
                              <Badge variant="destructive" className="text-xs">Invalid URL</Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVideoUrl(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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
                <Button type="button" variant="outline" onClick={() => navigate('/marketplace/manage')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating Product..." : "Update Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketplaceEdit;