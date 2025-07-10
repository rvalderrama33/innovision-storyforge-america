import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  getNewsletters, 
  createNewsletter, 
  updateNewsletter, 
  getNewsletterSubscribers,
  getSubscriptionStats,
  type Newsletter 
} from "@/lib/newsletterService";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Send, Eye, Users, Mail, TrendingUp, BarChart3 } from "lucide-react";

const NewsletterManagement = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSubscribers: 0, newThisMonth: 0, unsubscribesThisMonth: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [sendingNewsletter, setSendingNewsletter] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [newslettersData, subscribersData, statsData] = await Promise.all([
        getNewsletters(),
        getNewsletterSubscribers(),
        getSubscriptionStats()
      ]);
      
      setNewsletters(newslettersData as Newsletter[]);
      setSubscribers(subscribersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load newsletter data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !subject || !content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNewsletter({
        title,
        subject,
        content,
        html_content: content, // Simple HTML conversion
        status: 'draft'
      });

      toast({
        title: "Newsletter created",
        description: "Your newsletter has been saved as a draft",
      });

      setShowCreateDialog(false);
      setTitle("");
      setSubject("");
      setContent("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create newsletter",
        variant: "destructive",
      });
    }
  };

  const handleSendNewsletter = async (newsletter: Newsletter, isTest = false) => {
    if (isTest && !testEmail) {
      toast({
        title: "Test email required",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setSendingNewsletter(newsletter.id);

    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          newsletterId: newsletter.id,
          testEmail: isTest ? testEmail : undefined
        }
      });

      if (error) throw error;

      toast({
        title: isTest ? "Test email sent" : "Newsletter sent",
        description: isTest 
          ? `Test email sent to ${testEmail}` 
          : `Newsletter sent to ${data.successCount} subscribers`,
      });

      if (!isTest) {
        loadData(); // Refresh data to show updated status
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter",
        variant: "destructive",
      });
    } finally {
      setSendingNewsletter(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Newsletter Management</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Newsletter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Newsletter</DialogTitle>
              <DialogDescription>
                Create a new newsletter to send to your subscribers
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateNewsletter} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Newsletter title"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content (HTML)</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Newsletter content in HTML format"
                  rows={10}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Newsletter</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unsubscribesThisMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Newsletters</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsletters.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletters List */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletters</CardTitle>
          <CardDescription>
            Manage your newsletters and view performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {newsletters.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No newsletters created yet. Create your first newsletter to get started.
              </p>
            ) : (
              newsletters.map((newsletter) => (
                <div key={newsletter.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{newsletter.title}</h3>
                        {getStatusBadge(newsletter.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Subject: {newsletter.subject}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Recipients: {newsletter.recipient_count}</span>
                        <span>Opens: {newsletter.open_count}</span>
                        <span>Clicks: {newsletter.click_count}</span>
                        {newsletter.sent_at && (
                          <span>Sent: {new Date(newsletter.sent_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {newsletter.status === 'draft' && (
                        <>
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="test@example.com"
                              value={testEmail}
                              onChange={(e) => setTestEmail(e.target.value)}
                              className="w-40"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendNewsletter(newsletter, true)}
                              disabled={sendingNewsletter === newsletter.id}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Test
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSendNewsletter(newsletter, false)}
                            disabled={sendingNewsletter === newsletter.id}
                          >
                            {sendingNewsletter === newsletter.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                            ) : (
                              <Send className="w-4 h-4 mr-1" />
                            )}
                            Send to All
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscribers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscribers</CardTitle>
          <CardDescription>
            Latest newsletter subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subscribers.slice(0, 10).map((subscriber) => (
              <div key={subscriber.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">{subscriber.full_name || 'Anonymous'}</div>
                  <div className="text-sm text-muted-foreground">{subscriber.email}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(subscriber.subscribed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {subscribers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No subscribers yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterManagement;