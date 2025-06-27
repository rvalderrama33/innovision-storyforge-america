
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Newsletter = () => {
  return (
    <section className="py-16 px-6 lg:px-12 bg-gradient-to-r from-blue-900 to-purple-900 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Stay Inspired Weekly
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Get the latest innovation stories, inventor spotlights, and breakthrough discoveries delivered to your inbox.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className="bg-white text-gray-900 border-0 text-lg py-3"
          />
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
            Subscribe
          </Button>
        </div>
        
        <p className="text-sm text-blue-200 mt-4">
          Join 50,000+ innovators and entrepreneurs. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default Newsletter;
