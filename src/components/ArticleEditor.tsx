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
import { ArrowLeft, Save, Eye, Plus, X, ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const categories = [
    'Technology', 'Health & Wellness', 'Food & Beverage', 'Fashion', 
    'Home & Garden', 'Sports & Fitness', 'Beauty', 'Education', 
    'Entertainment', 'Business', 'Other'
  ];

  const stages = [
    'Idea Stage', 'Prototype', 'Early Development', 'Beta Testing', 
    'Market Ready', 'Launched', 'Scaling', 'Established'
  ];

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }
    
    if (id && isAdmin) {
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
      setArticle(data);
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

  const handleSave = async () => {
    if (!article) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
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
        })
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
                <CardTitle>Article Content</CardTitle>
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
                    placeholder="Enter the article content here..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Images
                  </CardTitle>
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
                  <div className="space-y-2">
                    {article.image_urls?.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <img src={url} alt="" className="w-12 h-12 object-cover rounded" />
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