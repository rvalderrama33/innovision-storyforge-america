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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";
import { Loader2, Store, CheckCircle, FileText } from 'lucide-react';

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
    console.log('Starting vendor application submission...', { data, user: user?.id });
    
    if (!user) {
      console.error('No user found for vendor application');
      toast.error('You must be logged in to apply as a vendor');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting to Supabase with:', {
        user_id: user.id,
        business_name: data.businessName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone || null,
        shipping_country: data.shippingCountry || null,
        vendor_bio: data.vendorBio || null,
        status: 'pending'
      });

      // Submit vendor application for admin review
      const { data: insertData, error: applicationError } = await supabase
        .from('vendor_applications')
        .insert([
          {
            user_id: user.id,
            business_name: data.businessName,
            contact_email: data.contactEmail,
            contact_phone: data.contactPhone || null,
            shipping_country: data.shippingCountry || null,
            vendor_bio: data.vendorBio || null,
            status: 'pending'
          }
        ])
        .select();

      console.log('Supabase response:', { insertData, applicationError });

      if (applicationError) {
        throw applicationError;
      }

      console.log('Application submitted successfully');
      toast.success('Vendor application submitted successfully! Your application is pending admin review.');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting vendor application:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '23505') {
        toast.error('You have already submitted a vendor application');
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

            {/* Terms and Conditions Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Marketplace Terms and Conditions</h3>
              </div>
              <Card className="border-primary/20">
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-6">
                    <div className="space-y-6 text-sm">
                      <div>
                        <h4 className="font-semibold text-base mb-2">Marketplace Terms and Conditions</h4>
                        <p className="text-muted-foreground mb-4">Effective Date: January 1, 2025</p>
                        <p className="mb-4">
                          Welcome to the America Innovates Marketplace ("Marketplace"), a platform operated by America Innovates through its website www.americainnovates.us ("Website"). These Terms and Conditions ("Agreement") govern your participation as a vendor ("Vendor") on the Marketplace. By registering as a Vendor, submitting products, or using the Marketplace, you agree to be bound by these Terms.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h5 className="font-semibold mb-2">1. Eligibility</h5>
                        <p className="mb-2">To become a Vendor on the Marketplace, you must:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Be at least 18 years old.</li>
                          <li>Submit accurate and complete business information.</li>
                          <li>Accept and comply with these Terms.</li>
                        </ul>
                        <p className="mt-2">We reserve the right to approve, reject, or terminate Vendor accounts at our sole discretion.</p>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">2. Vendor Responsibilities</h5>
                        <p className="mb-2">As a Vendor, you agree to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Submit accurate product listings with appropriate images, descriptions, pricing, and inventory levels.</li>
                          <li>Fulfill orders in a timely manner.</li>
                          <li>Upload valid shipping tracking information immediately after shipment.</li>
                          <li>Maintain up-to-date contact and payment information.</li>
                          <li>Comply with all applicable laws and regulations, including product safety and tax obligations.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">3. Product Listings</h5>
                        <p className="mb-2">Vendors may submit only physical products that they own or manufacture directly.</p>
                        <p className="mb-2">You are solely responsible for:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Fulfilling orders and handling shipping.</li>
                          <li>Managing inventory and pricing.</li>
                          <li>Handling customer questions, returns, or complaints.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">4. Commission and Payments</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>The Marketplace retains a 20% commission on the sale price of each transaction (excluding shipping and tax).</li>
                          <li>Vendors will be paid their net earnings (80%) once per month, for all orders marked as shipped and past the refund window.</li>
                          <li>Vendors are responsible for covering their own shipping costs.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">5. Shipping</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Vendors are required to fulfill and ship orders promptly using their preferred shipping carrier.</li>
                          <li>A valid tracking number must be uploaded to the system for each order.</li>
                          <li>Failure to upload tracking may delay or forfeit payouts.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">6. Returns and Refunds</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Vendors must clearly communicate their return policy.</li>
                          <li>Vendors are responsible for processing refunds in accordance with their stated return policy.</li>
                          <li>Vendors must promptly respond to return or dispute requests from customers.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">7. Prohibited Products</h5>
                        <p className="mb-2">Vendors may not sell:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Illegal or counterfeit goods</li>
                          <li>Weapons, explosives, or hazardous materials</li>
                          <li>Items that violate intellectual property rights</li>
                          <li>Products promoting hate, violence, or discrimination</li>
                          <li>Any items prohibited by local, state, or federal law</li>
                        </ul>
                        <p className="mt-2">We reserve the right to remove any product listing at our discretion.</p>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">8. Termination</h5>
                        <p className="mb-2">We may suspend or terminate your Vendor account at any time for:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Violating these Terms</li>
                          <li>Submitting prohibited products</li>
                          <li>Repeated customer complaints</li>
                          <li>Failing to fulfill orders or upload tracking</li>
                        </ul>
                        <p className="mt-2">In the event of termination, pending payouts may be withheld pending investigation or resolution.</p>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">9. Limitation of Liability</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>The Marketplace is provided "as is" without warranties.</li>
                          <li>We are not liable for damages arising from vendor errors, product issues, customer disputes, or system outages.</li>
                          <li>You agree to hold harmless America Innovates, its affiliates, and employees from any claims arising from your participation.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">10. Modifications</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>We may update these Terms at any time. Continued use of the Marketplace after changes are posted constitutes acceptance of the new Terms.</li>
                          <li>Material changes will be communicated via email or platform notice.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">11. Governing Law</h5>
                        <p>These Terms are governed by the laws of the United States, without regard to its conflict of law rules.</p>
                      </div>

                      <div>
                        <h5 className="font-semibold mb-2">12. Contact</h5>
                        <p className="mb-2">For questions regarding these Terms or your vendor account, contact:</p>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="font-medium">America Innovates Marketplace Team</p>
                          <p>📧 support@americainnovates.us</p>
                          <p>🌐 www.americainnovates.us</p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-primary/20 bg-primary/5 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold">
                      I have read and agree to the Marketplace Terms and Conditions *
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you confirm that you have read the complete terms above and agree to comply with all marketplace policies, commission structure (20%), and vendor responsibilities.
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