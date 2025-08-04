import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ImageScrapingTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const testImageScraping = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-image-scraping', {
        body: { url: 'https://muputu.com/products/in-the-woods-coaster' }
      });

      if (error) throw error;

      setResults(data);
      
      if (data.success) {
        toast({
          title: "Test Complete",
          description: `Found ${data.imageCount} images from the website`
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Image Scraping Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testImageScraping} 
          disabled={testing}
          className="w-full"
        >
          {testing ? "Testing..." : "Test Image Scraping from muputu.com"}
        </Button>
        
        {results && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <p><strong>URL:</strong> {results.url}</p>
              <p><strong>Success:</strong> {results.success ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Images Found:</strong> {results.imageCount || 0}</p>
              <p><strong>Title:</strong> {results.title || "None"}</p>
              <p><strong>Description:</strong> {results.description || "None"}</p>
            </div>
            
            {results.imageUrls && results.imageUrls.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Found Images:</h4>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {results.imageUrls.map((url: string, index: number) => (
                    <div key={index} className="border rounded p-2">
                      <img 
                        src={url} 
                        alt={`Found image ${index + 1}`}
                        className="w-full h-20 object-cover rounded mb-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <p className="text-xs text-muted-foreground truncate">{url}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};