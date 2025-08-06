import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings, X, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import SearchDialog from "@/components/SearchDialog";

const LogoComponent = ({ isMobile = false, isMarketplace = false }: { isMobile?: boolean; isMarketplace?: boolean }) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={`text-center ${isMobile ? 'py-2' : ''}`}>
        <h1 className={`font-bold text-primary ${isMobile ? 'text-lg' : 'text-xl'}`}>
          America Innovates
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
        ? "h-12 w-auto max-w-[200px] object-contain" 
        : "h-16 w-auto object-contain"
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
  const [searchOpen, setSearchOpen] = useState(false);
  
  const isMarketplacePage = location.pathname.startsWith('/marketplace');

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <nav className="px-4 py-3">
          {/* Mobile: Logo centered at top */}
          <div className="flex justify-center mb-3">
            <Link to={isMarketplacePage ? "/marketplace" : "/"} className="block">
              <LogoComponent isMobile={true} isMarketplace={isMarketplacePage} />
            </Link>
          </div>
          
          {/* Mobile: Utility icons and menu toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <Button onClick={signOut} variant="outline" size="sm">
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="sm">Subscribe</Button>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="p-2"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-background">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button variant="ghost" size="sm" onClick={closeMobileMenu}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex flex-col space-y-4 p-4">
                {isMarketplacePage ? (
                  <>
                    <Link to="/" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      Magazine
                    </Link>
                    <Link to="/marketplace" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      Product Categories
                    </Link>
                    <Link to="/marketplace/add" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      Submit Your Product
                    </Link>
                    <Link to="/about" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      How We Work
                    </Link>
                    <Link to="/about" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      About
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      Magazine
                    </Link>
                    <Link to="/stories" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      Browse Stories
                    </Link>
                    <Link to="/submit" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      Submit Story
                    </Link>
                    <Link to="/recommend" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      Recommend Someone
                    </Link>
                    {isAdmin && (
                      <Link to="/marketplace" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                        Marketplace
                      </Link>
                    )}
                    <Link to="/about" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                      About
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className="text-foreground hover:text-primary py-2 transition-colors" onClick={closeMobileMenu}>
                    <Settings className="inline h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
              </div>
            </div>
          )}
          
          {searchOpen && <SearchDialog />}
        </nav>
      </header>
    );
  }

  // Desktop Layout: Full-width sticky header with three sections
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="px-6 py-4">
        <div className="grid grid-cols-3 items-center w-full">
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <Link to={isMarketplacePage ? "/marketplace" : "/"}>
              <LogoComponent isMobile={false} isMarketplace={isMarketplacePage} />
            </Link>
          </div>
          
          {/* Center: Operational Navigation Menu */}
          <div className="flex items-center justify-center">
            <nav className="flex items-center space-x-6">
              {isMarketplacePage ? (
                <>
                  <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
                    Magazine
                  </Link>
                  <Link to="/marketplace" className="text-foreground hover:text-primary transition-colors font-medium">
                    Categories
                  </Link>
                  <Link to="/marketplace/add" className="text-foreground hover:text-primary transition-colors font-medium">
                    Submit Product
                  </Link>
                  <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">
                    About
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
                    Magazine
                  </Link>
                  <Link to="/stories" className="text-foreground hover:text-primary transition-colors font-medium">
                    Stories
                  </Link>
                  <Link to="/submit" className="text-foreground hover:text-primary transition-colors font-medium">
                    Submit
                  </Link>
                  <Link to="/recommend" className="text-foreground hover:text-primary transition-colors font-medium">
                    Recommend
                  </Link>
                  {isAdmin && (
                    <Link to="/marketplace" className="text-foreground hover:text-primary transition-colors font-medium">
                      Marketplace
                    </Link>
                  )}
                  <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">
                    About
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" className="text-foreground hover:text-primary transition-colors font-medium">
                  <Settings className="inline h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
            </nav>
          </div>
          
          {/* Right: Utility Icons */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-9 w-9 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>
                <Button onClick={signOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Subscribe</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {searchOpen && <SearchDialog />}
      </nav>
    </header>
  );
};

export default Header;