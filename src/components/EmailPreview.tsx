import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EmailPreview = () => {
  const [showPreview, setShowPreview] = useState(false);

  // Sample data
  const sampleEmail = {
    name: "John Smith",
    productName: "EcoFresh Water Bottles",
    slug: "john-smith-ecofresh-water-bottles",
    primaryColor: "#667eea",
    accentColor: "#764ba2",
    companyName: "America Innovates",
    footerText: "America Innovates Magazine - Celebrating Innovation and Entrepreneurship"
  };

  const generateSampleHTML = () => {
    const articleUrl = `https://americainnovates.us/article/${sampleEmail.slug}`;
    
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <style>
          a { color: #2563eb !important; text-decoration: underline !important; }
          .button-link { color: white !important; text-decoration: none !important; }
        </style>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a202c; margin-bottom: 10px;">🎉 Congratulations!</h1>
          <p style="color: #4a5568; font-size: 18px;">Your innovation story has been approved and published!</p>
        </div>
        
        <div style="background: linear-gradient(135deg, ${sampleEmail.primaryColor} 0%, ${sampleEmail.accentColor} 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px;">Great news, ${sampleEmail.name}!</h2>
          <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
            Your innovation story about <strong>"${sampleEmail.productName}"</strong> has been reviewed and approved by our editorial team. It's now live on ${sampleEmail.companyName}!
          </p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1a202c; margin-bottom: 15px;">What happens next?</h3>
          <ul style="color: #4a5568; line-height: 1.8;">
            <li>📖 Your story is now visible to thousands of readers</li>
            <li>📈 Share it with your network to increase visibility</li>
            <li>🤝 Connect with fellow entrepreneurs who read your story</li>
            <li>⭐ You might be selected for our featured stories section!</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${articleUrl}" 
             class="button-link"
             style="background: ${sampleEmail.primaryColor}; color: white !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; font-weight: 600; display: inline-block; margin-right: 10px;">
            View Your Article
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 14px;">
          <p>${sampleEmail.footerText}</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Preview - Story Approval</CardTitle>
          <p className="text-gray-600">
            Here's how the fixed "Your story has been approved" email will look:
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => setShowPreview(!showPreview)}
              variant={showPreview ? "secondary" : "default"}
            >
              {showPreview ? "Hide Preview" : "Show Email Preview"}
            </Button>

            {showPreview && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Key Fixes Applied:</h4>
                <ul className="text-sm text-gray-600 mb-4 space-y-1">
                  <li>✅ Added global CSS to handle link colors</li>
                  <li>✅ Button links now have `color: white !important`</li>
                  <li>✅ Added `.button-link` class for consistent styling</li>
                  <li>✅ Email clients can't override the white button text</li>
                </ul>
                
                <div 
                  className="border border-gray-300 rounded bg-white"
                  dangerouslySetInnerHTML={{ __html: generateSampleHTML() }}
                />
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p><strong>Sample Data Used:</strong></p>
              <ul className="mt-2 space-y-1">
                <li>Name: {sampleEmail.name}</li>
                <li>Product: {sampleEmail.productName}</li>
                <li>Article URL: https://americainnovates.us/article/{sampleEmail.slug}</li>
                <li>Primary Color: {sampleEmail.primaryColor}</li>
                <li>Accent Color: {sampleEmail.accentColor}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailPreview;