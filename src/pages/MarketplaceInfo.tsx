import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { BecomeVendorButton } from '@/components/BecomeVendorButton';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Store, Users, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

const MarketplaceInfo = () => {
  const { user } = useAuth();

  useSEO({
    title: "America Innovates Marketplace | Supporting American Entrepreneurs",
    description: "Discover and support innovative products from American entrepreneurs and creators. Join our multi-vendor marketplace to showcase your innovations.",
    url: "https://americainnovates.us/marketplace-info"
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            America Innovates Marketplace
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A multi-vendor e-commerce platform dedicated to supporting American entrepreneurs and creators. 
            Discover breakthrough consumer products and connect directly with the innovators behind them.
          </p>
          
          {user ? (
            <BecomeVendorButton />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">Sign in to apply as a vendor</p>
              <Link to="/auth">
                <Button size="lg">
                  Sign In to Apply
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Vendor Platform</h3>
              <p className="text-gray-600">
                Join a curated marketplace where American entrepreneurs can showcase their innovative products to engaged customers.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Focused</h3>
              <p className="text-gray-600">
                Connect with customers who value innovation and want to support American-made products and creators.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Easy Setup</h3>
              <p className="text-gray-600">
                Simple vendor application process with comprehensive tools to manage your products and connect with buyers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Join Our Marketplace?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start selling your innovative products to customers who appreciate American entrepreneurship and creativity.
          </p>
          
          {user ? (
            <BecomeVendorButton />
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 font-medium">You must be signed in to apply as a vendor</p>
              <Link to="/auth">
                <Button size="lg" className="mr-4">
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="py-16 border-t bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            🚀 Launching Soon
          </h3>
          <p className="text-gray-600 mb-6">
            The America Innovates Marketplace is currently in development. Be among the first to join our community of innovative vendors and help shape the future of American entrepreneurship.
          </p>
          <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md mx-auto">
            <p className="text-sm text-gray-500 mb-2">Ready to get started?</p>
            <p className="font-medium text-gray-900">Submit your vendor application today!</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketplaceInfo;