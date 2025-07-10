
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Linkedin, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { subscribeToNewsletter } from "@/lib/newsletterService";
import { sendWelcomeEmail } from "@/lib/emailService";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await subscribeToNewsletter(email, name || undefined);
      
      // Send welcome email
      try {
        await sendWelcomeEmail(email, name || undefined);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the subscription if email fails
      }
      
      setIsSubscribed(true);
      toast({
        title: "Successfully subscribed!",
        description: "Welcome to America Innovates! Check your email for a welcome message.",
      });
      
      setEmail("");
      setName("");
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <section className="py-20 px-6 lg:px-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Welcome Aboard!
          </h2>
          <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            You're now part of our community of innovators and entrepreneurs. Get ready for inspiring stories and breakthrough products!
          </p>
          
          <div className="flex justify-center gap-6">
            <a
              href="https://www.facebook.com/AmericaInnovatesMagazine"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="https://www.linkedin.com/company/america-innovates-magazine"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Follow us on LinkedIn"
            >
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 lg:px-12 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          Stay Informed
        </h2>
        <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Get the latest consumer product innovations, inventor spotlights, and breakthrough products delivered to your inbox.
        </p>
        
        <form onSubmit={handleSubscribe} className="max-w-md mx-auto mb-8">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium rounded-sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  Subscribing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Subscribe Free
                </div>
              )}
            </Button>
          </div>
        </form>
        
        <p className="text-sm text-gray-400 font-light mb-8">
          Join 50,000+ product enthusiasts and entrepreneurs. Free subscription - Unsubscribe anytime.
        </p>
        
        <div className="flex justify-center gap-6">
          <a
            href="https://www.facebook.com/AmericaInnovatesMagazine"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="Follow us on Facebook"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a
            href="https://www.linkedin.com/company/america-innovates-magazine"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="Follow us on LinkedIn"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
