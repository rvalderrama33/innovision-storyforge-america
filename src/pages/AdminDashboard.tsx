import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EmailNotificationForm from "@/components/EmailNotificationForm";
import EmailTemplateCustomizer from "@/components/EmailTemplateCustomizer";
import AdminManualSubmission from "@/components/AdminManualSubmission";
import NewsletterManagement from "@/components/NewsletterManagement";
import NewsletterAnalytics from "@/components/NewsletterAnalytics";
import { sendArticleApprovalEmail, sendFeaturedStoryEmail } from "@/lib/emailService";
import { Eye, CheckCircle, XCircle, Star, Pin, Mail, Users, FileText, TrendingUp, Plus, Edit, Trash2, Shield, ShieldOff, BarChart3, Database, Home, Menu } from "lucide-react";
import ArticlePreviewDialog from "@/components/ArticlePreviewDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, useLocation } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import RecommendationAnalytics from "@/components/RecommendationAnalytics";
import SubmissionReports from "@/components/SubmissionReports";
import { SubmissionCard } from "@/components/SubmissionCard";
import SecurityMonitor from "@/components/SecurityMonitor";

import { FollowUpEmailDialog } from "@/components/FollowUpEmailDialog";
import { VendorManagement } from "@/components/VendorManagement";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Extract current tab from URL path
  const currentTab = location.pathname === '/admin' ? 'overview' : location.pathname.split('/admin/')[1] || 'overview';

  useSEO({
    title: "Admin Dashboard | America Innovates Magazine",
    description: "Admin dashboard for managing submissions, newsletters, and analytics at America Innovates Magazine.",
    url: "https://americainnovates.us/admin"
  });
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserData, setEditUserData] = useState({ full_name: '', email: '' });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [followUpEmailOpen, setFollowUpEmailOpen] = useState(false);
  const [followUpSubmission, setFollowUpSubmission] = useState<any>(null);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSubmissions();
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(role => role.user_id === profile.id) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

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

  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Article deleted",
        description: "The article has been permanently removed",
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  const regenerateStory = async (submissionId: string) => {
    try {
      toast({
        title: "Regenerating story",
        description: "Please wait while we regenerate the article...",
      });

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: { submissionId }
      });

      if (error) throw error;

      toast({
        title: "Story regenerated",
        description: "The article has been regenerated successfully",
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error regenerating story:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate story",
        variant: "destructive",
      });
    }
  };

  const triggerFeaturedStoryPromotions = async () => {
    try {
      toast({
        title: "Sending promotion emails",
        description: "Checking for stories that need promotion emails...",
      });

      const { data, error } = await supabase.functions.invoke('send-featured-story-promotion', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;

      toast({
        title: "Promotion emails sent",
        description: data.message || "Featured story promotion emails have been processed",
      });
    } catch (error) {
      console.error('Error sending promotion emails:', error);
      toast({
        title: "Error",
        description: "Failed to send promotion emails",
        variant: "destructive",
      });
    }
  };

  const sendUpgradeEmailToArticle = async (submissionId: string, submissionData: any) => {
    try {
      toast({
        title: "Sending upgrade email",
        description: `Sending featured story upgrade email to ${submissionData.email}...`,
      });

      const { data, error } = await supabase.functions.invoke('send-featured-story-promotion', {
        body: { 
          trigger: 'manual_single',
          submission_id: submissionId
        }
      });

      if (error) throw error;

      toast({
        title: "Upgrade email sent",
        description: `Featured story upgrade email sent to ${submissionData.email}`,
      });
    } catch (error) {
      console.error('Error sending upgrade email:', error);
      toast({
        title: "Error",
        description: "Failed to send upgrade email",
        variant: "destructive",
      });
    }
  };

  const handleSendFollowUpEmail = (submissionData: any) => {
    setFollowUpSubmission(submissionData);
    setFollowUpEmailOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserData({
      full_name: user.full_name || '',
      email: user.email || ''
    });
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editUserData.full_name,
          email: editUserData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "User updated",
        description: "User profile has been updated successfully",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // First delete user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Then delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: "User deleted",
        description: "User has been removed from the system",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const toggleUserRole = async (userId: string, currentRoles: any[]) => {
    try {
      const isAdmin = currentRoles.some(role => role.role === 'admin');
      
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: "Admin removed",
          description: "User admin privileges have been revoked",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });

        if (error) throw error;

        toast({
          title: "Admin granted",
          description: "User has been granted admin privileges",
        });
      }

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
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

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <div className="space-y-6">
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
            </div>
        );
      case 'submissions':
        return (
          <div className="space-y-6">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No submissions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All ({submissions.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({submissions.filter(s => s.status === 'pending').length})</TabsTrigger>
                  <TabsTrigger value="approved">Approved ({submissions.filter(s => s.status === 'approved').length})</TabsTrigger>
                  <TabsTrigger value="draft">Draft ({submissions.filter(s => s.status === 'draft').length})</TabsTrigger>
                  <TabsTrigger value="featured">Featured ({submissions.filter(s => s.featured).length})</TabsTrigger>
                  <TabsTrigger value="category">By Category</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                  <div className="grid gap-6">
                     {submissions.map((submission) => (
                       <SubmissionCard 
                         key={submission.id} 
                         submission={submission}
                         onPreview={() => {
                           setSelectedSubmission(submission);
                           setPreviewDialogOpen(true);
                         }}
                         onUpdateStatus={updateSubmissionStatus}
                         onToggleFeatured={toggleFeatured}
                         onTogglePinned={togglePinned}
                         onDelete={deleteSubmission}
                         onSendUpgradeEmail={sendUpgradeEmailToArticle}
                         onSendFollowUpEmail={handleSendFollowUpEmail}
                       />
                     ))}
                  </div>
                </TabsContent>

                <TabsContent value="pending" className="space-y-6">
                  <div className="space-y-4">
                    {submissions.filter(s => s.status === 'pending').length > 0 && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedPending.length === submissions.filter(s => s.status === 'pending').length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPending(submissions.filter(s => s.status === 'pending').map(s => s.id));
                              } else {
                                setSelectedPending([]);
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">
                            Select All ({selectedPending.length} selected)
                          </span>
                        </div>
                        {selectedPending.length > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Selected ({selectedPending.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Selected Pending Submissions</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {selectedPending.length} selected pending submission(s)? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                  try {
                                    for (const id of selectedPending) {
                                      await supabase.from('submissions').delete().eq('id', id);
                                    }
                                    setSelectedPending([]);
                                    fetchSubmissions();
                                    toast({
                                      title: "Pending submissions deleted",
                                      description: `${selectedPending.length} pending submission(s) have been deleted`,
                                    });
                                  } catch (error) {
                                    console.error('Error deleting pending submissions:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete some pending submissions",
                                      variant: "destructive",
                                    });
                                  }
                                }}>
                                  Delete Selected
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                    <div className="grid gap-6">
                      {submissions.filter(s => s.status === 'pending').map((submission) => (
                        <div key={submission.id} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPending.includes(submission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPending(prev => [...prev, submission.id]);
                              } else {
                                setSelectedPending(prev => prev.filter(id => id !== submission.id));
                              }
                            }}
                            className="mt-6 rounded"
                          />
                          <div className="flex-1">
                            <SubmissionCard 
                              key={submission.id} 
                              submission={submission}
                              onPreview={() => {
                                setSelectedSubmission(submission);
                                setPreviewDialogOpen(true);
                              }}
                              onUpdateStatus={updateSubmissionStatus}
                              onToggleFeatured={toggleFeatured}
                              onTogglePinned={togglePinned}
                              onDelete={deleteSubmission}
                              onSendUpgradeEmail={sendUpgradeEmailToArticle}
                              onSendFollowUpEmail={handleSendFollowUpEmail}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="approved" className="space-y-6">
                  <div className="grid gap-6">
                     {submissions.filter(s => s.status === 'approved').map((submission) => (
                       <SubmissionCard 
                         key={submission.id} 
                         submission={submission}
                         onPreview={() => {
                           setSelectedSubmission(submission);
                           setPreviewDialogOpen(true);
                         }}
                         onUpdateStatus={updateSubmissionStatus}
                         onToggleFeatured={toggleFeatured}
                         onTogglePinned={togglePinned}
                         onDelete={deleteSubmission}
                         onSendUpgradeEmail={sendUpgradeEmailToArticle}
                         onSendFollowUpEmail={handleSendFollowUpEmail}
                       />
                     ))}
                  </div>
                </TabsContent>

                <TabsContent value="draft" className="space-y-6">
                  <div className="space-y-4">
                    {submissions.filter(s => s.status === 'draft').length > 0 && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedDrafts.length === submissions.filter(s => s.status === 'draft').length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDrafts(submissions.filter(s => s.status === 'draft').map(s => s.id));
                              } else {
                                setSelectedDrafts([]);
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">
                            Select All ({selectedDrafts.length} selected)
                          </span>
                        </div>
                        {selectedDrafts.length > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Selected ({selectedDrafts.length})
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Selected Drafts</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {selectedDrafts.length} selected draft(s)? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                  try {
                                    for (const id of selectedDrafts) {
                                      await supabase.from('submissions').delete().eq('id', id);
                                    }
                                    setSelectedDrafts([]);
                                    fetchSubmissions();
                                    toast({
                                      title: "Drafts deleted",
                                      description: `${selectedDrafts.length} draft(s) have been deleted`,
                                    });
                                  } catch (error) {
                                    console.error('Error deleting drafts:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete some drafts",
                                      variant: "destructive",
                                    });
                                  }
                                }}>
                                  Delete Selected
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                    <div className="grid gap-6">
                      {submissions.filter(s => s.status === 'draft').map((submission) => (
                        <div key={submission.id} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedDrafts.includes(submission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDrafts(prev => [...prev, submission.id]);
                              } else {
                                setSelectedDrafts(prev => prev.filter(id => id !== submission.id));
                              }
                            }}
                            className="mt-6 rounded"
                          />
                          <div className="flex-1">
                             <SubmissionCard 
                               submission={submission}
                               onPreview={() => {
                                 setSelectedSubmission(submission);
                                 setPreviewDialogOpen(true);
                               }}
                               onUpdateStatus={updateSubmissionStatus}
                               onToggleFeatured={toggleFeatured}
                               onTogglePinned={togglePinned}
                               onDelete={deleteSubmission}
                               onSendUpgradeEmail={sendUpgradeEmailToArticle}
                               onSendFollowUpEmail={handleSendFollowUpEmail}
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="featured" className="space-y-6">
                  <div className="grid gap-6">
                     {submissions.filter(s => s.featured).map((submission) => (
                       <SubmissionCard 
                         key={submission.id} 
                         submission={submission}
                         onPreview={() => {
                           setSelectedSubmission(submission);
                           setPreviewDialogOpen(true);
                         }}
                         onUpdateStatus={updateSubmissionStatus}
                         onToggleFeatured={toggleFeatured}
                         onTogglePinned={togglePinned}
                         onDelete={deleteSubmission}
                         onSendUpgradeEmail={sendUpgradeEmailToArticle}
                         onSendFollowUpEmail={handleSendFollowUpEmail}
                       />
                     ))}
                  </div>
                </TabsContent>

                <TabsContent value="category" className="space-y-6">
                  {Array.from(new Set(submissions.map(s => s.category).filter(Boolean))).map(category => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle>{category} ({submissions.filter(s => s.category === category).length})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                         {submissions.filter(s => s.category === category).map((submission) => (
                           <SubmissionCard 
                             key={submission.id} 
                             submission={submission}
                             onPreview={() => {
                               setSelectedSubmission(submission);
                               setPreviewDialogOpen(true);
                             }}
                             onUpdateStatus={updateSubmissionStatus}
                             onToggleFeatured={toggleFeatured}
                             onTogglePinned={togglePinned}
                             onDelete={deleteSubmission}
                             onSendUpgradeEmail={sendUpgradeEmailToArticle}
                             onSendFollowUpEmail={handleSendFollowUpEmail}
                           />
                         ))}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        );
      case 'reports':
        return <SubmissionReports />;
      case 'create':
        return <AdminManualSubmission onSubmissionCreated={fetchSubmissions} />;
      case 'newsletter':
        return <NewsletterManagement />;
      case 'newsletter-analytics':
        return <NewsletterAnalytics />;
      case 'analytics':
        return (
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
        );
      case 'recommendations':
        return <RecommendationAnalytics />;
      case 'security':
        return <SecurityMonitor />;
      case 'emails':
        return (
          <div className="space-y-6">
            <EmailTemplateCustomizer />
            <EmailNotificationForm />
          </div>
        );
      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Management</span>
                <Badge variant="secondary">{users.length} Users</Badge>
              </CardTitle>
              <CardDescription>
                Manage user accounts and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No users found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isAdmin = user.user_roles?.some((role: any) => role.role === 'admin');
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.full_name || 'Unknown User'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.user_roles?.map((role: any) => (
                                <Badge key={role.role} variant={role.role === 'admin' ? 'default' : 'secondary'}>
                                  {role.role}
                                </Badge>
                              ))}
                              {(!user.user_roles || user.user_roles.length === 0) && (
                                <Badge variant="outline">subscriber</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription>
                                      Update user profile information
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="full_name">Full Name</Label>
                                      <Input
                                        id="full_name"
                                        value={editUserData.full_name}
                                        onChange={(e) => setEditUserData(prev => ({ ...prev, full_name: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="email">Email</Label>
                                      <Input
                                        id="email"
                                        type="email"
                                        value={editUserData.email}
                                        onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingUser(null)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={updateUser}>
                                      Update User
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant={isAdmin ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => toggleUserRole(user.id, user.user_roles)}
                              >
                                {isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this user? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteUser(user.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      case 'vendors':
        return <VendorManagement />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Magazine Admin</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Manage submissions and communications</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/choice">
              <Button variant="outline" size="sm">
                Admin Home
              </Button>
            </Link>
            <Link 
              to="/" 
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Tabs value={currentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" asChild>
              <Link to="/admin">Overview</Link>
            </TabsTrigger>
            <TabsTrigger value="submissions" asChild>
              <Link to="/admin/submissions">Submissions</Link>
            </TabsTrigger>
            <TabsTrigger value="newsletter" asChild>
              <Link to="/admin/newsletter">Newsletter</Link>
            </TabsTrigger>
            <TabsTrigger value="analytics" asChild>
              <Link to="/admin/analytics">Analytics</Link>
            </TabsTrigger>
            <TabsTrigger value="recommendations" asChild>
              <Link to="/admin/recommendations">Recommendations</Link>
            </TabsTrigger>
            <TabsTrigger value="emails" asChild>
              <Link to="/admin/emails">Email Templates</Link>
            </TabsTrigger>
            <TabsTrigger value="users" asChild>
              <Link to="/admin/users">Users</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={currentTab}>
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </main>

      <ArticlePreviewDialog
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        submission={selectedSubmission}
        onApprove={(id) => updateSubmissionStatus(id, 'approved')}
        onReject={(id) => updateSubmissionStatus(id, 'rejected')}
        onRegenerate={regenerateStory}
      />

      <FollowUpEmailDialog
        open={followUpEmailOpen}
        onClose={() => setFollowUpEmailOpen(false)}
        submission={followUpSubmission}
      />
    </div>
  );
};

export default AdminDashboard;