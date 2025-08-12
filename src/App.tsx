
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
import DeliveryDashboard from "./pages/DeliveryDashboard";
import DeliveryPending from "./pages/DeliveryPending";
import DeliveryRejection from "./pages/DeliveryRejection";
import Shipping from "./pages/Shipping";
import Profile from "./pages/Profile";
import { Analytics } from "@vercel/analytics/react";
import VendorOnboarding from "./pages/VendorOnboarding";

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
            <Route path="/admin" element={<Admin />} />
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
            <Route path="/vendor-onboarding" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['vendor']} allowedVendorStatuses={['pending']}>
                <VendorOnboarding />
              </AuthGuard>
            } />
            <Route path="/vendor-rejection" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['vendor']} allowedVendorStatuses={['rejected']}>
                <VendorRejection />
              </AuthGuard>
            } />
            <Route path="/shop" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['customer']}>
                <ShopDashboard />
              </AuthGuard>
            } />
            <Route path="/product/:productId" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['customer']}>
                <ProductDetail />
              </AuthGuard>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/delivery-dashboard" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['delivery']}>
                <DeliveryDashboard />
              </AuthGuard>
            } />
            <Route path="/delivery-pending" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['delivery']}>
                <DeliveryPending />
              </AuthGuard>
            } />
            <Route path="/delivery-rejection" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['delivery']}>
                <DeliveryRejection />
              </AuthGuard>
            } />
            <Route path="/shipping" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['customer']}>
                <Shipping />
              </AuthGuard>
            } />
            <Route path="/profile" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['customer']}>
                <Profile />
              </AuthGuard>
            } />
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
