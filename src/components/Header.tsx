import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 lg:px-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        {/* Logo Section - Full width on mobile, centered */}
        <div className="flex justify-center md:justify-start">
          <Link to="/">
            <img 
              src="/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png" 
              alt="America Innovates Magazine" 
              className="h-12 md:h-14 lg:h-16 max-w-full object-contain"
            />
          </Link>
        </div>
        
        {/* Navigation and Auth Section */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
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
          
          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                <span className="text-sm text-gray-700 text-center">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </span>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/submit">
                  <Button size="sm">
                    Submit Story
                  </Button>
                </Link>
              </div>
            )}
            <Menu className="md:hidden h-6 w-6 text-gray-700" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;