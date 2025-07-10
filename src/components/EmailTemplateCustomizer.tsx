import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Palette, Code, Eye, Save, Mail, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';

const EmailTemplateCustomizer = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [customization, setCustomization] = useState({
    primaryColor: '#667eea',
    accentColor: '#764ba2',
    companyName: 'America Innovates',
    logoUrl: '',
    footerText: 'America Innovates Magazine - Celebrating Innovation and Entrepreneurship'
  });
  const [previewData, setPreviewData] = useState({
    recipientName: 'John Doe',
    recipientEmail: 'john@example.com',
    customMessage: 'We have an exciting update about your recent submission!'
  });
  const { toast } = useToast();

  // Load customizations from database on component mount
  useEffect(() => {
    const loadCustomizations = async () => {
      try {
        const { data, error } = await supabase
          .from('email_customizations')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading customizations:', error);
          return;
        }

        if (data) {
          setCustomization({
            primaryColor: data.primary_color,
            accentColor: data.accent_color,
            companyName: data.company_name,
            logoUrl: data.logo_url || '',
            footerText: data.footer_text
          });
        }
      } catch (error) {
        console.error('Error loading customizations:', error);
      }
    };

    loadCustomizations();
  }, []);

  const templates = {
    welcome: {
      name: 'Welcome Email',
      description: 'Sent automatically when users sign up',
      subject: 'Welcome to America Innovates!',
      previewText: 'Thank you for joining our community of entrepreneurs and innovators.'
    },
    approval: {
      name: 'Article Approved',
      description: 'Sent when submissions are approved',
      subject: 'Your story has been approved!',
      previewText: 'Congratulations! Your innovation story is now live on America Innovates.'
    },
    featured: {
      name: 'Story Featured',
      description: 'Sent when stories are featured',
      subject: 'Your story is now featured!',
      previewText: 'Amazing news! Your story has been selected as a featured article.'
    },
    notification: {
      name: 'Custom Notification',
      description: 'Manual notifications',
      subject: 'Update from America Innovates',
      previewText: 'We have an important update to share with you.'
    }
  };

  const generatePreviewHtml = () => {
    const template = templates[selectedTemplate as keyof typeof templates];
    const gradientStyle = `background: linear-gradient(135deg, ${customization.primaryColor} 0%, ${customization.accentColor} 100%);`;
    
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          ${customization.logoUrl ? 
            `<img src="${customization.logoUrl}" alt="${customization.companyName}" style="max-height: 60px; margin-bottom: 15px;" />` : 
            ''
          }
          <h1 style="color: #1a202c; margin-bottom: 10px;">${customization.companyName}</h1>
          <p style="color: #4a5568; font-size: 18px;">${template.previewText}</p>
        </div>
        
        <div style="${gradientStyle} color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Hello ${previewData.recipientName}! 👋</h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.6;">
            ${selectedTemplate === 'welcome' ? 
              'Thank you for joining our community of entrepreneurs and innovators. You\'re now part of a network that celebrates creativity, innovation, and the entrepreneurial spirit.' :
              selectedTemplate === 'approval' ? 
              'Congratulations! Your innovation story has been approved and is now live on America Innovates. Thank you for sharing your entrepreneurial journey with our community.' :
              selectedTemplate === 'featured' ? 
              'Amazing news! Your story has been selected as a featured article on America Innovates. This means it will be prominently displayed and reach even more readers.' :
              previewData.customMessage
            }
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="#" style="background: ${customization.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            ${selectedTemplate === 'welcome' ? 'Explore Stories' : 
              selectedTemplate === 'approval' ? 'View Your Story' :
              selectedTemplate === 'featured' ? 'See Featured Story' :
              'Visit America Innovates'
            }
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
          <p>${customization.footerText}</p>
        </div>
      </div>
    `;
  };

  const handleSaveCustomization = async () => {
    try {
      // Check if customizations already exist
      const { data: existing } = await supabase
        .from('email_customizations')
        .select('id')
        .limit(1)
        .single();

      const customizationData = {
        primary_color: customization.primaryColor,
        accent_color: customization.accentColor,
        company_name: customization.companyName,
        logo_url: customization.logoUrl || null,
        footer_text: customization.footerText,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('email_customizations')
          .update(customizationData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('email_customizations')
          .insert(customizationData);

        if (error) throw error;
      }

      toast({
        title: "Customization saved!",
        description: "Your email template customization has been saved.",
      });
    } catch (error) {
      console.error('Error saving customizations:', error);
      toast({
        title: "Error saving customization",
        description: "There was an error saving your customization. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Email Template Customizer
        </CardTitle>
        <CardDescription>
          Customize the look and feel of your automated emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="customize" className="space-y-6">
          <TabsList>
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Customize
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              HTML Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customize" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Template Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Select Template</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {Object.entries(templates).map(([key, template]) => (
                      <div
                        key={key}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate === key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTemplate(key)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          {selectedTemplate === key && (
                            <Badge variant="default" className="ml-2">Selected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Data */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Preview Data</Label>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="recipientName">Recipient Name</Label>
                      <Input
                        id="recipientName"
                        value={previewData.recipientName}
                        onChange={(e) => setPreviewData(prev => ({...prev, recipientName: e.target.value}))}
                      />
                    </div>
                    {selectedTemplate === 'notification' && (
                      <div>
                        <Label htmlFor="customMessage">Custom Message</Label>
                        <Textarea
                          id="customMessage"
                          value={previewData.customMessage}
                          onChange={(e) => setPreviewData(prev => ({...prev, customMessage: e.target.value}))}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customization Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Branding & Colors</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={customization.companyName}
                      onChange={(e) => setCustomization(prev => ({...prev, companyName: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                    <Input
                      id="logoUrl"
                      value={customization.logoUrl}
                      onChange={(e) => setCustomization(prev => ({...prev, logoUrl: e.target.value}))}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={customization.primaryColor}
                          onChange={(e) => setCustomization(prev => ({...prev, primaryColor: e.target.value}))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={customization.primaryColor}
                          onChange={(e) => setCustomization(prev => ({...prev, primaryColor: e.target.value}))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={customization.accentColor}
                          onChange={(e) => setCustomization(prev => ({...prev, accentColor: e.target.value}))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={customization.accentColor}
                          onChange={(e) => setCustomization(prev => ({...prev, accentColor: e.target.value}))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="footerText">Footer Text</Label>
                    <Textarea
                      id="footerText"
                      value={customization.footerText}
                      onChange={(e) => setCustomization(prev => ({...prev, footerText: e.target.value}))}
                      rows={2}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveCustomization} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Customization
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Email Preview</h3>
                <Badge variant="outline">{templates[selectedTemplate as keyof typeof templates].name}</Badge>
              </div>
              <div 
                className="border bg-white rounded-lg p-4 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatePreviewHtml()) }}
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">HTML Code</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatePreviewHtml());
                    toast({ title: "Code copied!", description: "HTML code copied to clipboard" });
                  }}
                >
                  Copy Code
                </Button>
              </div>
              <pre className="text-xs bg-white border rounded p-4 max-h-96 overflow-auto">
                <code>{generatePreviewHtml()}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateCustomizer;