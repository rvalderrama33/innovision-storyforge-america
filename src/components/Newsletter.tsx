
import { Button } from "@/components/ui/button";
import { Facebook, Linkedin } from "lucide-react";

const Newsletter = () => {
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
        
        <div className="flex justify-center mb-8">
          <Button 
            className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium rounded-sm"
            onClick={() => window.location.href = '/auth'}
          >
            Subscribe Free
          </Button>
        </div>
        
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
