import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from "sonner";
import { Loader2, UserPlus } from 'lucide-react';

const manualVendorSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  productTypes: z.string().min(10, 'Please provide at least 10 characters describing product types'),
  shippingCountry: z.string().optional(),
  vendorBio: z.string().optional(),
});

type ManualVendorData = z.infer<typeof manualVendorSchema>;

interface ManualVendorCreationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ManualVendorCreation = ({ open, onOpenChange, onSuccess }: ManualVendorCreationProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManualVendorData>({
    resolver: zodResolver(manualVendorSchema),
    defaultValues: {
      businessName: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      productTypes: '',
      shippingCountry: '',
      vendorBio: '',
    },
  });

  const onSubmit = async (data: ManualVendorData) => {
    setIsSubmitting(true);

    try {
      // First, check if a user exists with this email
      let userId: string;
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.contactEmail)
        .single();

      if (existingProfile) {
        userId = existingProfile.id;
        
        // Check if this user already has a vendor application
        const { data: existingApplication } = await supabase
          .from('vendor_applications')
          .select('id, status')
          .eq('user_id', userId)
          .single();

        if (existingApplication) {
          toast.error(`User already has a ${existingApplication.status} vendor application`);
          return;
        }
      } else {
        // Create a user account for this email
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.contactEmail,
          email_confirm: true,
          user_metadata: {
            full_name: data.businessName
          }
        });

        if (authError) {
          throw authError;
        }

        userId = authData.user.id;
      }

      // Create the vendor application
      const { data: applicationData, error: applicationError } = await supabase
        .from('vendor_applications')
        .insert([
          {
            user_id: userId,
            business_name: data.businessName,
            contact_email: data.contactEmail,
            contact_phone: data.contactPhone || null,
            website: data.website || null,
            product_types: data.productTypes,
            shipping_country: data.shippingCountry || null,
            vendor_bio: data.vendorBio || null,
            status: 'approved'
          }
        ])
        .select()
        .single();

      if (applicationError) {
        throw applicationError;
      }

      // Add vendor role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: userId,
            role: 'vendor'
          }
        ]);

      if (roleError && roleError.code !== '23505') { // Ignore duplicate key error
        throw roleError;
      }

      // Update profile with business name
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: data.contactEmail,
          full_name: data.businessName
        });

      // Send approval email
      try {
        await supabase.functions.invoke('send-vendor-approval', {
          body: {
            application: applicationData
          }
        });
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the creation if email fails
      }

      toast.success(`Vendor "${data.businessName}" created and approved successfully!`);
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating manual vendor:', error);
      
      if (error.code === '23505') {
        toast.error('A vendor with this email already exists');
      } else {
        toast.error('Failed to create vendor. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Vendor Manually
          </DialogTitle>
          <DialogDescription>
            Create a new vendor account directly. The vendor will be automatically approved and can start selling immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Business or brand name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be the vendor's display name in the marketplace
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="vendor@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    If this email doesn't exist in the system, a new user account will be created
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.business.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Types *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the types of products they will sell (e.g., electronics, accessories, software, tools, etc.)..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendorBio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the vendor's business and mission..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Vendor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};