
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/841cd47d-53a5-4d25-9e58-3ab51a099cf8.png" 
            alt="America Innovates Magazine" 
            className="h-12 w-auto"
          />
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="hover:text-orange-300 transition-colors">Magazine</Link>
          <Link to="/submit" className="hover:text-orange-300 transition-colors">Submit Story</Link>
          <Link to="/about" className="hover:text-orange-300 transition-colors">About</Link>
        </div>
        
        <Link to="/submit">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0">
            Share Your Product
          </Button>
        </Link>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 px-6 py-16 lg:px-12 lg:py-24">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Celebrating the
            <span className="text-orange-400"> Product Innovators</span>
            <br />
            Changing How We Live
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
            Discover breakthrough consumer products, meet visionary creators, and explore the innovations that make everyday life better.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/submit">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-4">
                Submit Your Product Innovation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-900 text-lg px-8 py-4"
            >
              Read Latest Product Stories
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full">
        <div className="absolute inset-0 bg-gradient-to-l from-orange-500/30 to-transparent"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/6 w-24 h-24 bg-orange-400/20 rounded-full blur-lg"></div>
      </div>
    </div>
  );
};

export default Hero;
