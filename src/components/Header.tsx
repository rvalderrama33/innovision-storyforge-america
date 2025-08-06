
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchDialog from "@/components/SearchDialog";
import { BecomeVendorButton } from "@/components/BecomeVendorButton";

const LogoComponent = ({ isMobile = false, isMarketplace = false }: { isMobile?: boolean; isMarketplace?: boolean }) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={`text-center ${isMobile ? 'py-4' : ''}`}>
        <h1 className={`font-bold text-blue-600 ${isMobile ? 'text-xl' : 'text-lg lg:text-2xl'}`}>
          America Innovates
        </h1>
        <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-xs lg:text-sm'}`}>
          {isMarketplace ? 'Marketplace' : 'Magazine'}
        </p>
      </div>
    );
  }

  const logoSrc = isMarketplace 
    ? "/lovable-uploads/25521c59-14bd-4565-990e-aa4d304aa849.png"
    : "/lovable-uploads/2108e82a-9d65-4ee6-b974-51aa5bc01a16.png";
  
  const altText = isMarketplace 
    ? "America Innovates Marketplace" 
    : "America Innovates Magazine";

  return (
    <img 
      src={logoSrc} 
      alt={altText} 
      className={isMobile 
        ? "h-16 w-auto max-w-[280px] object-contain" 
        : "h-32 w-auto object-contain"
      }
      onError={handleImageError}
      style={{ display: 'block' }}
    />
  );
};

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isMarketplacePage = location.pathname.startsWith('/marketplace');

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (isMobile) {
    return (
      <nav className="bg-white border-b border-gray-200 px-4 py-1.5">
        {/* Mobile Layout: Logo centered at top */}
        <div className="flex justify-center mb-3">
          <Link to={isMarketplacePage ? "/marketplace" : "/"} className="block">
            <LogoComponent isMobile={true} isMarketplace={isMarketplacePage} />
          </Link>
        </div>
        
        {/* Mobile: Auth buttons and menu toggle */}
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
                <Link to="/auth">
                  <Button size="sm">Subscribe</Button>
                </Link>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="sm" onClick={closeMobileMenu}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex flex-col space-y-4 p-4">
              {isMarketplacePage ? (
                <>
                  <Link to="/marketplace" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                    Product Categories
                  </Link>
                  <Link to="/marketplace/add" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                    Submit Your Product
                  </Link>
                  <Link to="/about" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                    How We Work
                  </Link>
                  <Link to="/about" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                    About
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/stories" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                    Browse Stories
                  </Link>
                  <Link to="/submit" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                    Submit Story
                  </Link>
                  <Link to="/recommend" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                    Recommend Someone
                  </Link>
                  {isAdmin && (
                    <Link to="/marketplace" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                      Marketplace
                    </Link>
                  )}
                   <Link to="/about" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                     About
                   </Link>
                 </>
               )}
               <div onClick={closeMobileMenu} className="py-2">
                 <BecomeVendorButton />
               </div>
               {isAdmin && (
                <Link to="/admin" className="text-gray-700 hover:text-gray-900 py-2" onClick={closeMobileMenu}>
                  <Settings className="inline h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    );
  }

  // Desktop Layout
  return (
    <nav className="bg-white border-b border-gray-200">
      {/* Top section with logo and auth */}
      <div className="px-4 py-1.5 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={isMarketplacePage ? "/marketplace" : "/"}>
              <LogoComponent isMobile={false} isMarketplace={isMarketplacePage} />
            </Link>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
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
                  <Link to="/auth">
                    <Button>Subscribe</Button>
                  </Link>
                </>
              )}
            </div>
            <SearchDialog />
          </div>
        </div>
      </div>
      
      {/* Bottom section with navigation menu */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 lg:px-12">
        <div className="flex items-center justify-center space-x-8">
          {isMarketplacePage ? (
            <>
              <Link to="/marketplace" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">Product Categories</Link>
              <Link to="/marketplace/add" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">Submit Your Product</Link>
              <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">How We Work</Link>
              <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">About</Link>
            </>
          ) : (
            <>
              <Link to="/stories" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">Browse Stories</Link>
              <Link to="/submit" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">Submit Story</Link>
              <Link to="/recommend" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">Recommend Someone</Link>
              {isAdmin && (
                <Link to="/marketplace" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">Marketplace</Link>
              )}
               <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">About</Link>
             </>
           )}
           <BecomeVendorButton />
           {isAdmin && (
            <Link to="/admin" className="text-gray-700 hover:text-gray-900 transition-colors font-medium py-1">
              <Settings className="inline h-4 w-4 mr-1" />
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
