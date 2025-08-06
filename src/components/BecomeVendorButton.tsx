import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { VendorApplicationForm } from '@/components/VendorApplicationForm';
import { Store, ArrowRight } from 'lucide-react';

export const BecomeVendorButton = () => {
  const { user, isVendor, loading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Don't show the button if user is not logged in, still loading, or already a vendor
  if (!user || loading || isVendor) {
    return null;
  }

  const handleSuccess = () => {
    setIsDialogOpen(false);
    // The auth context will automatically update the isVendor status
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="group" size="lg">
          <Store className="h-5 w-5 mr-2" />
          Become a Vendor
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <VendorApplicationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
};