import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 lg:px-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/">
            <img 
              src="/lovable-uploads/6218fd7c-785e-4f2a-bc61-c86ab85dcc0e.png" 
              alt="America Innovates Magazine" 
              className="h-12 lg:h-16"
            />
          </Link>
        </div>
        
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
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.email}
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
            <>
              <Link to="/auth">
                <Button variant="outline">
                  Sign In
                </Button>
              </Link>
              <Link to="/submit">
                <Button>
                  Submit Story
                </Button>
              </Link>
            </>
          )}
          <Menu className="md:hidden h-6 w-6 text-gray-700" />
        </div>
      </div>
    </nav>
  );
};

export default Header;