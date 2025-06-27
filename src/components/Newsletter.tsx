
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
          <Input 
            type="email" 
            placeholder="Enter your email address" 
            className="bg-white text-gray-900 border-0 text-lg py-4 px-6 rounded-sm"
          />
          <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium rounded-sm">
            Subscribe
          </Button>
        </div>
        
        <p className="text-sm text-gray-400 font-light">
          Join 50,000+ product enthusiasts and entrepreneurs. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default Newsletter;
