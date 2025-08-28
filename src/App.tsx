
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { initializeCSRF } from "@/lib/csrf";
import { initializeSessionSecurity, monitorSession } from "@/lib/sessionSecurity";
import { useEffect, lazy, Suspense } from "react";
import Index from "./pages/Index";
import MobileIndex from "./pages/MobileIndex";
import Submit from "./pages/Submit";
import About from "./pages/About";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDashboardChoice from "./pages/AdminDashboardChoice";
import MarketplaceAdminDashboard from "./pages/MarketplaceAdminDashboard";
import Article from "./pages/Article";
import ArticleEditor from "./components/ArticleEditor";
import Stories from "./pages/Stories";
import EmailPreview from "./pages/EmailPreview";
import TestOpenAI from "./pages/TestOpenAI";
import ConnectionTest from "./pages/ConnectionTest";
import Recommend from "./pages/Recommend";
import MarketplaceInfo from "./pages/MarketplaceInfo";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import FeaturedUpgrade from "./pages/FeaturedUpgrade";

// Lazy load marketplace components for better performance
const Marketplace = lazy(() => import("./pages/Marketplace"));
const MarketplaceAdd = lazy(() => import("./pages/MarketplaceAdd"));
const MarketplaceProduct = lazy(() => import("./pages/MarketplaceProduct"));
const MarketplaceManage = lazy(() => import("./pages/MarketplaceManage"));
const MarketplaceEdit = lazy(() => import("./pages/MarketplaceEdit"));
const MarketplaceOrders = lazy(() => import("./pages/MarketplaceOrders"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccessMarketplace = lazy(() => import("./pages/PaymentSuccessMarketplace"));

import SecurityAudit from "./components/SecurityAudit";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const SecurityInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Initialize security features
    initializeCSRF();
    initializeSessionSecurity();
    monitorSession();
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <SecurityInitializer>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mobile" element={<MobileIndex />} />
            <Route path="/submit" element={<ProtectedRoute><Submit /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/choice" element={<ProtectedRoute><AdminDashboardChoice /></ProtectedRoute>} />
            <Route path="/admin/marketplace/*" element={<ProtectedRoute><MarketplaceAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/article/:slug" element={<Article />} />
            <Route path="/admin/edit/:id" element={<ArticleEditor />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/email-preview" element={<EmailPreview />} />
            <Route path="/marketplace-info" element={<MarketplaceInfo />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/marketplace-payment-success" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <PaymentSuccessMarketplace />
              </Suspense>
            } />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="/featured-upgrade" element={<FeaturedUpgrade />} />
            
            {/* Marketplace Routes - Lazy loaded for performance */}
            <Route path="/marketplace" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <Marketplace />
              </Suspense>
            } />
            <Route path="/marketplace/add" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <MarketplaceAdd />
              </Suspense>
            } />
            <Route path="/marketplace/product/:id" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <MarketplaceProduct />
              </Suspense>
            } />
            <Route path="/marketplace/manage" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <MarketplaceManage />
              </Suspense>
            } />
            <Route path="/marketplace/orders" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <MarketplaceOrders />
              </Suspense>
            } />
            <Route path="/marketplace/edit/:id" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <MarketplaceEdit />
              </Suspense>
            } />
            <Route path="/vendor/dashboard" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <VendorDashboard />
              </Suspense>
            } />
            <Route path="/cart" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <Cart />
              </Suspense>
            } />
            <Route path="/checkout" element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                <Checkout />
              </Suspense>
            } />
            
            <Route path="/security-audit" element={<ProtectedRoute><SecurityAudit /></ProtectedRoute>} />
            <Route path="/test-openai" element={<TestOpenAI />} />
            <Route path="/connection-test" element={<ConnectionTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </SecurityInitializer>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
