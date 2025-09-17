import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, UserPlus, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InviteVendorProps {
  context?: 'admin' | 'vendor';
  className?: string;
}

export const InviteVendor = ({ context = 'admin', className = '' }: InviteVendorProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const defaultMessage = context === 'admin' 
    ? "You're invited to become a vendor on America Innovates Marketplace. We believe your products would be a great fit for our platform and community of innovative entrepreneurs."
    : "I'd like to invite you to join America Innovates Marketplace as a vendor. It's been a great platform for my business and I think you'd benefit from the exposure to innovation-focused customers.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.functions.invoke('invite-vendor', {
        body: {
          inviteEmail: email.trim(),
          message: message.trim() || defaultMessage,
          inviterContext: context,
          inviterEmail: user?.email,
          inviterName: user?.user_metadata?.full_name || 'Someone'
        }
      });

      if (error) throw error;

      toast.success('Vendor invitation sent successfully');
      setEmail('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending vendor invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const buttonText = context === 'admin' ? 'Invite Vendor' : 'Invite Someone';
  const dialogTitle = context === 'admin' ? 'Invite New Vendor' : 'Invite Someone to Become a Vendor';
  const dialogDescription = context === 'admin' 
    ? 'Send an invitation to a potential vendor to join the marketplace'
    : 'Know someone who would be great on our marketplace? Invite them to become a vendor!';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <UserPlus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="vendor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder={defaultMessage}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use our default invitation message
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};