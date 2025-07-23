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
  const [showTerms, setShowTerms] = useState(false);
  const [authDefaultVendor, setAuthDefaultVendor] = useState(false);

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
      name: "Sophia Kariuki",
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
              <img src="/lovable-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" alt="ISA Logo" className="h-10 w-10" />
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
            <img src="/lovable-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" alt="ISA Logo" className="h-20 w-20" />
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
            <Link to="/shop">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-3 hover-scale"
              >
                Shop On The Web
              </Button>
            </Link>
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img src="/lovable-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" alt="ISA Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-800">ISA</span>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-500">
              <button className="hover:text-orange-600 transition-colors bg-transparent border-none p-0 m-0" onClick={() => { setAuthDefaultVendor(true); setShowAuth(true); }}>
                Become a Vendor
              </button>
              <a href="#" className="hover:text-orange-600 transition-colors">Contact us</a>
              <button className="hover:text-orange-600 transition-colors bg-transparent border-none p-0 m-0" onClick={() => setShowTerms(true)}>
                Terms and Conditions
              </button>
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
        onOpenChange={(open) => { setShowAuth(open); if (!open) setAuthDefaultVendor(false); }} 
      />

      <TryFreeDialog open={showTryFreeDialog} onOpenChange={setShowTryFreeDialog} />

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">ISA AI Shopping Assistant - Terms & Conditions</h2>
            <h3 className="text-lg font-semibold mt-6">Customer Terms</h3>
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <p><strong>Effective Date:</strong> 7/17/2025</p>
                <p><strong>Version:</strong> 1.0</p>
              </div>
              <p>These Terms and Conditions ("Terms") govern your use of the ISA AI Shopping Assistant platform ("ISA", "we", "us", or "our"), which provides intelligent shopping assistance via app, web, or messaging platforms. By accessing or using ISA, you ("User", "Customer", or "You") agree to be bound by these Terms and our Privacy Policy. Please read them carefully before using the service.</p>
              <h3 className="text-lg font-semibold mt-6">1. OVERVIEW</h3>
              <p>ISA is a smart shopping assistant that uses AI to help users discover, compare, and shop from a variety of brands and vendors. Through ISA, users can:</p>
              <ul className="list-disc ml-6">
                <li>Receive personalized product recommendations</li>
                <li>Compare prices, styles, and features across vendors</li>
                <li>Make purchases directly or be redirected to third-party vendor platforms</li>
                <li>Save favorite items, track orders, and receive promotional deals</li>
              </ul>
              <h3 className="text-lg font-semibold mt-6">2. ELIGIBILITY</h3>
              <p><strong>2.1 Minimum Age:</strong> You must be at least 18 years old or have the consent of a parent or legal guardian to use the platform.</p>
              <p><strong>2.2 Location:</strong> Some services or offers may only be available in specific countries or regions (e.g., Kenya). It is your responsibility to check availability.</p>
              <p><strong>2.3 Account Accuracy:</strong> You agree to provide accurate and current information when creating an account or placing orders. ISA reserves the right to suspend or delete accounts with fraudulent or misleading information.</p>
              <h3 className="text-lg font-semibold mt-6">3. PLATFORM USE</h3>
              <p><strong>3.1 License:</strong> ISA grants you a limited, non-exclusive, non-transferable license to use the platform for personal shopping purposes.</p>
              <p><strong>3.2 Prohibited Use:</strong> You agree not to:</p>
              <ul className="list-disc ml-6">
                <li>Use the platform for illegal or harmful purposes</li>
                <li>Copy, distribute, or modify ISA's technology</li>
                <li>Harass or abuse vendors or other users</li>
                <li>Attempt to reverse-engineer ISA’s AI systems</li>
                <li>Use bots or automated systems to scrape or exploit data</li>
              </ul>
              <p><strong>3.3 Content Ownership:</strong> ISA retains all rights to its technology, content, recommendation engines, and interface. You may not use ISA’s content for commercial purposes without prior written consent.</p>
              <h3 className="text-lg font-semibold mt-6">4. PRODUCT LISTINGS & PRICING</h3>
              <p><strong>4.1 Vendor Responsibility:</strong> All products listed on ISA are supplied by third-party vendors. While ISA aims to curate high-quality, verified listings, the ultimate responsibility for product descriptions, pricing, availability, and delivery lies with the vendor.</p>
              <p><strong>4.2 Pricing Errors:</strong> If an item is listed at an incorrect price, ISA reserves the right to cancel the transaction. You will be notified and refunded in such cases.</p>
              <p><strong>4.3 Availability:</strong> Product availability is subject to change and may differ from real-time listings due to inventory or vendor system delays.</p>
              <h3 className="text-lg font-semibold mt-6">5. ORDERS, PAYMENTS & DELIVERY</h3>
              <p><strong>5.1 Order Process:</strong> You may purchase items directly through ISA or via vendor redirection. You will receive confirmation once an order is successfully placed.</p>
              <p><strong>5.2 Payment Methods:</strong> Payments can be made through supported mobile money, debit/credit cards, or other approved payment gateways.</p>
              <p><strong>5.3 ISA as Facilitator:</strong> In most cases, ISA acts only as a facilitator, not the seller. The transaction contract is between you and the vendor.</p>
              <p><strong>5.4 Delivery:</strong> Delivery times and logistics depend on the vendor or courier service. Estimated delivery times are provided for convenience but are not guaranteed.</p>
              <p><strong>5.5 Fees & Charges:</strong> ISA may charge a service fee, convenience fee, or include promotional discounts. All charges will be clearly displayed before purchase confirmation.</p>
              <h3 className="text-lg font-semibold mt-6">6. CANCELLATIONS, RETURNS & REFUNDS</h3>
              <p><strong>6.1 Cancellation Policy:</strong> Cancellations may be allowed within a specific timeframe. Please check the vendor's terms or contact ISA support for help.</p>
              <p><strong>6.2 Returns & Refunds:</strong> Refunds are handled per the vendor’s policy. If a product is defective, incorrect, or undelivered, ISA may assist in dispute resolution but is not liable for compensation unless it is a direct seller.</p>
              <p><strong>6.3 Refund Timeline:</strong> Refunds (where approved) may take up to 14 working days depending on your payment method.</p>
              <h3 className="text-lg font-semibold mt-6">7. PROMOTIONS, OFFERS & REWARDS</h3>
              <p><strong>7.1 Eligibility:</strong> Some promotions may be limited to specific users, regions, or product categories.</p>
              <p><strong>7.2 ISA Discretion:</strong> ISA may cancel or modify offers without prior notice. Abuse or misuse of promotions may lead to account suspension.</p>
              <p><strong>7.3 Referral Program:</strong> If ISA runs a referral program, rewards are only granted if terms are followed strictly (e.g., minimum spend, first-time user, etc.).</p>
              <h3 className="text-lg font-semibold mt-6">8. DATA PRIVACY & COMMUNICATION</h3>
              <p><strong>8.1 Privacy Policy:</strong> Use of ISA is subject to our [Privacy Policy]. We collect and process your data to provide personalized shopping experiences, improve our services, and for operational analytics.</p>
              <p><strong>8.2 Marketing Communication:</strong> By using ISA, you may receive promotional emails, SMS, or in-app notifications. You can opt-out at any time via your account settings.</p>
              <p><strong>8.3 Third-Party Data:</strong> ISA may share non-personal data with vendors or partners to improve product recommendations and service delivery.</p>
              <h3 className="text-lg font-semibold mt-6">9. ACCOUNT SECURITY</h3>
              <p><strong>9.1 Responsibility:</strong> You are responsible for maintaining the confidentiality of your account login details. ISA is not liable for unauthorized access resulting from negligence.</p>
              <p><strong>9.2 Termination:</strong> ISA reserves the right to suspend or terminate accounts that violate these Terms, post offensive content, engage in fraud, or harm the platform’s reputation.</p>
              <h3 className="text-lg font-semibold mt-6">10. LIMITATION OF LIABILITY</h3>
              <p><strong>10.1 ISA is not liable for:</strong></p>
              <ul className="list-disc ml-6">
                <li>Any direct or indirect damage resulting from vendor errors, failed deliveries, or product defects</li>
                <li>Loss of data, income, or business opportunities</li>
                <li>Platform downtimes, bugs, or technical issues beyond our control</li>
              </ul>
              <p><strong>10.2 ISA’s total liability in any matter shall be limited to the value of the transaction in question or KES 5,000.</strong></p>
              <h3 className="text-lg font-semibold mt-6">11. DISPUTES & GOVERNING LAW</h3>
              <p><strong>11.1 Dispute Resolution:</strong> If you are dissatisfied, please first contact isashoppingai@gmail.com. We aim to resolve issues promptly and fairly.</p>
              <p><strong>11.2 Legal Jurisdiction:</strong> These Terms are governed by the laws of Kenya. Any legal proceedings must be brought before courts located in Kenya.</p>
              <h3 className="text-lg font-semibold mt-6">12. MODIFICATIONS</h3>
              <p>ISA reserves the right to update or modify these Terms at any time. Changes will be communicated via email or posted on the platform. Continued use after updates indicates acceptance of the new Terms.</p>
              <p>By accessing or using ISA, you agree to be bound by these Terms and our Privacy Policy.</p>
            </div>
            <h3 className="text-lg font-semibold mt-6">Vendor Terms</h3>
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <p><strong>Effective Date:</strong> 7/17/2025</p>
                <p><strong>Version:</strong> 1.0</p>
              </div>
              <p>These Terms and Conditions ("Agreement") govern the participation of vendors ("Vendor", "You", or "Your") on the ISA AI Shopping Assistant platform ("ISA", "we", "us", or "our"), operated by ISA AI Shopping Assistant Ltd., a company registered in Kenya. By listing your products or services on ISA or engaging with the ISA team, you agree to abide by these Terms in full.</p>
              <h3 className="text-lg font-semibold mt-6">1. DEFINITIONS</h3>
              <p>"ISA Platform" – The AI-powered mobile and web platform, application interface, API systems, databases, and related services used by customers for smart shopping assistance.</p>
              <p>"Vendor Account" – The registered profile ISA creates or grants access to for managing listings and commercial activity.</p>
              <p>"Product" – Any goods, services, or offers listed by a Vendor.</p>
              <p>"Customer" – End-users or shoppers who use ISA to browse, compare, and purchase Products.</p>
              <p>"Commission" – A percentage fee retained by ISA from sales, unless otherwise negotiated.</p>
              <p>"Listing" – A product's profile including description, pricing, images, stock info, and delivery options.</p>
              <h3 className="text-lg font-semibold mt-6">2. ELIGIBILITY & ONBOARDING</h3>
              <p><strong>2.1 Vendor Approval:</strong> Vendors must complete the ISA onboarding process and be approved by ISA before listing any Products.</p>
              <p><strong>2.2 Accurate Information:</strong> All information provided during onboarding (including business details, contact info, product categories, etc.) must be truthful and regularly updated.</p>
              <p><strong>2.3 Legal Status:</strong> Vendors must be legally registered businesses or individuals eligible to operate and sell products in their respective jurisdiction.</p>
              <h3 className="text-lg font-semibold mt-6">3. PRODUCT LISTINGS & CONTENT</h3>
              <p><strong>3.1 Responsibility:</strong> Vendors are solely responsible for ensuring all listed Products comply with applicable laws, are accurately described, safe, and meet quality standards.</p>
              <p><strong>3.2 Accuracy:</strong> Product names, descriptions, prices, images, shipping timelines, stock levels, and variations must be complete and truthful. Misleading content may result in removal.</p>
              <p><strong>3.3 Intellectual Property:</strong> Vendors must not use copyrighted content, trademarks, or logos without permission. You agree to indemnify ISA against claims related to IP violations.</p>
              <p><strong>3.4 Restricted Items:</strong> Vendors may not list illegal products, counterfeit goods, expired items, or anything ISA deems unsafe or unethical (e.g., weapons, hate merchandise, etc.).</p>
              <h3 className="text-lg font-semibold mt-6">4. ORDER FULFILMENT & CUSTOMER SERVICE</h3>
              <p><strong>4.1 Timeliness:</strong> Vendors must fulfill orders within the agreed timeline. Delays must be communicated to ISA and customers in real time.</p>
              <p><strong>4.2 Delivery:</strong> Where Vendors manage logistics, clear shipping policies and delivery schedules must be defined. Vendors are liable for damaged or undelivered goods if using third-party couriers.</p>
              <p><strong>4.3 Returns & Refunds:</strong> Vendors must adhere to ISA's refund/return policy or provide an equivalent policy approved during onboarding.</p>
              <p><strong>4.4 Customer Complaints:</strong> Vendors are expected to respond to any customer-related complaint or inquiry referred by ISA within 24–48 hours.</p>
              <h3 className="text-lg font-semibold mt-6">5. COMMISSIONS, PAYMENTS & FEES</h3>
              <p><strong>5.1 Commission Structure:</strong> ISA retains a commission on each sale, as agreed upon during onboarding or updated periodically with notice. This may vary by category or volume.</p>
              <p><strong>5.2 Payouts:</strong> Net revenue (after commissions and applicable charges) will be remitted to the Vendor on a [weekly/bi-weekly/monthly] basis, depending on the payout schedule.</p>
              <p><strong>5.3 Deductions:</strong> ISA reserves the right to deduct amounts for:</p>
              <ul className="list-disc ml-6">
                <li>Refunds or chargebacks</li>
                <li>Promotional discounts</li>
                <li>Platform service fees</li>
                <li>Regulatory deductions (e.g., taxes or levies)</li>
              </ul>
              <p><strong>5.4 Taxes:</strong> Vendors are responsible for declaring and remitting their own taxes (e.g., VAT, income tax) to the relevant authorities.</p>
              <h3 className="text-lg font-semibold mt-6">6. PROMOTIONS & MARKETING</h3>
              <p><strong>6.1 Platform Campaigns:</strong> ISA may run promotional campaigns involving Vendor products. Participation may be voluntary or opt-in unless included in partnership agreements.</p>
              <p><strong>6.2 Use of Vendor Content:</strong> Vendors authorize ISA to use their brand name, product images, and offers for platform promotion, newsletters, or AI-generated recommendations.</p>
              <h3 className="text-lg font-semibold mt-6">7. DATA USE & PRIVACY</h3>
              <p><strong>7.1 Confidentiality:</strong> Any commercial terms, internal data, or proprietary insights exchanged between the Vendor and ISA are strictly confidential.</p>
              <p><strong>7.2 Data Ownership:</strong> Customer data (emails, Browse behavior, purchase patterns) collected by ISA remains the property of ISA and may be used in accordance with its Privacy Policy.</p>
              <p><strong>7.3 AI Personalization:</strong> Vendors acknowledge that their product data may be used to train recommendation systems or improve AI user experience.</p>
              <h3 className="text-lg font-semibold mt-6">8. INTELLECTUAL PROPERTY (IP)</h3>
              <p><strong>8.1</strong> Vendors retain ownership of their own IP, including logos, product designs, and branded assets.</p>
              <p><strong>8.2</strong> Any technology, code, AI system, or platform developed by ISA (including interface logic, chatbot systems, or analytics dashboards) remains ISA's exclusive IP.</p>
              <p><strong>8.3</strong> Vendors may not reverse engineer, replicate, or commercialize ISA's platform or proprietary features.</p>
              <h3 className="text-lg font-semibold mt-6">9. SUSPENSION & TERMINATION</h3>
              <p><strong>9.1</strong> ISA reserves the right to suspend or terminate a Vendor account at any time, with or without notice, if the Vendor:</p>
              <ul className="list-disc ml-6">
                <li>Breaches these Terms</li>
                <li>Provides false or harmful listings</li>
                <li>Damages ISA's brand or user trust</li>
                <li>Violates laws or ethical guidelines</li>
              </ul>
              <p><strong>9.2</strong> Upon termination:</p>
              <ul className="list-disc ml-6">
                <li>All listings are removed from the platform;</li>
                <li>Outstanding dues will be settled after accounting for refunds, claims, and disputes.</li>
              </ul>
              <h3 className="text-lg font-semibold mt-6">10. LIABILITY & INDEMNITY</h3>
              <p><strong>10.1</strong> Vendors agree to indemnify and hold harmless ISA, its officers, and agents from any claims, damages, or liabilities resulting from:</p>
              <ul className="list-disc ml-6">
                <li>Product defects, misinformation, or regulatory violations</li>
                <li>Intellectual property disputes</li>
                <li>Loss or injury related to delivered goods</li>
              </ul>
              <p><strong>10.2</strong> ISA is not liable for:</p>
              <ul className="list-disc ml-6">
                <li>Vendor-side delivery failures</li>
                <li>Third-party payment gateway interruptions</li>
                <li>Technical downtime beyond its control</li>
              </ul>
              <h3 className="text-lg font-semibold mt-6">11. RELATIONSHIP</h3>
              <p>These Terms do not create any partnership, joint venture, or employment relationship. Vendors act as independent parties.</p>
              <h3 className="text-lg font-semibold mt-6">12. MODIFICATIONS</h3>
              <p>ISA may update these Terms from time to time. Vendors will be notified of major changes via email or platform notice. Continued use of the platform constitutes acceptance.</p>
              <h3 className="text-lg font-semibold mt-6">13. GOVERNING LAW & DISPUTES</h3>
              <p>These Terms are governed by the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kenya.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
