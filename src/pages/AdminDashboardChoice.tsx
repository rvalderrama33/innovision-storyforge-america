import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, TrendingUp, Package, ShoppingCart, CreditCard, BarChart3, Settings, ArrowRight, Shield, FileText, Store } from 'lucide-react';

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
              <div className="mx-auto mb-4 flex justify-center">
                <img src="/lovable-uploads/2108e82a-9d65-4ee6-b974-51aa5bc01a16.png" alt="America Innovates Magazine Logo" className="h-48 w-48 object-contain" />
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
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Article submissions & approvals
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    Newsletter management
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                    Content analytics & reports
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Settings className="h-4 w-4 mr-2 text-blue-600" />
                    Content customization
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
              <div className="mx-auto mb-4 flex justify-center">
                <img src="/lovable-uploads/25521c59-14bd-4565-990e-aa4d304aa849.png" alt="America Innovates Marketplace Logo" className="h-48 w-48 object-contain" />
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
                    <Store className="h-4 w-4 mr-2 text-green-600" />
                    Vendor application reviews
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

        {/* Quick Access - Shared Platform Features */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Quick Access - Shared Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/users" className="block">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1 hover:bg-blue-50">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">User Management</span>
              </Button>
            </Link>
            <Link to="/admin/emails" className="block">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1 hover:bg-blue-50">
                <Mail className="h-5 w-5" />
                <span className="text-sm font-medium">Email System</span>
              </Button>
            </Link>
            <Link to="/admin/marketplace/vendors" className="block">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1 hover:bg-green-50">
                <Store className="h-5 w-5" />
                <span className="text-sm font-medium">Vendor Management</span>
              </Button>
            </Link>
            <Link to="/admin/security" className="block">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1 hover:bg-red-50">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Security Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardChoice;