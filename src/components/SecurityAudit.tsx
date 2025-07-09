import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SecurityAudit = () => {
  const [loading, setLoading] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const runSecurityAudit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-audit');
      
      if (error) {
        throw error;
      }
      
      setAuditResults(data);
      
      if (data.issuesFound > 0) {
        toast({
          title: "Security Issues Found",
          description: `Found ${data.issuesFound} potential security issues. Please review them carefully.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "No Issues Found",
          description: "Your content appears to be clean and secure.",
        });
      }
    } catch (error) {
      console.error('Security audit error:', error);
      toast({
        title: "Audit Failed",
        description: "Failed to run security audit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Admin Access Required</h3>
              <p className="text-muted-foreground">You need admin privileges to access the security audit tool.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Security Audit</h1>
          <p className="text-muted-foreground">
            Scan your content for potential security issues and harmful patterns
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Content Security Scanner
            </CardTitle>
            <CardDescription>
              This tool scans all approved articles for potentially harmful content patterns that might trigger security warnings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runSecurityAudit} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Security Audit...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Run Security Audit
                </>
              )}
            </Button>

            {auditResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{auditResults.totalSubmissions}</div>
                        <div className="text-sm text-muted-foreground">Total Articles Scanned</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${auditResults.issuesFound > 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {auditResults.issuesFound}
                        </div>
                        <div className="text-sm text-muted-foreground">Issues Found</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          {auditResults.issuesFound === 0 ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {auditResults.issuesFound === 0 ? 'Secure' : 'Needs Review'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {auditResults.issuesFound > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {auditResults.message}
                    </AlertDescription>
                  </Alert>
                )}

                {auditResults.issues && auditResults.issues.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Flagged Content</h3>
                    {auditResults.issues.map((issue, index) => (
                      <Card key={index} className="border-destructive/20">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{issue.name}</h4>
                                <p className="text-sm text-muted-foreground">{issue.product}</p>
                              </div>
                              <Badge variant="destructive">Issue</Badge>
                            </div>
                            <p className="text-sm"><strong>Issue:</strong> {issue.issue}</p>
                            <p className="text-sm"><strong>Content Preview:</strong> {issue.content}</p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/admin/edit/${issue.id}`, '_blank')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Review Article
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {auditResults.issuesFound === 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Great! No security issues were detected in your content.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Content Sanitization</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• All HTML content is sanitized with DOMPurify</li>
                  <li>• Script tags and event handlers are removed</li>
                  <li>• External links are validated</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Monitoring</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Regular security audits</li>
                  <li>• Automated pattern detection</li>
                  <li>• Content review workflows</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityAudit;