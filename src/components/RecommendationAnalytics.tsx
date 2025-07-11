import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Users, TrendingUp, Mail, FileText, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  name: string;
  email: string;
  reason: string;
  created_at: string;
  email_sent_at: string | null;
  subscribed_at: string | null;
  submitted_story_at: string | null;
  recommender_name: string;
  recommender_email: string;
}

const RecommendationAnalytics = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRecommendation, setNewRecommendation] = useState({
    recommenderName: "",
    recommenderEmail: "",
    name: "",
    email: "",
    reason: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
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

  const createRecommendation = async () => {
    if (!newRecommendation.name || !newRecommendation.email || !newRecommendation.recommenderName || !newRecommendation.recommenderEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Create the recommendation record
      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          name: newRecommendation.name,
          email: newRecommendation.email,
          reason: newRecommendation.reason || null,
          recommender_name: newRecommendation.recommenderName,
          recommender_email: newRecommendation.recommenderEmail,
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
        recommenderEmail: "",
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

  const filteredRecommendations = recommendations.filter(rec =>
    rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.recommender_name.toLowerCase().includes(searchTerm.toLowerCase())
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
    return <div className="p-6">Loading recommendations...</div>;
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
                  <Label htmlFor="recommenderEmail" className="text-right">
                    From Email *
                  </Label>
                  <Input
                    id="recommenderEmail"
                    type="email"
                    value={newRecommendation.recommenderEmail}
                    onChange={(e) => setNewRecommendation(prev => ({...prev, recommenderEmail: e.target.value}))}
                    className="col-span-3"
                    placeholder="recommender@example.com"
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
          <Button onClick={fetchRecommendations} variant="outline">
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
        {filteredRecommendations.map((rec) => (
          <Card key={rec.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div>
                    <h3 className="font-semibold">{rec.name}</h3>
                    <p className="text-sm text-muted-foreground">{rec.email}</p>
                  </div>
                  
                  <div className="text-sm">
                    <p><strong>Recommended by:</strong> {rec.recommender_name} ({rec.recommender_email})</p>
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
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No recommendations found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendationAnalytics;