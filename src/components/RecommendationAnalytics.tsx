import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Users, TrendingUp, Mail, FileText, Trash2, Plus, Upload, RefreshCw } from "lucide-react";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  name: string;
  email: string;
  reason: string | null;
  created_at: string;
  email_sent_at: string | null;
  subscribed_at: string | null;
  submitted_story_at: string | null;
  recommender_name: string | null;
  recommender_email: string | null;
}

const RecommendationAnalytics = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkResending, setIsBulkResending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [bulkResendProgress, setBulkResendProgress] = useState({ current: 0, total: 0 });
  const [newRecommendation, setNewRecommendation] = useState({
    recommenderName: "",
    name: "",
    email: "",
    reason: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    console.log('Fetching recommendations...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Recommendations fetch result:', { data, error });

      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }
      
      setRecommendations(data || []);
      console.log('Set recommendations:', data?.length || 0, 'items');
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsSubscribed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ subscribed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Marked as subscribed"
      });
      
      fetchRecommendations();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to update recommendation",
        variant: "destructive"
      });
    }
  };

  const markAsSubmittedStory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ submitted_story_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Marked as submitted story"
      });
      
      fetchRecommendations();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to update recommendation",
        variant: "destructive"
      });
    }
  };

  const deleteRecommendation = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Deleted recommendation for ${name}`
      });
      
      fetchRecommendations();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to delete recommendation",
        variant: "destructive"
      });
    }
  };

  const resendRecommendation = async (rec: Recommendation) => {
    try {
      // Send the recommendation email
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'recommendation',
          to: rec.email,
          name: rec.name,
          recommenderName: rec.recommender_name
        }
      });

      // Update the email_sent_at timestamp
      const { error } = await supabase
        .from('recommendations')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', rec.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Recommendation email resent to ${rec.name}`
      });

      fetchRecommendations();
    } catch (error) {
      console.error('Error resending recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to resend recommendation email",
        variant: "destructive"
      });
    }
  };

  const bulkResendRecommendations = async () => {
    if (!recommendations.length) {
      toast({
        title: "No recommendations",
        description: "There are no recommendations to resend",
        variant: "destructive"
      });
      return;
    }

    setIsBulkResending(true);
    setBulkResendProgress({ current: 0, total: recommendations.length });

    let successCount = 0;
    let errorCount = 0;

    try {
      // Process recommendations in batches of 3 to avoid rate limiting
      const batchSize = 3;
      
      for (let i = 0; i < recommendations.length; i += batchSize) {
        const batch = recommendations.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (rec) => {
          try {
            // Send the recommendation email
            await supabase.functions.invoke('send-email', {
              body: {
                type: 'recommendation',
                to: rec.email,
                name: rec.name,
                recommenderName: rec.recommender_name || 'America Innovates Team'
              }
            });

            // Update the email_sent_at timestamp
            await supabase
              .from('recommendations')
              .update({ email_sent_at: new Date().toISOString() })
              .eq('id', rec.id);

            successCount++;
          } catch (error) {
            console.error(`Error resending to ${rec.name}:`, error);
            errorCount++;
          }

          setBulkResendProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }));

        // Add a small delay between batches
        if (i + batchSize < recommendations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast({
        title: "Bulk resend completed",
        description: `Successfully resent ${successCount} emails. ${errorCount > 0 ? `${errorCount} failed.` : ''}`
      });

      fetchRecommendations();
    } catch (error) {
      console.error('Error in bulk resend:', error);
      toast({
        title: "Error",
        description: "Failed to complete bulk resend operation",
        variant: "destructive"
      });
    } finally {
      setIsBulkResending(false);
      setBulkResendProgress({ current: 0, total: 0 });
    }
  };

  const createRecommendation = async () => {
    if (!newRecommendation.name || !newRecommendation.email || !newRecommendation.recommenderName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Get the current authenticated user's email for RLS compliance
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create the recommendation record
      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          name: newRecommendation.name,
          email: newRecommendation.email,
          reason: newRecommendation.reason || null,
          recommender_name: newRecommendation.recommenderName,
          recommender_email: user?.email || null, // Use authenticated user's email for RLS compliance
          email_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send the recommendation email
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'recommendation',
          to: newRecommendation.email,
          name: newRecommendation.name,
          recommenderName: newRecommendation.recommenderName
        }
      });

      toast({
        title: "Success",
        description: `Recommendation created and email sent to ${newRecommendation.name}`
      });

      // Reset form and close dialog
      setNewRecommendation({
        recommenderName: "",
        name: "",
        email: "",
        reason: ""
      });
      setCreateDialogOpen(false);
      fetchRecommendations();

    } catch (error) {
      console.error('Error creating recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to create recommendation",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSpreadsheetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validate and process the data
      const validRecommendations = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        // Look for variations of column names (case insensitive)
        const fromName = row['From Name'] || row['from name'] || row['From'] || row['from'] || row['Recommender Name'] || row['recommender name'];
        const toName = row['To Name'] || row['to name'] || row['To'] || row['to'] || row['Name'] || row['name'];
        const toEmail = row['To Email'] || row['to email'] || row['Email'] || row['email'];

        if (fromName && toName && toEmail) {
          validRecommendations.push({
            recommenderName: String(fromName).trim(),
            name: String(toName).trim(),
            email: String(toEmail).trim()
          });
        }
      }

      if (validRecommendations.length === 0) {
        toast({
          title: "Error",
          description: "No valid recommendations found. Please ensure your spreadsheet has columns for 'From Name', 'To Name', and 'To Email'.",
          variant: "destructive"
        });
        return;
      }

      setUploadProgress({ current: 0, total: validRecommendations.length });

      // Process recommendations in batches
      const batchSize = 5;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validRecommendations.length; i += batchSize) {
        const batch = validRecommendations.slice(i, i + batchSize);
        
        for (const rec of batch) {
          try {
            // Get the current authenticated user's email for RLS compliance
            const { data: { user } } = await supabase.auth.getUser();
            
            // Create the recommendation record
            const { error: dbError } = await supabase
              .from('recommendations')
              .insert({
                name: rec.name,
                email: rec.email,
                reason: null,
                recommender_name: rec.recommenderName,
                recommender_email: user?.email || null, // Use authenticated user's email for RLS compliance
                email_sent_at: new Date().toISOString()
              });

            if (dbError) throw dbError;

            // Send the recommendation email
            await supabase.functions.invoke('send-email', {
              body: {
                type: 'recommendation',
                to: rec.email,
                name: rec.name,
                recommenderName: rec.recommenderName
              }
            });

            successCount++;
          } catch (error) {
            console.error(`Error processing recommendation for ${rec.name}:`, error);
            errorCount++;
          }

          setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }

        // Small delay between batches to avoid overwhelming the system
        if (i + batchSize < validRecommendations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast({
        title: "Upload Complete",
        description: `Successfully processed ${successCount} recommendations. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      setUploadDialogOpen(false);
      fetchRecommendations();

    } catch (error) {
      console.error('Error processing spreadsheet:', error);
      toast({
        title: "Error",
        description: "Failed to process spreadsheet. Please check the file format.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const filteredRecommendations = recommendations.filter(rec =>
    rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rec.recommender_name && rec.recommender_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: recommendations.length,
    emailsSent: recommendations.filter(r => r.email_sent_at).length,
    subscribed: recommendations.filter(r => r.subscribed_at).length,
    submittedStory: recommendations.filter(r => r.submitted_story_at).length
  };

  const successRate = stats.total > 0 ? {
    subscription: ((stats.subscribed / stats.total) * 100).toFixed(1),
    submission: ((stats.submittedStory / stats.total) * 100).toFixed(1)
  } : { subscription: '0', submission: '0' };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recommendation Analytics</h2>
        <div className="flex gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Recommendation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Recommendation</DialogTitle>
                <DialogDescription>
                  Manually create a recommendation and send an email to the recommended person.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recommenderName" className="text-right">
                    From Name *
                  </Label>
                  <Input
                    id="recommenderName"
                    value={newRecommendation.recommenderName}
                    onChange={(e) => setNewRecommendation(prev => ({...prev, recommenderName: e.target.value}))}
                    className="col-span-3"
                    placeholder="Recommender's name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    To Name *
                  </Label>
                  <Input
                    id="name"
                    value={newRecommendation.name}
                    onChange={(e) => setNewRecommendation(prev => ({...prev, name: e.target.value}))}
                    className="col-span-3"
                    placeholder="Person being recommended"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    To Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newRecommendation.email}
                    onChange={(e) => setNewRecommendation(prev => ({...prev, email: e.target.value}))}
                    className="col-span-3"
                    placeholder="person@example.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reason" className="text-right">
                    Reason
                  </Label>
                  <Textarea
                    id="reason"
                    value={newRecommendation.reason}
                    onChange={(e) => setNewRecommendation(prev => ({...prev, reason: e.target.value}))}
                    className="col-span-3"
                    placeholder="Why are you recommending this person? (optional)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createRecommendation} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create & Send Email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Spreadsheet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload Recommendations Spreadsheet</DialogTitle>
                <DialogDescription>
                  Upload an Excel or CSV file with columns: "From Name", "To Name", and "To Email". 
                  Each row will create a recommendation and send an email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="spreadsheet">Choose File</Label>
                  <Input
                    id="spreadsheet"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleSpreadsheetUpload}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
                  </p>
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing recommendations...</span>
                      <span>{uploadProgress.current}/{uploadProgress.total}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: uploadProgress.total > 0 ? `${(uploadProgress.current / uploadProgress.total) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Expected column headers:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>From Name</strong> - Name of the person making the recommendation</li>
                    <li><strong>To Name</strong> - Name of the person being recommended</li>
                    <li><strong>To Email</strong> - Email address of the person being recommended</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  {isUploading ? "Processing..." : "Cancel"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={!recommendations.length || isBulkResending}>
                <Mail className="h-4 w-4 mr-2" />
                {isBulkResending ? 'Resending...' : 'Resend All Emails'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resend All Recommendation Emails</AlertDialogTitle>
                <AlertDialogDescription>
                  This will resend recommendation emails to all {recommendations.length} people in your list. 
                  Are you sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              {isBulkResending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sending emails...</span>
                    <span>{bulkResendProgress.current}/{bulkResendProgress.total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: bulkResendProgress.total > 0 ? `${(bulkResendProgress.current / bulkResendProgress.total) * 100}%` : '0%' 
                      }}
                    />
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isBulkResending}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={bulkResendRecommendations}
                  disabled={isBulkResending}
                >
                  {isBulkResending ? 'Sending...' : 'Resend All'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button onClick={fetchRecommendations} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribed}</div>
            <p className="text-xs text-muted-foreground">
              {successRate.subscription}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted Stories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submittedStory}</div>
            <p className="text-xs text-muted-foreground">
              {successRate.submission}% success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search recommendations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div>
                      <h3 className="font-semibold">{rec.name}</h3>
                      <p className="text-sm text-muted-foreground">{rec.email}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p><strong>Recommended by:</strong> {rec.recommender_name || 'Unknown'} {rec.recommender_email ? `(${rec.recommender_email})` : ''}</p>
                      <p><strong>Date:</strong> {new Date(rec.created_at).toLocaleDateString()}</p>
                      {rec.reason && (
                        <p><strong>Reason:</strong> {rec.reason}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {rec.email_sent_at && (
                        <Badge variant="secondary">Email Sent</Badge>
                      )}
                      {rec.subscribed_at && (
                        <Badge variant="default">Subscribed</Badge>
                      )}
                      {rec.submitted_story_at && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Submitted Story
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resendRecommendation(rec)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Resend
                    </Button>
                    {!rec.subscribed_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsSubscribed(rec.id)}
                      >
                        Mark Subscribed
                      </Button>
                    )}
                    {!rec.submitted_story_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsSubmittedStory(rec.id)}
                      >
                        Mark Submitted Story
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Recommendation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the recommendation for {rec.name}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteRecommendation(rec.id, rec.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-2">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No recommendations match your search" : "No recommendations found"}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-muted-foreground">
                    Create your first recommendation using the "Create Recommendation" button above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RecommendationAnalytics;
