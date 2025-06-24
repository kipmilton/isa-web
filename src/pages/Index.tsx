
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import TryFreeDialog from "@/components/TryFreeDialog";
import { Link } from "react-router-dom";
import { MessageCircle, Search, ShoppingBag, Smartphone, Apple, Play, Quote } from "lucide-react";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showTryFreeDialog, setShowTryFreeDialog] = useState(false);

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleTryFree = () => {
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
              <a href="#how-it-works" className="text-gray-600 hover:text-orange-600 transition-colors">How it Works</a>
              <a href="#trending" className="text-gray-600 hover:text-orange-600 transition-colors">Trending</a>
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

      {/* Mobile App Promotion */}
      <section className="bg-gradient-to-r from-orange-500 to-yellow-500 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Smartphone className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Shop on the Go</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Download our mobile app for iOS and Android. Get personalized recommendations anywhere, anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="bg-white text-orange-600 hover:bg-gray-50 border-0">
              <Apple className="h-5 w-5 mr-2" />
              Download for iOS
            </Button>
            <Button variant="outline" className="bg-white text-orange-600 hover:bg-gray-50 border-0">
              <Play className="h-5 w-5 mr-2" />
              Get on Android
            </Button>
          </div>
        </div>
      </section>

      {/* How ISA Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How ISA Works for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Ask us anything</h3>
              <p className="text-gray-600">WhatsApp-style chat interface. Tell us what you're looking for, your style, and budget.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Get personalized results</h3>
              <p className="text-gray-600">Our AI finds the best products & deals based on your style, preferences, and budget.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Buy easily</h3>
              <p className="text-gray-600">Purchase directly from top brands & platforms with confidence and security.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founders' Words */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            A Word from Our Founders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Quote className="h-8 w-8 text-orange-500 mb-4" />
              <p className="text-gray-600 mb-4 italic">
                "We're building ISA to make quality products accessible to everyone in Africa. Our AI doesn't just recommend products—it understands your unique style and budget to find exactly what you need."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-orange-700 font-bold">NK</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Neema Kinoti</h4>
                  <p className="text-gray-500 text-sm">CEO & Co-founder</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Quote className="h-8 w-8 text-orange-500 mb-4" />
              <p className="text-gray-600 mb-4 italic">
                "Technology should simplify life, not complicate it. We've designed ISA to be as intuitive as chatting with a friend who happens to know everything about shopping and style."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-orange-700 font-bold">MK</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Milton Kiprop</h4>
                  <p className="text-gray-500 text-sm">CTO & Co-founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products / Trending */}
      <section id="trending" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What's Trending
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Top Picks Under KES 5,000</h3>
              <p className="text-gray-600 mb-4">Affordable fashion and lifestyle essentials that don't compromise on quality.</p>
              <Link to="/chat">
                <Button variant="outline" className="border-pink-500 text-pink-600 hover:bg-pink-50">
                  Explore Collection
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Sustainable Fashion</h3>
              <p className="text-gray-600 mb-4">Eco-friendly brands and products that care for our planet and communities.</p>
              <Link to="/chat">
                <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                  Shop Sustainable
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Local African Brands</h3>
              <p className="text-gray-600 mb-4">Support homegrown talent with unique products made right here in Africa.</p>
              <Link to="/chat">
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  Discover Local
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Soft Brand Mention */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            ✨ Trusted by select African & global brands
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're working with a curated group of ethical, sustainable and local vendors to bring you the best products at the best prices.
          </p>
          <Link to="/vendors">
            <Button variant="outline" className="border-gray-400 text-gray-600 hover:bg-gray-100">
              Want to become a vendor? Apply here
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-800">ISA</span>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-500">
              <Link to="/vendors" className="hover:text-orange-600 transition-colors">
                Become a Vendor
              </Link>
              <a href="#" className="hover:text-orange-600 transition-colors">Contact us</a>
              <a href="#" className="hover:text-orange-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-600 transition-colors">Terms</a>
            </div>
          </div>
          <div className="text-center text-gray-500 text-xs mt-4">
            &copy; {new Date().getFullYear()} ISA. All rights reserved.
          </div>
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
