import { Button } from "@/components/ui/button";
import { ArrowRight, Menu } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=6000&q=80"
          alt="Entrepreneurs working together"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/85"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12 border-b border-gray-200/50 backdrop-blur-sm bg-white/50">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            America Innovates
          </h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Magazine</Link>
          <Link to="/submit" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Submit Story</Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">About</Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/submit">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white border-0 px-6 py-2">
              Submit Story
            </Button>
          </Link>
          <Menu className="md:hidden h-6 w-6 text-gray-700" />
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 px-6 py-12 lg:px-12 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 text-gray-900">
              Spotlighting the
              <span className="block text-gray-600 italic font-light"> Builders of Tomorrow</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Discover breakthrough consumer products, meet visionary creators, and explore the innovations that make everyday life better.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white text-lg px-8 py-4 font-medium">
                  Share Your Innovation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-4 font-medium"
              >
                Browse Stories
              </Button>
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
