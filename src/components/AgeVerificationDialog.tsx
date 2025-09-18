import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AgeVerificationDialogProps {
  open: boolean;
  onVerified: (verified: boolean) => void;
}

const AgeVerificationDialog = ({ open, onVerified }: AgeVerificationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleVerification = async (isOver18: boolean) => {
    setLoading(true);
    
    if (isOver18 && user) {
      // Update user's age verification status in the database
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ age_verified: true })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating age verification:', error);
          toast({
            title: "Error",
            description: "Failed to save age verification. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error saving age verification:', error);
        toast({
          title: "Error",
          description: "Failed to save age verification. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onVerified(isOver18);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Age Verification Required</AlertDialogTitle>
          <AlertDialogDescription>
            This product contains adult content. You must be 18 or older to view this product.
            Are you 18 years of age or older?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => handleVerification(false)}
            disabled={loading}
          >
            No, I am under 18
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => handleVerification(true)}
            disabled={loading}
          >
            {loading ? "Saving..." : "Yes, I am 18 or older"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AgeVerificationDialog;