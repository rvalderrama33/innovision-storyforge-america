import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, TrendingUp, Package, ShoppingCart, CreditCard, BarChart3, Settings, ArrowRight } from 'lucide-react';

const AdminDashboardChoice = () => {
  const { user, isAdmin, loading } = useAuth();

  useSEO({
    title: "Choose Admin Dashboard | America Innovates",
    description: "Select between Magazine or Marketplace administration dashboard",
    url: "https://americainnovates.us/admin/choice"
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome, Administrator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your administrative dashboard. You can switch between them at any time.
          </p>
        </div>

        {/* Dashboard Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Magazine Dashboard */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4">
                <img src="/lovable-uploads/2108e82a-9d65-4ee6-b974-51aa5bc01a16.png" alt="America Innovates Magazine Logo" className="h-24 w-24 object-contain mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">Magazine Dashboard</CardTitle>
              <CardDescription className="text-base">
                Manage editorial content, submissions, newsletters, and community engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <img src="/lovable-uploads/2108e82a-9d65-4ee6-b974-51aa5bc01a16.png" alt="" className="h-4 w-4 mr-2 object-contain" />
                    Article submissions & approvals
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    Newsletter management
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    User & subscriber management
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                    Analytics & reports
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Settings className="h-4 w-4 mr-2 text-blue-600" />
                    Content & email customization
                  </div>
                </div>
              </div>


              {/* Action Button */}
              <Link to="/admin" className="block">
                <Button className="w-full group-hover:bg-blue-700 transition-colors" size="lg">
                  Access Magazine Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Marketplace Dashboard */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4">
                <img src="/lovable-uploads/25521c59-14bd-4565-990e-aa4d304aa849.png" alt="America Innovates Marketplace Logo" className="h-24 w-24 object-contain mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">Marketplace Dashboard</CardTitle>
              <CardDescription className="text-base">
                Oversee vendor operations, orders, payments, and marketplace growth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <img src="/lovable-uploads/25521c59-14bd-4565-990e-aa4d304aa849.png" alt="" className="h-4 w-4 mr-2 object-contain" />
                    Vendor application management
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="h-4 w-4 mr-2 text-green-600" />
                    Product catalog oversight
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ShoppingCart className="h-4 w-4 mr-2 text-green-600" />
                    Order management
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                    Payment & commission tracking
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                    Sales analytics & reports
                  </div>
                </div>
              </div>


              {/* Action Button */}
              <Link to="/admin/marketplace" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700 transition-colors" size="lg">
                  Access Marketplace Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/admin/vendors">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Vendor Management
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link to="/admin/security">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardChoice;