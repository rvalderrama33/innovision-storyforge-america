import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  emailType: string;
  status: 'SUCCESS' | 'ERROR';
  message: string;
  responseData?: any;
  error?: string;
}

interface TestReport {
  testSummary: {
    totalTests: number;
    successful: number;
    failed: number;
    successRate: string;
  };
  testCategories: {
    coreEmailTemplates: TestResult[];
    bulkEmailSystem: TestResult[];
    vendorEmailFunctions: TestResult[];
    adminNotifications: TestResult[];
  };
  detailedResults: TestResult[];
  recommendations: string[];
  timestamp: string;
}

export const EmailSystemTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestReport(null);
    
    try {
      toast({
        title: "Starting Email System Test",
        description: "Testing all email functionality...",
      });

      const { data, error } = await supabase.functions.invoke('test-email-system', {
        body: { action: 'run_comprehensive_test' }
      });

      if (error) {
        throw error;
      }

      setTestReport(data);
      
      const { successful, totalTests } = data.testSummary;
      if (successful === totalTests) {
        toast({
          title: "All Tests Passed! ✅",
          description: `${successful}/${totalTests} email systems working correctly`,
        });
      } else {
        toast({
          title: "Some Tests Failed ⚠️",
          description: `${successful}/${totalTests} tests passed. Check results for details.`,
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('Error running email system test:', error);
      toast({
        title: "Test Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusIcon = (status: 'SUCCESS' | 'ERROR') => {
    return status === 'SUCCESS' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (status: 'SUCCESS' | 'ERROR') => {
    return (
      <Badge variant={status === 'SUCCESS' ? 'default' : 'destructive'}>
        {status}
      </Badge>
    );
  };

  const renderTestResults = (results: TestResult[], title: string, sectionKey: string) => {
    const isExpanded = expandedSections[sectionKey];
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    
    return (
      <Collapsible key={sectionKey}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => toggleSection(sectionKey)}
          >
            <div className="flex items-center gap-3">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-medium">{title}</span>
              <Badge variant="outline">
                {successCount}/{results.length} passed
              </Badge>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm">{result.emailType}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">Error: {result.error}</p>
                  )}
                  {result.responseData && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        View Response Data
                      </summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.responseData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Email System Comprehensive Tester
          </CardTitle>
          <CardDescription>
            Test all email templates, bulk email functionality, vendor emails, and admin notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Running Comprehensive Test...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Comprehensive Email Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testReport && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
              <CardDescription>
                Completed at {new Date(testReport.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{testReport.testSummary.totalTests}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{testReport.testSummary.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{testReport.testSummary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{testReport.testSummary.successRate}</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {testReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testReport.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
              <CardDescription>
                Expand each section to view individual test results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderTestResults(
                testReport.testCategories.coreEmailTemplates,
                'Core Email Templates',
                'coreEmailTemplates'
              )}
              {renderTestResults(
                testReport.testCategories.bulkEmailSystem,
                'Bulk Email System',
                'bulkEmailSystem'
              )}
              {renderTestResults(
                testReport.testCategories.vendorEmailFunctions,
                'Vendor Email Functions',
                'vendorEmailFunctions'
              )}
              {renderTestResults(
                testReport.testCategories.adminNotifications,
                'Admin Notifications',
                'adminNotifications'
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};