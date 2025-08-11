import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const ConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    database: boolean | null;
    edgeFunction: boolean | null;
    openai: boolean | null;
    details: string;
  }>({
    database: null,
    edgeFunction: null,
    openai: null,
    details: ""
  });
  const { toast } = useToast();

  const runTests = async () => {
    setIsLoading(true);
    setTestResults({ database: null, edgeFunction: null, openai: null, details: "" });
    
    let details = "=== CONNECTION TEST RESULTS ===\n\n";

    try {
      // Test 1: Database connection
      details += "1. Testing Database Connection...\n";
      const { data: testData, error: dbError } = await supabase
        .from('published_articles_public')
        .select('id')
        .limit(1);
      
      if (dbError) {
        details += `   ❌ Database Error: ${dbError.message}\n`;
        setTestResults(prev => ({ ...prev, database: false }));
      } else {
        details += "   ✅ Database: Connected successfully\n";
        setTestResults(prev => ({ ...prev, database: true }));
      }

      // Test 2: Edge Function availability
      details += "\n2. Testing Edge Function...\n";
      const testSubmission = {
        id: "test-" + Date.now(),
        fullName: "Test User",
        productName: "Test Product",
        description: "A simple test for API connection verification",
        isManualSubmission: false
      };

      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-article', {
        body: testSubmission
      });

      if (functionError) {
        details += `   ❌ Edge Function Error: ${functionError.message}\n`;
        setTestResults(prev => ({ ...prev, edgeFunction: false }));
      } else {
        details += "   ✅ Edge Function: Available\n";
        setTestResults(prev => ({ ...prev, edgeFunction: true }));

        // Test 3: OpenAI API (if edge function works)
        if (functionData && functionData.article) {
          details += "\n3. Testing OpenAI API...\n";
          details += "   ✅ OpenAI API: Working (article generated)\n";
          details += `   📄 Article Preview: ${functionData.article.substring(0, 100)}...\n`;
          setTestResults(prev => ({ ...prev, openai: true }));
        } else if (functionData && functionData.error) {
          details += "\n3. Testing OpenAI API...\n";
          details += `   ❌ OpenAI API Error: ${functionData.error}\n`;
          setTestResults(prev => ({ ...prev, openai: false }));
        } else {
          details += "\n3. Testing OpenAI API...\n";
          details += "   ⚠️ OpenAI API: Unclear response\n";
          setTestResults(prev => ({ ...prev, openai: false }));
        }
      }

      // Final summary
      details += "\n=== SUMMARY ===\n";
      const dbStatus = testResults.database !== false ? "✅" : "❌";
      const efStatus = testResults.edgeFunction !== false ? "✅" : "❌";
      const aiStatus = testResults.openai !== false ? "✅" : "❌";
      
      details += `Database: ${dbStatus}\n`;
      details += `Edge Function: ${efStatus}\n`;
      details += `OpenAI API: ${aiStatus}\n`;

      setTestResults(prev => ({ ...prev, details }));

      const allPassed = testResults.database !== false && 
                      testResults.edgeFunction !== false && 
                      testResults.openai !== false;

      toast({
        title: allPassed ? "All Tests Passed" : "Some Tests Failed",
        description: allPassed ? "All connections are working" : "Check the details below",
        variant: allPassed ? "default" : "destructive",
      });

    } catch (error: any) {
      details += `\n❌ CRITICAL ERROR: ${error.message}\n`;
      setTestResults(prev => ({ ...prev, details }));
      
      toast({
        title: "Test Failed",
        description: `Critical error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    return status ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={runTests} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run Connection Tests"
              )}
            </Button>
            
            {/* Test Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <StatusIcon status={testResults.database} />
                <div>
                  <h3 className="font-semibold">Database</h3>
                  <p className="text-sm text-gray-600">Supabase connection</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <StatusIcon status={testResults.edgeFunction} />
                <div>
                  <h3 className="font-semibold">Edge Function</h3>
                  <p className="text-sm text-gray-600">Article generation</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <StatusIcon status={testResults.openai} />
                <div>
                  <h3 className="font-semibold">OpenAI API</h3>
                  <p className="text-sm text-gray-600">AI content generation</p>
                </div>
              </div>
            </div>
            
            {/* Detailed Results */}
            {testResults.details && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-2">Detailed Results:</h3>
                <pre className="whitespace-pre-wrap text-sm font-mono">{testResults.details}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConnectionTest;