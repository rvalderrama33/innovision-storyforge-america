
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, Users, FileText, Trash2, Star } from 'lucide-react';
import ArticlePreviewDialog from '@/components/ArticlePreviewDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSubmissions();
      fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const approveSubmission = async (submissionId: string) => {
    try {
      const slug = `article-${Date.now()}`;
      
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          slug: slug
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article approved successfully!",
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve article",
        variant: "destructive",
      });
    }
  };

  const rejectSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article rejected",
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject article",
        variant: "destructive",
      });
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article deleted successfully",
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

  const handleToggleFeatured = async (submissionId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ featured: !currentFeatured })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: currentFeatured ? "Removed from featured" : "Added to featured",
        description: `The story has been ${currentFeatured ? 'removed from' : 'added to'} featured stories.`,
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update featured status.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (submission: any) => {
    setSelectedSubmission(submission);
    setPreviewDialogOpen(true);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Site
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Article Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.product_name || 'Unnamed Product'}
                        </TableCell>
                        <TableCell>{submission.full_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              submission.status === 'approved'
                                ? 'default'
                                : submission.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.featured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(submission.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Preview button - available for all submissions with generated articles */}
                            {submission.generated_article && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreview(submission)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            )}
                            
                            {/* Approval/Rejection buttons for pending submissions */}
                            {submission.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveSubmission(submission.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectSubmission(submission.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {/* View Article and Featured buttons for approved submissions */}
                            {submission.status === 'approved' && (
                              <>
                                {submission.slug && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/article/${submission.slug}`)}
                                  >
                                    View Article
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleToggleFeatured(submission.id, submission.featured)}
                                  variant={submission.featured ? "default" : "outline"}
                                  className={submission.featured ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  {submission.featured ? 'Unfeature' : 'Feature'}
                                </Button>
                              </>
                            )}
                            
                            {/* Delete button - available for all submissions */}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSubmission(submission.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge>
                            {user.user_roles?.[0]?.role || 'subscriber'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Article Preview Dialog */}
        <ArticlePreviewDialog
          isOpen={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          submission={selectedSubmission}
          onApprove={approveSubmission}
          onReject={rejectSubmission}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
