
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VendorProvider } from "@/contexts/VendorContext";
import { ConfettiProvider } from "@/contexts/ConfettiContext";
import AuthGuard from "./components/auth/AuthGuard";
import { SoundProvider } from "@/contexts/SoundContext";
import Index from "./pages/Index";
import Vendors from "./pages/Vendors";
import Chat from "./pages/Chat";
import Gift from "./pages/Gift";
import Admin from "./pages/Admin";
import Earth from "./pages/Earth";
import VendorDashboard from "./pages/VendorDashboard";
import VendorStatus from "./components/vendor/VendorStatus";
import VendorRejection from "./pages/VendorRejection";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import ShopDashboard from "./pages/ShopDashboard";
import ProductDetail from "./pages/ProductDetail";
import AuthCallback from "./pages/AuthCallback";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import DeliveryPending from "./pages/DeliveryPending";
import DeliveryRejection from "./pages/DeliveryRejection";
import Shipping from "./pages/Shipping";
import Profile from "./pages/Profile";
import CustomerPremium from "./components/customer/CustomerPremium";
import VendorSubscription from "./components/vendor/VendorSubscription";
import { Analytics } from "@vercel/analytics/react";
import VendorOnboarding from "./pages/VendorOnboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <VendorProvider>
      <ConfettiProvider>
        <SoundProvider>
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
          <Route path="/earth/*" element={<Earth />} />
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
            <Route path="/vendor-subscription" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['vendor']} allowedVendorStatuses={['approved']}>
                <VendorSubscription />
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
            <Route path="/my-orders" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['customer']}>
                <MyOrders />
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
            <Route path="/premium" element={
              <AuthGuard requireAuth={true} allowedUserTypes={['customer']}>
                <CustomerPremium />
              </AuthGuard>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
        </SoundProvider>
      </ConfettiProvider>
    </VendorProvider>
    <Analytics />
  </QueryClientProvider>
);

export default App;
