import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const LogoComponent = ({ isMobile = false }: { isMobile?: boolean }) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    // Fallback to text logo if image fails to load
    return (
      <div className={`text-center ${isMobile ? 'py-4' : ''}`}>
        <h1 className={`font-bold text-blue-600 ${isMobile ? 'text-xl' : 'text-lg lg:text-2xl'}`}>
          America Innovates
        </h1>
        <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-xs lg:text-sm'}`}>
          Magazine
        </p>
      </div>
    );
  }

  return (
    <img 
      src="/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png" 
      alt="America Innovates Magazine" 
      className={isMobile 
        ? "h-16 w-auto max-w-[280px] object-contain" 
        : "h-24 w-auto object-contain"
      }
      onError={handleImageError}
      style={{ display: 'block' }}
    />
  );
};

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-1.5 lg:px-12">
      {/* Mobile-first header with logo prominently displayed */}
      <div className="block md:hidden">
        {/* Mobile Layout: Logo centered at top */}
        <div className="flex justify-center mb-3">
          <Link to="/" className="block">
            <LogoComponent isMobile={true} />
          </Link>
        </div>
        
        {/* Mobile: Auth buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-700 truncate max-w-[120px]">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button onClick={signOut} variant="outline" size="sm">
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/submit">
                  <Button size="sm">Submit</Button>
                </Link>
              </div>
            )}
          </div>
          <Menu className="h-6 w-6 text-gray-700" />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/">
              <LogoComponent isMobile={false} />
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Magazine</Link>
            <Link to="/stories" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Browse Stories</Link>
            <Link to="/submit" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Submit Story</Link>
            <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">About</Link>
            {isAdmin && (
              <Link to="/admin" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                <Settings className="inline h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </span>
                <Button onClick={signOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/submit">
                  <Button>Submit Story</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;