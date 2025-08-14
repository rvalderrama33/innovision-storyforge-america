import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Users, Send, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EMAIL_TEMPLATES, EmailTemplate } from '@/lib/emailTemplates';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  user_roles: Array<{ role: string }>;
}


interface BulkEmailManagerProps {
  users: User[];
  onRefresh: () => void;
}

const BulkEmailManager: React.FC<BulkEmailManagerProps> = ({ users, onRefresh }) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // All available email templates from centralized configuration
  const emailTemplates = EMAIL_TEMPLATES;

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const getSelectedUsersData = () => {
    return users.filter(user => selectedUsers.includes(user.id));
  };

  const sendBulkEmails = async () => {
    if (selectedUsers.length === 0 || !selectedTemplate) {
      toast({
        title: "Missing Information",
        description: "Please select users and an email template",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const selectedUsersData = getSelectedUsersData();
      let successCount = 0;
      let errorCount = 0;

      // Send emails in batches to avoid overwhelming the system
      for (const user of selectedUsersData) {
        try {
          // Build email body based on template type
          let emailBody: any = {
            type: selectedTemplate,
            to: user.email,
            name: user.full_name || 'User'
          };

          // Add specific parameters based on email type
          if (selectedTemplate === 'featured_story_promotion') {
            // For featured story promotion, we need submissionId and productName
            // Since we don't have submission data in bulk email, we'll skip this template
            console.warn('Featured story promotion emails should be sent individually, not in bulk');
            errorCount++;
            continue;
          } else {
            // For other templates, use generic subject and message
            emailBody.subject = `Important Update from America Innovates`;
            emailBody.message = `Hello ${user.full_name || 'there'}, we have an important update for you.`;
          }

          const { error } = await supabase.functions.invoke('send-email', {
            body: emailBody
          });

          if (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
          errorCount++;
        }

        // Small delay between emails to be respectful to the email service
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "Bulk Email Complete",
        description: `Successfully sent ${successCount} emails. ${errorCount} failed.`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      // Reset state
      setSelectedUsers([]);
      setSelectedTemplate('');
      setIsDialogOpen(false);
      
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk emails",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
  const isPartiallySelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Manager
        </CardTitle>
        <CardDescription>
          Send emails to multiple users using available email templates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <div>
                <p className="font-medium">
                  {selectedUsers.length === 0 
                    ? 'No users selected' 
                    : `${selectedUsers.length} of ${users.length} users selected`
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Select users to send bulk emails
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {users.length} Total Users
              </Badge>
              {selectedUsers.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {selectedUsers.length} Selected
                </Badge>
              )}
            </div>
          </div>

          {/* User Selection Table */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isAdmin = user.user_roles?.some((role: any) => role.role === 'admin');
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserSelection(user.id)}
                        />
                      </TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Send Email Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={selectedUsers.length === 0} 
                className="w-full"
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Email to Selected Users ({selectedUsers.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Bulk Email</DialogTitle>
                <DialogDescription>
                  Send an email using a template to {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Email Template</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an email template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.type} value={template.type}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {template.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Users Preview */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Recipients ({selectedUsers.length})</label>
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                    <div className="space-y-1">
                      {getSelectedUsersData().map((user) => (
                        <div key={user.id} className="text-sm">
                          <span className="font-medium">{user.full_name || 'Unknown'}</span>
                          <span className="text-muted-foreground ml-2">{user.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={sendBulkEmails} 
                  disabled={!selectedTemplate || isSending}
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send {selectedUsers.length} Email{selectedUsers.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkEmailManager;