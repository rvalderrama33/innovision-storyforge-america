
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const OpenAITest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const { toast } = useToast();

  const testOpenAI = async () => {
    setIsLoading(true);
    setResult("");
    
    try {
      console.log("Testing OpenAI API...");
      
      const testData = {
        fullName: "Test User",
        productName: "Test Product",
        description: "A simple test product for API verification"
      };

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: testData
      });

      if (error) {
        console.error("Edge function error:", error);
        setResult(`Error: ${error.message}`);
        toast({
          title: "Test Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data && data.article) {
        setResult(data.article);
        toast({
          title: "Test Successful",
          description: "OpenAI API is working correctly!",
        });
      } else {
        setResult("No article returned from API");
        toast({
          title: "Test Failed",
          description: "No article content received",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Test error:", error);
      setResult(`Error: ${error.message}`);
      toast({
        title: "Test Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>OpenAI API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testOpenAI} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing API...
            </>
          ) : (
            "Test OpenAI API"
          )}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenAITest;
