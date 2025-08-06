
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchDialog from "@/components/SearchDialog";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const isMarketplacePage = location.pathname.startsWith('/marketplace');

  if (isMobile) {
    return (
      <nav className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <SidebarTrigger />
          <Link to={isMarketplacePage ? "/marketplace" : "/"} className="block">
            <LogoComponent isMobile={true} isMarketplace={isMarketplacePage} />
          </Link>
          <div className="flex items-center space-x-2">
            <SearchDialog />
            {user ? (
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-3 w-3" />
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Desktop Layout
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 lg:px-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
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
    </nav>
  );
};

export default Header;
