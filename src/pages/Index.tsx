import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Search, ShieldCheck, Users } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { TryFreeDialog } from "@/components/TryFreeDialog";

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authType, setAuthType] = useState<'customer' | 'vendor'>('customer');
  const [tryFreeDialogOpen, setTryFreeDialogOpen] = useState(false);

  const handleVendorClick = () => {
    setAuthType('vendor');
    setAuthDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">ISA</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-orange-500 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-orange-500 transition-colors">How It Works</a>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-orange-500"
                onClick={handleVendorClick}
              >
                Apply as Vendor
              </Button>
              <Button 
                onClick={() => setTryFreeDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Try ISA Free
              </Button>
            </div>
            <Button className="md:hidden">Menu</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
            Your AI Shopping Assistant
          </h1>
          <p className="text-2xl text-gray-600 mb-12">
            Discover a smarter way to shop with personalized recommendations, unbeatable prices, and a seamless experience.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold">
              Get Started <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Explore Our Key Features</h2>
            <p className="text-gray-600 text-xl">Unlock a world of possibilities with our AI-powered shopping platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
              <p className="text-gray-500">Get tailored product suggestions based on your unique style and preferences.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Search className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search & Comparison</h3>
              <p className="text-gray-500">Easily compare products, prices, and features to make informed decisions.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Trusted Platform</h3>
              <p className="text-gray-500">Shop with confidence knowing your data is protected with top-notch security measures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 text-xl">Experience the future of shopping in just a few simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-orange-500">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up & Personalize</h3>
              <p className="text-gray-500">Create your account and tell us about your preferences and shopping goals.</p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green-500">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Explore Recommendations</h3>
              <p className="text-gray-500">Browse personalized product suggestions tailored just for you.</p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-500">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Shop & Save</h3>
              <p className="text-gray-500">Enjoy a seamless shopping experience with unbeatable prices and exclusive deals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-yellow-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Shopping Experience?</h2>
          <p className="text-xl text-white/90 mb-8">Join thousands of satisfied customers who've discovered the future of shopping</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              onClick={() => setTryFreeDialogOpen(true)}
            >
              Try ISA Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg font-semibold"
              onClick={() => {
                setAuthType('customer');
                setAuthDialogOpen(true);
              }}
            >
              Sign Up Now
            </Button>
          </div>
          <p className="text-white/80 text-sm mt-4">Try 5 questions free • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ISA. All rights reserved.
          </p>
        </div>
      </footer>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        type={authType}
      />
      
      <TryFreeDialog 
        open={tryFreeDialogOpen}
        onOpenChange={setTryFreeDialogOpen}
      />
    </div>
  );
};

export default Index;
