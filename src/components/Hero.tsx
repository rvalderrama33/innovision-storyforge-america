
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const { user, isAdmin, signOut } = useAuth();

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

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-2 lg:px-12 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Link to="/">
            <img 
              src="/lovable-uploads/0b7aab03-b403-4c89-bfbb-d50750598cce.png" 
              alt="America Innovates Magazine" 
              className="h-48 lg:h-60"
            />
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white hover:text-gray-200 transition-colors font-medium">Magazine</Link>
          <Link to="/submit" className="text-white hover:text-gray-200 transition-colors font-medium">Submit Story</Link>
          <Link to="/about" className="text-white hover:text-gray-200 transition-colors font-medium">About</Link>
          {isAdmin && (
            <Link to="/admin" className="text-white hover:text-gray-200 transition-colors font-medium">
              <Settings className="inline h-4 w-4 mr-1" />
              Admin
            </Link>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white">
                Welcome, {user.email}
              </span>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="border-white/30 text-black bg-white/90 hover:bg-white"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" className="border-white/30 text-black bg-white/90 hover:bg-white">
                  Sign In
                </Button>
              </Link>
              <Link to="/submit">
                <Button className="bg-white hover:bg-gray-100 text-gray-900 border-0 px-6 py-2">
                  Submit Story
                </Button>
              </Link>
            </>
          )}
          <Menu className="md:hidden h-6 w-6 text-white" />
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 px-6 py-12 lg:px-12 lg:py-20">
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
