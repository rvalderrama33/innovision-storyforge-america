import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const TestProductContentGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testUrl, setTestUrl] = useState('https://unsplash.com/photos/a-close-up-of-a-camera-with-a-blurry-background-8Hjx3GNZYeA');
  const { toast } = useToast();

  const testFunction = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing generate-product-content function with URL:', testUrl);
      
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: { 
          productName: 'Test Product',
          basicDescription: 'Test description',
          category: 'Electronics',
          salesLinks: [testUrl],
          images: []
        }
      });

      console.log('Function response:', { data, error });
      
      if (error) {
        console.error('Function error:', error);
        setResult({ error: error.message });
        toast({
          title: "Function Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setResult({ data });
        toast({
          title: "Function Executed",
          description: `Found ${data?.scrapedImages?.length || 0} images`,
          variant: "default"
        });
      }
    } catch (err: any) {
      console.error('Caught error:', err);
      setResult({ error: err.message });
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Test Product Content Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Test URL:</label>
          <Input 
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter URL to test"
          />
        </div>
        
        <Button 
          onClick={testFunction} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Function'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h4 className="font-semibold mb-2">Result:</h4>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};