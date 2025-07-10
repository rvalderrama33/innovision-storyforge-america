
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=6000&q=80"
          alt="Group of people smiling together"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Mobile Logo at Top */}
      <div className="relative z-20 md:hidden flex justify-center pt-4 pb-2">
        <Link to="/">
          <img 
            src="/lovable-uploads/0b7aab03-b403-4c89-bfbb-d50750598cce.png" 
            alt="America Innovates Magazine" 
            className="h-24 w-auto max-w-[280px] object-contain"
          />
        </Link>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 px-6 pb-12 lg:px-12 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 text-white">
              Spotlighting
              <span className="block text-gray-200 italic font-light"> Entrepreneurs & Creators</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Discover breakthrough consumer products from visionary entrepreneurs and creators who are building the innovations that make everyday life better.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900 text-lg px-8 py-4 font-medium">
                  Share Your Innovation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Link to="/stories">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-black bg-white/90 hover:bg-white text-lg px-8 py-4 font-medium"
                >
                  Browse Stories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-gray-300 rounded-full z-5"></div>
      <div className="absolute bottom-1/3 left-1/6 w-1 h-1 bg-gray-400 rounded-full z-5"></div>
      <div className="absolute top-1/2 right-1/6 w-3 h-3 bg-gray-200 rounded-full z-5"></div>
    </div>
  );
};

export default Hero;
