
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import TryFreeDialog from "@/components/TryFreeDialog";
import { Link } from "react-router-dom";
import { MessageCircle, Search, ShoppingBag, Smartphone, Apple, Play, Quote, Star, Gift, Home } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<'customer' | 'vendor'>('customer');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showTryFreeDialog, setShowTryFreeDialog] = useState(false);
  const vendorsRef = useRef<HTMLElement>(null);

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleTryFree = () => {
    window.location.href = '/chat';
  };

  const handleSignIn = () => {
    setAuthType('customer');
    setShowAuth(true);
  };

  const handleVendorSignUp = () => {
    setAuthType('vendor');
    setShowAuth(true);
  };

  const handleVendorSignIn = () => {
    setAuthType('vendor');
    setShowAuth(true);
  };

  const scrollToVendors = () => {
    vendorsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const reviews = [
    {
      name: "Sarah Mwangi",
      role: "Fashion Enthusiast",
      type: "customer",
      text: "ISA helped me find the perfect dress for my graduation at half the price I expected!",
      rating: 5
    },
    {
      name: "David Ochieng",
      role: "Small Business Owner",
      type: "vendor",
      text: "Since joining ISA, my sales have increased by 300%. The AI matching is incredible!",
      rating: 5
    },
    {
      name: "Grace Wanjiku",
      role: "University Student",
      type: "customer",
      text: "Finally, a shopping assistant that understands my budget and style. Love it!",
      rating: 5
    },
    {
      name: "Michael Kiprotich",
      role: "Local Designer",
      type: "vendor",
      text: "ISA connects me with customers who truly appreciate handmade African fashion.",
      rating: 5
    },
    {
      name: "Amina Hassan",
      role: "Working Mom",
      type: "customer",
      text: "Shopping with ISA is like having a personal stylist who knows exactly what I need.",
      rating: 5
    },
    {
      name: "John Muthomi",
      role: "Electronics Vendor",
      type: "vendor",
      text: "The quality of customers ISA brings is amazing. They know what they want!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
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
              <Link to="/gift" className="flex items-center text-gray-600 hover:text-orange-600 transition-colors">
                <Gift className="h-4 w-4 mr-1" />
                Gift Someone
              </Link>
              <Button 
                onClick={scrollToVendors} 
                variant="outline" 
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                Join as Vendor
              </Button>
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
          <div className="flex justify-center mb-6 animate-fade-in">
            <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="h-20 w-20" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            Shop Smarter, Buy Better
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in">
            Discover fashion, lifestyle & essentials curated just for you — powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/chat">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 hover-scale">
                Try ISA Free
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-3 hover-scale"
              onClick={handleSignIn}
            >
              Sign Up Free
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4 animate-fade-in">
            Powered by AI. Designed for Trust. Built for Africa.
          </p>
        </div>
      </section>

      {/* Mobile App Promotion */}
      <section className="bg-gradient-to-r from-orange-500 to-yellow-500 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4 animate-scale-in">
            <Smartphone className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Shop on the Go</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Download our mobile app for iOS and Android. Get personalized recommendations anywhere, anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="bg-white text-orange-600 hover:bg-gray-50 border-0 hover-scale flex items-center">
              <Apple className="h-6 w-6 mr-2" />
              Download for iOS
            </Button>
            <Button variant="outline" className="bg-white text-orange-600 hover:bg-gray-50 border-0 hover-scale flex items-center">
              <Play className="h-6 w-6 mr-2" />
              Get on Android
            </Button>
          </div>
        </div>
      </section>

      {/* How ISA Works */}
      <section id="how-it-works" className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16 animate-fade-in">
            How ISA Works for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MessageCircle className="h-10 w-10 text-orange-600" />
              </div>
              <div className="relative">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  1
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ask us anything</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                WhatsApp-style chat interface. Tell us what you're looking for, your style, and budget.
              </p>
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-sm text-orange-700 italic">"Show me trendy dresses under KES 3,000"</p>
              </div>
            </div>
            <div className="text-center group animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Search className="h-10 w-10 text-green-600" />
              </div>
              <div className="relative">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  2
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Get personalized results</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Our AI finds the best products & deals based on your style, preferences, and budget.
              </p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-700 italic">✨ 5 perfect matches found!</p>
              </div>
            </div>
            <div className="text-center group animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <ShoppingBag className="h-10 w-10 text-blue-600" />
              </div>
              <div className="relative">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  3
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Buy easily</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Purchase directly from top brands & platforms with confidence and security.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700 italic">🛒 Secure checkout in 2 clicks</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link to="/chat">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 hover-scale flex items-center mx-auto">
                <Home className="h-5 w-5 mr-2" />
                Back Home
              </Button>
            </Link>
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
            <div className="bg-white rounded-lg p-6 shadow-md hover-scale">
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
            <div className="bg-white rounded-lg p-6 shadow-md hover-scale">
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
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow hover-scale">
              <div className="h-48 bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/9d50b380-2e89-46c9-a242-8f5c708309df.png" 
                  alt="ISA mobile app launch"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">ISA Goes Mobile!</h3>
                <p className="text-gray-600 mb-4">ISA is set to go live on Play Store and App Store on December 12th, 2025. Get ready for the ultimate mobile shopping experience!</p>
                <Link to="/chat">
                  <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                    Be the First to Know
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow hover-scale">
              <div className="h-48 bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/ce883482-92de-4adf-a3c6-a0c82b907ebe.png" 
                  alt="NVIDIA investing in Africa"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">NVIDIA Invests in Africa</h3>
                <p className="text-gray-600 mb-4">NVIDIA is now investing heavily in Africa to ensure they're not left behind in the AI revolution. This means more tech opportunities for African businesses!</p>
                <Link to="/chat">
                  <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow hover-scale">
              <div className="h-48 bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/94a65745-ea22-43d2-a47c-5a99be9bfa56.png" 
                  alt="Jumia partnership"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Shop Jumia via ISA</h3>
                <p className="text-gray-600 mb-4">Exciting news! Buyers will now be able to order from Jumia directly through ISA. More choices, better deals, one platform!</p>
                <Link to="/chat">
                  <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What People Say About ISA */}
      <section className="py-16 bg-gradient-to-r from-orange-50 to-yellow-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What People Say About ISA
          </h2>
          <div className="relative">
            <div className="flex animate-scroll space-x-6" style={{
              animation: 'scroll 30s linear infinite',
              width: 'calc(300px * 12)'
            }}>
              {[...reviews, ...reviews].map((review, index) => (
                <div key={index} className="flex-shrink-0 w-80 bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      review.type === 'customer' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <span className={`text-sm font-bold ${
                        review.type === 'customer' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {review.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm">{review.name}</h4>
                      <p className="text-gray-500 text-xs">{review.role}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      review.type === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {review.type}
                    </div>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Soft Brand Mention */}
      <section ref={vendorsRef} className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            ✨ Trusted by select African Brands
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're working with a curated group of ethical, sustainable and local vendors to bring you the best products at the best prices.
          </p>
          <div className="space-y-3">
            <div>
              <Button 
                onClick={handleVendorSignUp}
                variant="outline" 
                className="border-gray-400 text-gray-600 hover:bg-gray-100 hover-scale"
              >
                Want to become a vendor? Apply here
              </Button>
            </div>
            <div>
              <Button 
                onClick={handleVendorSignIn}
                className="bg-green-500 hover:bg-green-600 text-white hover-scale"
              >
                Sign in as a vendor
              </Button>
            </div>
          </div>
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

      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuth} 
        onOpenChange={setShowAuth} 
        type={authType}
      />

      <TryFreeDialog open={showTryFreeDialog} onOpenChange={setShowTryFreeDialog} />

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .hover-scale {
          transition: transform 0.2s ease-in-out;
        }
        
        .hover-scale:hover {
          transform: scale(1.05);
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
