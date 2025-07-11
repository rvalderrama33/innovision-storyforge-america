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
import AdminManualSubmission from "@/components/AdminManualSubmission";
import NewsletterManagement from "@/components/NewsletterManagement";
import NewsletterAnalytics from "@/components/NewsletterAnalytics";
import { sendArticleApprovalEmail, sendFeaturedStoryEmail } from "@/lib/emailService";
import { Eye, CheckCircle, XCircle, Star, Pin, Mail, Users, FileText, TrendingUp, Plus, Edit, Trash2, Shield, ShieldOff, BarChart3, Database } from "lucide-react";
import ArticlePreviewDialog from "@/components/ArticlePreviewDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import RecommendationAnalytics from "@/components/RecommendationAnalytics";
import SubmissionReports from "@/components/SubmissionReports";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserData, setEditUserData] = useState({ full_name: '', email: '' });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage submissions and communications</p>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Article
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Newsletter
            </TabsTrigger>
            <TabsTrigger value="newsletter-analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Newsletter Analytics
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recommendations
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

          <TabsContent value="reports" className="space-y-6">
            <SubmissionReports />
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6">
            <NewsletterManagement />
          </TabsContent>

          <TabsContent value="newsletter-analytics" className="space-y-6">
            <NewsletterAnalytics />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <AdminManualSubmission onSubmissionCreated={fetchSubmissions} />
          </TabsContent>

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
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setPreviewDialogOpen(true);
                          }}
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
                        
                        <Link to={`/admin/edit/${submission.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Article
                          </Button>
                        </Link>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Article</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{submission.product_name}"? 
                                This action cannot be undone and will permanently remove the article.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSubmission(submission.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Article
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

          <TabsContent value="recommendations" className="space-y-6">
            <RecommendationAnalytics />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
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
                                        Are you sure you want to delete {user.full_name || user.email}? 
                                        This action cannot be undone and will remove all user data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUser(user.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete User
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
        
        <ArticlePreviewDialog
          isOpen={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          submission={selectedSubmission}
          onApprove={(submissionId) => updateSubmissionStatus(submissionId, 'approved')}
          onReject={(submissionId) => updateSubmissionStatus(submissionId, 'rejected')}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;