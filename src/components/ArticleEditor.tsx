import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, X, ImageIcon, Star, User, Building, Upload, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BannerImageSettings {
  url: string;
  position: string;
  size: string;
}

interface ArticleData {
  id: string;
  full_name: string;
  product_name: string;
  description: string;
  category: string;
  background: string;
  website: string;
  social_media: string;
  problem_solved: string;
  stage: string;
  idea_origin: string;
  biggest_challenge: string;
  proudest_moment: string;
  inspiration: string;
  motivation: string;
  generated_article: string;
  image_urls: string[];
  source_links: string[];
  featured: boolean;
  status: string;
  email: string;
  city: string;
  state: string;
  banner_image?: string | BannerImageSettings;
  headshot_image?: string;
  logo_image?: string;
}

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newSourceLink, setNewSourceLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const categories = [
    'Technology', 'Health & Wellness', 'Food & Beverage', 'Fashion', 
    'Home & Garden', 'Sports & Fitness', 'Beauty', 'Education', 
    'Entertainment', 'Business', 'Other'
  ];

  const stages = [
    'Idea Stage', 'Prototype', 'Early Development', 'Beta Testing', 
    'Market Ready', 'Launched', 'Scaling', 'Established'
  ];

  const bannerPositions = [
    { value: 'center', label: 'Center' },
    { value: 'center top', label: 'Top & Center' },
    { value: 'center bottom', label: 'Center & Bottom' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ];

  const bannerSizes = [
    { value: 'cover', label: 'Cover (Fill)' },
    { value: 'contain', label: 'Contain (Fit)' },
    { value: 'auto', label: 'Original Size' },
    { value: '150%', label: 'Large (150%)' },
    { value: '125%', label: 'Medium Large (125%)' },
    { value: '75%', label: 'Small (75%)' },
    { value: '50%', label: 'Extra Small (50%)' }
  ];

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) {
      return;
    }
    
    // If not admin, redirect to homepage
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    // If we have an ID and user is admin, fetch the article
    if (id) {
      fetchArticle();
    }
  }, [id, isAdmin, authLoading, navigate]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Parse banner image if it exists as JSON string
      const parsedData = { ...data } as ArticleData;
      try {
        if (data.banner_image && typeof data.banner_image === 'string') {
          try {
            const parsed = JSON.parse(data.banner_image);
            if (typeof parsed === 'object' && parsed.url) {
              parsedData.banner_image = parsed as BannerImageSettings;
            } else {
              // If it's just a string URL, keep as string
              parsedData.banner_image = data.banner_image;
            }
          } catch (e) {
            // If parsing fails, keep as string URL
            parsedData.banner_image = data.banner_image;
          }
        }
      } catch (e) {
        // If parsing fails, keep as string URL
        if (data.banner_image) {
          parsedData.banner_image = data.banner_image;
        }
      }
      
      setArticle(parsedData);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: "Error",
        description: "Failed to fetch article data",
        variant: "destructive",
      });
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (article) {
      setArticle({ ...article, [field]: value });
    }
  };

  const handleSpecialImageChange = (imageType: 'banner_image' | 'headshot_image' | 'logo_image', url: string) => {
    if (!article) return;

    if (imageType === 'banner_image') {
      const currentBanner = typeof article.banner_image === 'object' 
        ? article.banner_image as BannerImageSettings 
        : null;
      
      const newBannerSettings: BannerImageSettings = {
        url,
        position: currentBanner?.position || 'center',
        size: currentBanner?.size || 'cover'
      };
      
      setArticle({
        ...article,
        banner_image: newBannerSettings
      });
    } else {
      setArticle({ ...article, [imageType]: url });
    }
  };

  const handleBannerSettingChange = (setting: 'position' | 'size', value: string) => {
    if (!article) return;
    
    const currentBanner = typeof article.banner_image === 'object' 
      ? article.banner_image as BannerImageSettings 
      : { url: '', position: 'center', size: 'cover' };
    
    const newBannerSettings: BannerImageSettings = {
      url: currentBanner?.url || '',
      position: setting === 'position' ? value : (currentBanner?.position || 'center'),
      size: setting === 'size' ? value : (currentBanner?.size || 'cover')
    };
    
    setArticle({
      ...article,
      banner_image: newBannerSettings
    });
  };

  const addImageUrl = () => {
    if (newImageUrl.trim() && article) {
      setArticle({
        ...article,
        image_urls: [...(article.image_urls || []), newImageUrl.trim()]
      });
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (index: number) => {
    if (article) {
      const newUrls = article.image_urls.filter((_, i) => i !== index);
      setArticle({ ...article, image_urls: newUrls });
    }
  };

  const addSourceLink = () => {
    if (newSourceLink.trim() && article) {
      setArticle({
        ...article,
        source_links: [...(article.source_links || []), newSourceLink.trim()]
      });
      setNewSourceLink('');
    }
  };

  const removeSourceLink = (index: number) => {
    if (article) {
      const newLinks = article.source_links.filter((_, i) => i !== index);
      setArticle({ ...article, source_links: newLinks });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !article) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('submission-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('submission-images')
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        setArticle({
          ...article,
          image_urls: [...(article.image_urls || []), data.publicUrl]
        });
        
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!article) return;

    setSaving(true);
    try {
      const updateData: any = {
        full_name: article.full_name,
        product_name: article.product_name,
        description: article.description,
        category: article.category,
        background: article.background,
        website: article.website,
        social_media: article.social_media,
        problem_solved: article.problem_solved,
        stage: article.stage,
        idea_origin: article.idea_origin,
        biggest_challenge: article.biggest_challenge,
        proudest_moment: article.proudest_moment,
        inspiration: article.inspiration,
        motivation: article.motivation,
        generated_article: article.generated_article,
        image_urls: article.image_urls,
        source_links: article.source_links,
        featured: article.featured,
        email: article.email,
        city: article.city,
        state: article.state,
        updated_at: new Date().toISOString()
      };

      // Handle banner image - store as JSON if it's an object
      if (article.banner_image) {
        if (typeof article.banner_image === 'object') {
          updateData.banner_image = JSON.stringify(article.banner_image);
        } else {
          updateData.banner_image = article.banner_image;
        }
      }
      
      // Handle other special images
      if (article.headshot_image) {
        updateData.headshot_image = article.headshot_image;
      }
      if (article.logo_image) {
        updateData.logo_image = article.logo_image;
      }

      const { error } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', article.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article updated successfully!",
      });
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: "Error",
        description: "Failed to update article",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!article) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          id: article.id,
          full_name: article.full_name,
          product_name: article.product_name,
          description: article.description,
          category: article.category,
          background: article.background,
          website: article.website,
          social_media: article.social_media,
          problem_solved: article.problem_solved,
          stage: article.stage,
          idea_origin: article.idea_origin,
          biggest_challenge: article.biggest_challenge,
          proudest_moment: article.proudest_moment,
          inspiration: article.inspiration,
          motivation: article.motivation,
          source_links: article.source_links || [],
          isManual: true
        }
      });

      if (error) throw error;

      if (data?.generated_article) {
        setArticle({
          ...article,
          generated_article: data.generated_article
        });
        
        toast({
          title: "Success",
          description: "Story generated successfully!",
        });
      }
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Article not found</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const bannerImage = typeof article?.banner_image === 'object' 
    ? article.banner_image as BannerImageSettings 
    : null;
  const bannerUrl = bannerImage?.url || (typeof article?.banner_image === 'string' ? article.banner_image : '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Article</h1>
              <p className="text-gray-600 mt-1">
                {article.product_name} by {article.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={article.status === 'approved' ? 'default' : 'secondary'}>
              {article.status}
            </Badge>
            {article.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Featured
              </Badge>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="story">Story Details</TabsTrigger>
            <TabsTrigger value="content">Article Content</TabsTrigger>
            <TabsTrigger value="media">Media & Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={article.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={article.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_name">Product Name</Label>
                    <Input
                      id="product_name"
                      value={article.product_name || ''}
                      onChange={(e) => handleInputChange('product_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={article.category || ''}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stage">Development Stage</Label>
                    <Select
                      value={article.stage || ''}
                      onValueChange={(value) => handleInputChange('stage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={article.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={article.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={article.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Product Description</Label>
                  <Textarea
                    id="description"
                    value={article.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={article.featured || false}
                    onCheckedChange={(checked) => handleInputChange('featured', checked)}
                  />
                  <Label htmlFor="featured">Featured Article</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="story" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Story Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="background">Background</Label>
                  <Textarea
                    id="background"
                    value={article.background || ''}
                    onChange={(e) => handleInputChange('background', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="problem_solved">Problem Solved</Label>
                  <Textarea
                    id="problem_solved"
                    value={article.problem_solved || ''}
                    onChange={(e) => handleInputChange('problem_solved', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="idea_origin">Idea Origin</Label>
                  <Textarea
                    id="idea_origin"
                    value={article.idea_origin || ''}
                    onChange={(e) => handleInputChange('idea_origin', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="biggest_challenge">Biggest Challenge</Label>
                  <Textarea
                    id="biggest_challenge"
                    value={article.biggest_challenge || ''}
                    onChange={(e) => handleInputChange('biggest_challenge', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="proudest_moment">Proudest Moment</Label>
                  <Textarea
                    id="proudest_moment"
                    value={article.proudest_moment || ''}
                    onChange={(e) => handleInputChange('proudest_moment', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="inspiration">Inspiration</Label>
                  <Textarea
                    id="inspiration"
                    value={article.inspiration || ''}
                    onChange={(e) => handleInputChange('inspiration', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="motivation">Motivation</Label>
                  <Textarea
                    id="motivation"
                    value={article.motivation || ''}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Article Content</CardTitle>
                  <Button
                    onClick={handleGenerateStory}
                    disabled={generating}
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generating ? 'Generating...' : article.generated_article ? 'Regenerate Story' : 'Generate Story'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="generated_article">Article Text</Label>
                  <Textarea
                    id="generated_article"
                    value={article.generated_article || ''}
                    onChange={(e) => handleInputChange('generated_article', e.target.value)}
                    rows={20}
                    className="mt-2"
                    placeholder="Enter the article content here or click 'Generate Story' to create it automatically..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            {/* Special Images Section */}
            <Card>
              <CardHeader>
                <CardTitle>Special Images</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Designate specific images for banner, headshot, and logo display
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Banner Image */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Label className="text-base font-medium">Banner Image</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="banner_url">Image URL</Label>
                      <Input
                        id="banner_url"
                        placeholder="Enter banner image URL"
                        value={bannerUrl}
                        onChange={(e) => handleSpecialImageChange('banner_image', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner_position">Position</Label>
                      <Select
                        value={bannerImage?.position || 'center'}
                        onValueChange={(value) => handleBannerSettingChange('position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {bannerPositions.map((pos) => (
                            <SelectItem key={pos.value} value={pos.value}>
                              {pos.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="banner_size">Size</Label>
                      <Select
                        value={bannerImage?.size || 'cover'}
                        onValueChange={(value) => handleBannerSettingChange('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {bannerSizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {bannerUrl && (
                    <div className="mt-4">
                      <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                        <img 
                          src={bannerUrl} 
                          alt="Banner preview" 
                          className="w-full h-full"
                          style={{
                            objectFit: bannerImage?.size === 'cover' ? 'cover' : 
                                     bannerImage?.size === 'contain' ? 'contain' : 'none',
                            objectPosition: bannerImage?.position || 'center',
                            ...(bannerImage?.size && bannerImage.size !== 'cover' && 
                               bannerImage.size !== 'contain' && 
                               bannerImage.size !== 'auto' ? 
                               { transform: `scale(${parseFloat(bannerImage.size) / 100})` } : {})
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Preview: {bannerImage?.position || 'center'} position, {bannerImage?.size || 'cover'} size
                      </p>
                    </div>
                  )}
                </div>

                {/* Headshot Image */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <Label className="text-base font-medium">Headshot Image</Label>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="headshot_url">Image URL</Label>
                      <Input
                        id="headshot_url"
                        placeholder="Enter headshot image URL"
                        value={article.headshot_image || ''}
                        onChange={(e) => handleSpecialImageChange('headshot_image', e.target.value)}
                      />
                    </div>
                    {article.headshot_image && (
                      <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
                        <img 
                          src={article.headshot_image} 
                          alt="Headshot preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Image */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-green-500" />
                    <Label className="text-base font-medium">Logo Image</Label>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="logo_url">Image URL</Label>
                      <Input
                        id="logo_url"
                        placeholder="Enter logo image URL"
                        value={article.logo_image || ''}
                        onChange={(e) => handleSpecialImageChange('logo_image', e.target.value)}
                      />
                    </div>
                    {article.logo_image && (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <img 
                          src={article.logo_image} 
                          alt="Logo preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regular Images and Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    General Images
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Additional images for the article content
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <Button onClick={addImageUrl} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex-1 h-px bg-border"></div>
                    <span>or</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full gap-2" 
                        disabled={uploading}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                          input?.click();
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </label>
                  </div>
                  <div className="space-y-2">
                    {article.image_urls?.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <img src={url} alt="Article image thumbnail" className="w-12 h-12 object-cover rounded" />
                        <span className="flex-1 text-sm truncate">{url}</span>
                        <Button
                          onClick={() => removeImageUrl(index)}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Source Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Source URL"
                      value={newSourceLink}
                      onChange={(e) => setNewSourceLink(e.target.value)}
                    />
                    <Button onClick={addSourceLink} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {article.source_links?.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1 text-sm truncate">{link}</span>
                        <Button
                          onClick={() => removeSourceLink(index)}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArticleEditor;
