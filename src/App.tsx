
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VendorProvider } from "@/contexts/VendorContext";
import Index from "./pages/Index";
import Vendors from "./pages/Vendors";
import Chat from "./pages/Chat";
import Gift from "./pages/Gift";
import Admin from "./pages/Admin";
import VendorDashboard from "./pages/VendorDashboard";
import VendorStatus from "./components/vendor/VendorStatus";
import NotFound from "./pages/NotFound";
import ShopDashboard from "./pages/ShopDashboard";
import AuthCallback from "./pages/AuthCallback";

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
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/vendor-status" element={<VendorStatus />} />
            <Route path="/shop" element={<ShopDashboard />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </VendorProvider>
  </QueryClientProvider>
);

export default App;
