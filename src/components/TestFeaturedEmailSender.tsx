import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const TestFeaturedEmailSender = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testEmailFunction = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing featured story promotion function...');
      
      const { data, error } = await supabase.functions.invoke('send-featured-story-promotion', {
        body: { trigger: 'manual_all' }
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
          description: `Result: ${JSON.stringify(data)}`,
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test Featured Email Function</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testEmailFunction} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Email Function'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h4 className="font-semibold mb-2">Result:</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};