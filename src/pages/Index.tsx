import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import TryFreeDialog from "@/components/TryFreeDialog";
import { Link } from "react-router-dom";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showTryFreeDialog, setShowTryFreeDialog] = useState(false);

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleTryFree = () => {
    // Navigate to chat page instead of opening dialog
    window.location.href = '/chat';
  };

  const handleSignIn = () => {
    toast.info("Sign in functionality will be implemented soon!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="h-10 w-10" />
              <span className="text-2xl font-bold text-gray-800">ISA</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/chat" className="text-gray-600 hover:text-orange-600 transition-colors">Ask ISA</Link>
              <a href="#features" className="text-gray-600 hover:text-orange-600 transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-orange-600 transition-colors">About</a>
              <Button onClick={handleSignIn} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="h-20 w-20" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Shop Smarter, Buy Better
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover fashion, lifestyle & essentials curated just for you — powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                Start Shopping
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-3"
              onClick={handleSignIn}
            >
              Sign Up Free
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Powered by AI. Designed for Trust. Built for Africa.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Explore Our Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                AI-Powered Recommendations
              </h3>
              <p className="text-gray-600">
                Get personalized product suggestions based on your unique style and preferences.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Price Comparison
              </h3>
              <p className="text-gray-600">
                Find the best deals by comparing prices from multiple vendors in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Curated Product Selection
              </h3>
              <p className="text-gray-600">
                Discover high-quality products handpicked by our AI from trusted sources.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Fashion & Lifestyle Insights
              </h3>
              <p className="text-gray-600">
                Stay up-to-date with the latest trends and insights in fashion and lifestyle.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Personalized Shopping Lists
              </h3>
              <p className="text-gray-600">
                Create and manage your shopping lists with AI-powered assistance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Vendor Recommendations
              </h3>
              <p className="text-gray-600">
                Find reputable vendors and brands that align with your values and preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div>
              <img
                src="https://images.unsplash.com/photo-1556740758-90de96635814?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                alt="About ISA"
                className="rounded-lg shadow-md"
              />
            </div>

            {/* Text Content */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                About ISA
              </h2>
              <p className="text-gray-600 mb-4">
                ISA is your AI-powered shopping assistant designed to make your online shopping experience smarter and more enjoyable. We leverage cutting-edge artificial intelligence to provide personalized recommendations, price comparisons, and curated product selections.
              </p>
              <p className="text-gray-600">
                Our mission is to empower shoppers with the tools and insights they need to make informed purchasing decisions. Whether you're looking for the latest fashion trends or essential lifestyle products, ISA is here to help you shop smarter and buy better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ISA. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Authentication</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">Authentication will be implemented soon!</p>
            <div className="flex items-center space-x-2">
              <Label htmlFor="theme">Dark Mode</Label>
              <Switch id="theme" checked={isDarkTheme} onCheckedChange={handleThemeToggle} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TryFreeDialog open={showTryFreeDialog} onOpenChange={setShowTryFreeDialog} />
    </div>
  );
};

export default Index;
