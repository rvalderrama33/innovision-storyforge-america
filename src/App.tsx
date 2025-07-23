
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import MobileIndex from "./pages/MobileIndex";
import Submit from "./pages/Submit";
import About from "./pages/About";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Article from "./pages/Article";
import ArticleEditor from "./components/ArticleEditor";
import Stories from "./pages/Stories";
import EmailPreview from "./pages/EmailPreview";
import TestOpenAI from "./pages/TestOpenAI";
import PayPalTest from "./pages/PayPalTest";
import StripeTestPage from "./pages/StripeTest";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import SecurityAudit from "./components/SecurityAudit";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mobile" element={<MobileIndex />} />
            <Route path="/submit" element={<ProtectedRoute><Submit /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/article/:slug" element={<Article />} />
            <Route path="/admin/edit/:id" element={<ArticleEditor />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/email-preview" element={<EmailPreview />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            
            
            <Route path="/security-audit" element={<ProtectedRoute><SecurityAudit /></ProtectedRoute>} />
            <Route path="/test-openai" element={<TestOpenAI />} />
            <Route path="/paypal-test" element={<PayPalTest />} />
            <Route path="/stripe-test" element={<StripeTestPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
