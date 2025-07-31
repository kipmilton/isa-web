
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VendorProvider } from "@/contexts/VendorContext";
import AuthGuard from "./components/auth/AuthGuard";
import Index from "./pages/Index";
import Vendors from "./pages/Vendors";
import Chat from "./pages/Chat";
import Gift from "./pages/Gift";
import Admin from "./pages/Admin";
import VendorDashboard from "./pages/VendorDashboard";
import VendorStatus from "./components/vendor/VendorStatus";
import VendorRejection from "./pages/VendorRejection";
import NotFound from "./pages/NotFound";
import ShopDashboard from "./pages/ShopDashboard";
import ProductDetail from "./pages/ProductDetail";
import AuthCallback from "./pages/AuthCallback";
import { Analytics } from "@vercel/analytics/react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <VendorProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/gift" element={<Gift />} />
            <Route path="/admin" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['vendor']} allowedVendorStatuses={['approved']}>
                <Admin />
              </AuthGuard>
            } />
            <Route path="/vendor-dashboard" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['vendor']} allowedVendorStatuses={['approved']}>
                <VendorDashboard />
              </AuthGuard>
            } />
            <Route path="/vendor-status" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['vendor']} allowedVendorStatuses={['pending']}>
                <VendorStatus />
              </AuthGuard>
            } />
            <Route path="/vendor-rejection" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['vendor']} allowedVendorStatuses={['rejected']}>
                <VendorRejection />
              </AuthGuard>
            } />
            <Route path="/shop" element={<ShopDashboard />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </VendorProvider>
    <Analytics />
  </QueryClientProvider>
);

export default App;
