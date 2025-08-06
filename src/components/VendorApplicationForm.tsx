import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from "sonner";
import { Loader2, Store, CheckCircle } from 'lucide-react';

const vendorApplicationSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().optional(),
  shippingCountry: z.string().optional(),
  vendorBio: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the marketplace terms'),
});

type VendorApplicationData = z.infer<typeof vendorApplicationSchema>;

interface VendorApplicationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const VendorApplicationForm = ({ onSuccess, onCancel }: VendorApplicationFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorApplicationData>({
    resolver: zodResolver(vendorApplicationSchema),
    defaultValues: {
      businessName: '',
      contactEmail: user?.email || '',
      contactPhone: '',
      shippingCountry: '',
      vendorBio: '',
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: VendorApplicationData) => {
    if (!user) {
      toast.error('You must be logged in to apply as a vendor');
      return;
    }

    setIsSubmitting(true);

    try {
      // Add vendor role to user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: user.id,
            role: 'vendor'
          }
        ]);

      if (roleError) {
        throw roleError;
      }

      // Update user profile with vendor information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.businessName,
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Could not update profile:', profileError);
      }

      toast.success('Vendor application submitted successfully! Welcome to our marketplace.');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting vendor application:', error);
      
      if (error.code === '23505') {
        toast.error('You are already a vendor in our marketplace');
      } else {
        toast.error('Failed to submit vendor application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Become a Vendor</CardTitle>
        <CardDescription>
          Join our marketplace and start selling your products to our community of innovators and entrepreneurs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your business or brand name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be displayed as your vendor name in the marketplace
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
                    <Input type="email" placeholder="business@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    We'll use this email for important marketplace communications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional - for customer support and order inquiries
                  </FormDescription>
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
                  <FormDescription>
                    Optional - primary country you'll ship from
                  </FormDescription>
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
                      placeholder="Tell customers about your business, your mission, and what makes your products special..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional - this will be shown on your vendor profile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the marketplace terms and conditions *
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you agree to our vendor terms, commission structure, and marketplace policies.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};