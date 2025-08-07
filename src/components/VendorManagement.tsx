import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { CheckCircle, XCircle, Store, Calendar, User, Mail, Phone, Globe, MessageSquare, Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VendorApplication {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  shipping_country: string | null;
  vendor_bio: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  reviewer_profile?: {
    full_name: string;
  };
}

interface VendorStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export const VendorManagement = () => {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [stats, setStats] = useState<VendorStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchApplications = async () => {
    console.log('Fetching vendor applications...');
    try {
      // First try without joins to see if RLS is the issue
      const { data: simpleData, error: simpleError } = await supabase
        .from('vendor_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Simple query result:', { simpleData, simpleError });
      
      if (simpleError) {
        throw simpleError;
      }

      const { data, error } = await supabase
        .from('vendor_applications')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          reviewer_profile:reviewed_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Vendor applications query result:', { data, error });
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setApplications((data || []) as any[]);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(app => app.status === 'pending').length || 0;
      const approved = data?.filter(app => app.status === 'approved').length || 0;
      const rejected = data?.filter(app => app.status === 'rejected').length || 0;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Error fetching vendor applications:', error);
      toast.error('Failed to load vendor applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_vendor_application', {
        _application_id: applicationId
      });

      if (error) throw error;

      if (data) {
        toast.success('Vendor application approved successfully');
        fetchApplications();
      } else {
        toast.error('Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve vendor application');
    }
  };

  const handleReject = async () => {
    if (!selectedApplicationId) return;

    try {
      const { data, error } = await supabase.rpc('reject_vendor_application', {
        _application_id: selectedApplicationId,
        _reason: rejectionReason || null
      });

      if (error) throw error;

      if (data) {
        toast.success('Vendor application rejected');
        fetchApplications();
        setRejectionReason('');
        setSelectedApplicationId(null);
      } else {
        toast.error('Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject vendor application');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Applications</CardTitle>
          <CardDescription>
            Review and manage vendor applications for the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No vendor applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{application.business_name}</div>
                              {application.shipping_country && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <Globe className="h-3 w-3 mr-1" />
                                  {application.shipping_country}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Mail className="h-3 w-3 mr-1" />
                                {application.contact_email}
                              </div>
                              {application.contact_phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {application.contact_phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getStatusBadge(application.status)}
                              {application.reviewed_at && (
                                <div className="text-xs text-muted-foreground">
                                  Reviewed {formatDistanceToNow(new Date(application.reviewed_at))} ago
                                  {application.reviewer_profile && (
                                    <div>by {application.reviewer_profile.full_name}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(application.created_at))} ago
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Vendor Application Details</DialogTitle>
                                    <DialogDescription>
                                      Review the complete vendor application
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Business Name</Label>
                                        <p className="text-sm text-muted-foreground">{application.business_name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <div className="mt-1">{getStatusBadge(application.status)}</div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Contact Email</Label>
                                        <p className="text-sm text-muted-foreground">{application.contact_email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Contact Phone</Label>
                                        <p className="text-sm text-muted-foreground">{application.contact_phone || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Shipping Country</Label>
                                        <p className="text-sm text-muted-foreground">{application.shipping_country || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Applied</Label>
                                        <p className="text-sm text-muted-foreground">
                                          {formatDistanceToNow(new Date(application.created_at))} ago
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {application.vendor_bio && (
                                      <div>
                                        <Label className="text-sm font-medium">Vendor Bio</Label>
                                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                          {application.vendor_bio}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {application.status === 'rejected' && application.rejection_reason && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <Label className="text-sm font-medium text-red-800">Rejection Reason</Label>
                                        <p className="text-sm text-red-700 mt-1">{application.rejection_reason}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {application.status === 'pending' && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Approve Vendor Application</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will approve {application.business_name}'s vendor application and grant them vendor privileges. They will be able to create and manage products in the marketplace.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleApprove(application.id)}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Approve Application
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        onClick={() => setSelectedApplicationId(application.id)}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Vendor Application</DialogTitle>
                                        <DialogDescription>
                                          Provide a reason for rejecting {application.business_name}'s vendor application.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
                                          <Textarea
                                            id="rejection-reason"
                                            placeholder="Explain why this application is being rejected..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={4}
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => {
                                          setRejectionReason('');
                                          setSelectedApplicationId(null);
                                        }}>
                                          Cancel
                                        </Button>
                                        <Button 
                                          onClick={handleReject}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Reject Application
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};