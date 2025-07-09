import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EmailNotificationForm from "@/components/EmailNotificationForm";
import EmailTemplateCustomizer from "@/components/EmailTemplateCustomizer";
import { sendArticleApprovalEmail, sendFeaturedStoryEmail } from "@/lib/emailService";
import { Eye, CheckCircle, XCircle, Star, Pin, Mail, Users, FileText, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSubmissions();
    }
  }, [user, isAdmin]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ 
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          approved_by: status === 'approved' ? user?.id : null
        })
        .eq('id', id);

      if (error) throw error;

      // Send approval email if status is approved
      if (status === 'approved') {
        const submission = submissions.find(s => s.id === id);
        if (submission?.email && submission?.full_name) {
          try {
            await sendArticleApprovalEmail(
              submission.email, 
              submission.full_name, 
              submission.product_name || 'Your Innovation Story',
              submission.slug || submission.id
            );
            toast({
              title: "Article approved and email sent!",
              description: `Approval email sent to ${submission.email}`,
            });
          } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            toast({
              title: "Article approved",
              description: "Article approved but email notification failed to send.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Status updated",
          description: `Submission ${status}`,
        });
      }

      fetchSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast({
        title: "Error",
        description: "Failed to update submission status",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ featured })
        .eq('id', id);

      if (error) throw error;

      // Send featured story email if being featured
      if (featured) {
        const submission = submissions.find(s => s.id === id);
        if (submission?.email && submission?.full_name) {
          try {
            await sendFeaturedStoryEmail(
              submission.email,
              submission.full_name,
              submission.product_name || 'Your Innovation Story',
              submission.slug || submission.id
            );
            toast({
              title: "Story featured and email sent!",
              description: `Featured story email sent to ${submission.email}`,
            });
          } catch (emailError) {
            console.error('Failed to send featured email:', emailError);
            toast({
              title: "Story featured",
              description: "Story featured but email notification failed to send.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Status updated",
          description: featured ? "Story featured" : "Story unfeatured",
        });
      }

      fetchSubmissions();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    }
  };

  const togglePinned = async (id: string, pinned: boolean) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ pinned })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: pinned ? "Story pinned" : "Story unpinned",
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error updating pinned status:', error);
      toast({
        title: "Error",
        description: "Failed to update pinned status",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage submissions and communications</p>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-6">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No submissions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">{submission.product_name}</CardTitle>
                          <CardDescription className="text-base">
                            by {submission.full_name} • {submission.email}
                          </CardDescription>
                          <p className="text-sm text-muted-foreground mt-2">
                            {submission.description}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={getStatusVariant(submission.status)}>
                            {submission.status}
                          </Badge>
                          {submission.featured && (
                            <Badge variant="secondary">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {submission.pinned && (
                            <Badge variant="outline">
                              <Pin className="w-3 h-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => window.open(`/article/${submission.slug || submission.id}`, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        
                        {submission.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                              size="sm"
                              variant="default"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        <Button
                          onClick={() => toggleFeatured(submission.id, !submission.featured)}
                          size="sm"
                          variant={submission.featured ? "secondary" : "outline"}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {submission.featured ? 'Unfeature' : 'Feature'}
                        </Button>
                        
                        <Button
                          onClick={() => togglePinned(submission.id, !submission.pinned)}
                          size="sm"
                          variant={submission.pinned ? "secondary" : "outline"}
                        >
                          <Pin className="w-4 h-4 mr-2" />
                          {submission.pinned ? 'Unpin' : 'Pin'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Total Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{submissions.length}</div>
                  <p className="text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Approved Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {submissions.filter(s => s.status === 'approved').length}
                  </div>
                  <p className="text-muted-foreground">Published stories</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Featured Stories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {submissions.filter(s => s.featured).length}
                  </div>
                  <p className="text-muted-foreground">Highlighted articles</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  User management features coming soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This section will include user profiles, role management, and user activity tracking.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmailNotificationForm />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email Automation
                    </CardTitle>
                    <CardDescription>
                      Automated emails are sent for key events
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Automated Triggers:</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>✅ Welcome Email - New user signups</div>
                        <div>✅ Article Approval - When articles are approved</div>
                        <div>✅ Featured Story - When stories are featured</div>
                        <div>📧 Manual Notifications - Custom sending</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Email Settings:</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>• From: America Innovates &lt;noreply@resend.dev&gt;</div>
                        <div>• Provider: Resend</div>
                        <div>• Status: ✅ Active</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <EmailTemplateCustomizer />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;