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
import { CheckCircle, XCircle, Store, Calendar, User, Mail, Phone, Globe, MessageSquare, Clock, Eye, Trash2, UserPlus, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ManualVendorCreation } from './ManualVendorCreation';
import { ProductVendorAssignment } from './ProductVendorAssignment';

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
  const [bulkResending, setBulkResending] = useState(false);
  const [bulkResendProgress, setBulkResendProgress] = useState({ sent: 0, total: 0 });
  const [deletingVendor, setDeletingVendor] = useState<string | null>(null);
  const [showManualVendorDialog, setShowManualVendorDialog] = useState(false);

  const fetchApplications = async () => {
    try {
      // Fetch vendor applications without joins since foreign key relationships aren't properly set up
      const { data, error } = await supabase
        .from('vendor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vendor applications:', error);
        throw error;
      }

      setApplications((data || []) as VendorApplication[]);
      
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
        // Send congratulations email
        try {
          const { data: applicationData } = await supabase
            .from('vendor_applications')
            .select('*')
            .eq('id', applicationId)
            .single();

          if (applicationData) {
            await supabase.functions.invoke('send-vendor-approval', {
              body: {
                application: applicationData
              }
            });
          }
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          // Don't fail the approval if email fails
        }

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
        // Send rejection email
        try {
          const { data: applicationData } = await supabase
            .from('vendor_applications')
            .select('*')
            .eq('id', selectedApplicationId)
            .single();

          if (applicationData) {
            const { sendVendorRejectionEmail } = await import('@/lib/emailService');
            await sendVendorRejectionEmail(applicationData);
          }
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
          // Don't fail the rejection if email fails
        }

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

  const bulkResendApprovalEmails = async () => {
    const approvedVendors = applications.filter(app => app.status === 'approved');
    
    if (approvedVendors.length === 0) {
      toast.error('No approved vendors found to send emails to');
      return;
    }

    setBulkResending(true);
    setBulkResendProgress({ sent: 0, total: approvedVendors.length });

    try {
      // Process in batches to avoid overwhelming the email service
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < approvedVendors.length; i += batchSize) {
        batches.push(approvedVendors.slice(i, i + batchSize));
      }

      let totalSent = 0;

      for (const batch of batches) {
        const emailPromises = batch.map(async (vendor) => {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                type: 'notification',
                to: vendor.contact_email,
                subject: 'Congratulations! Your Vendor Application Has Been Approved',
                message: `
                  Congratulations ${vendor.business_name}!<br><br>
                  Your vendor application has been approved and you can now start selling on America Innovates Marketplace.<br><br>
                  <strong>Next Steps:</strong><br>
                  • Log into your account to access your vendor dashboard<br>
                  • <a href="https://americainnovates.us/marketplace/add" style="color: #2563eb; text-decoration: underline;">Start adding your product now</a><br>
                  • Complete your vendor profile<br><br>
                  We're excited to have you as part of our marketplace community!
                `,
                name: vendor.business_name
              }
            });
            return { success: true, vendor: vendor.business_name };
          } catch (error) {
            console.error(`Failed to send email to ${vendor.business_name}:`, error);
            return { success: false, vendor: vendor.business_name, error };
          }
        });

        const results = await Promise.all(emailPromises);
        const successful = results.filter(r => r.success).length;
        totalSent += successful;
        
        setBulkResendProgress({ sent: totalSent, total: approvedVendors.length });

        // Add delay between batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast.success(`Successfully sent ${totalSent} approval emails out of ${approvedVendors.length} approved vendors`);
    } catch (error) {
      console.error('Error during bulk email send:', error);
      toast.error('Failed to send bulk approval emails');
    } finally {
      setBulkResending(false);
      setBulkResendProgress({ sent: 0, total: 0 });
    }
  };

  const handleDeleteVendor = async (applicationId: string, userId: string, businessName: string) => {
    try {
      console.log('Starting vendor deletion process:', { applicationId, userId, businessName });
      setDeletingVendor(applicationId);
      
      // Remove vendor role from user_roles table
      console.log('Removing vendor role for user:', userId);
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'vendor');

      if (roleError) {
        console.error('Error removing vendor role:', roleError);
        throw roleError;
      }
      console.log('Successfully removed vendor role');

      // Get current user for reviewed_by field
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('Current user for reviewed_by:', currentUser.user?.id);

      // Update vendor application status to rejected (to keep record)
      console.log('Updating vendor application status to rejected');
      const { error: appError } = await supabase
        .from('vendor_applications')
        .update({ 
          status: 'rejected',
          rejection_reason: 'Vendor access revoked by administrator',
          reviewed_by: currentUser.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (appError) {
        console.error('Error updating application status:', appError);
        throw appError;
      }
      console.log('Successfully updated application status');

      // Deactivate all vendor's products
      console.log('Deactivating vendor products');
      const { error: productError } = await supabase
        .from('marketplace_products')
        .update({ status: 'inactive' })
        .eq('vendor_id', userId);

      if (productError) {
        console.error('Error deactivating products:', productError);
        // Don't throw here as it's not critical
      } else {
        console.log('Successfully deactivated vendor products');
      }

      toast.success(`Vendor "${businessName}" has been removed successfully`);
      console.log('Vendor deletion completed successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error(`Failed to remove vendor: ${error.message || 'Unknown error'}`);
    } finally {
      setDeletingVendor(null);
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Vendor Applications</CardTitle>
              <CardDescription>
                Review and manage vendor applications for the marketplace
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowManualVendorDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Vendor
              </Button>
              
              <Button
                onClick={bulkResendApprovalEmails}
                disabled={bulkResending || stats.approved === 0}
                variant="outline"
              >
                {bulkResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Sending ({bulkResendProgress.sent}/{bulkResendProgress.total})
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend All Approval Emails ({stats.approved})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="manual">Manual Creation</TabsTrigger>
              <TabsTrigger value="products">Product Assignment</TabsTrigger>
            </TabsList>
            
            {/* Vendor Applications List */}
            {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'rejected' || activeTab === 'all') && (
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
                                
                                {application.status === 'approved' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        disabled={deletingVendor === application.id}
                                      >
                                        {deletingVendor === application.id ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-1" />
                                        )}
                                        Remove Vendor
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Vendor Access</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently remove vendor privileges from {application.business_name}. 
                                          Their products will be deactivated and they will no longer be able to manage their marketplace presence.
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteVendor(application.id, application.user_id, application.business_name)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Remove Vendor Access
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
            )}
            
            {/* Manual Vendor Creation Tab */}
            <TabsContent value="manual" className="mt-6">
              <div className="border rounded-lg p-6">
                <ManualVendorCreation 
                  open={true} 
                  onOpenChange={() => {}} 
                  onSuccess={fetchApplications} 
                />
              </div>
            </TabsContent>
            
            {/* Product Assignment Tab */}
            <TabsContent value="products" className="mt-6">
              <ProductVendorAssignment />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};