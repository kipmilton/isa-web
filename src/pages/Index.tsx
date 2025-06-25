
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Search, ShieldCheck, Users, Star, Quote } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import TryFreeDialog from "@/components/TryFreeDialog";

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authType, setAuthType] = useState<'customer' | 'vendor'>('customer');
  const [tryFreeDialogOpen, setTryFreeDialogOpen] = useState(false);

  const handleVendorClick = () => {
    setAuthType('vendor');
    setAuthDialogOpen(true);
  };

  const scrollToVendorSection = () => {
    document.getElementById('vendor-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const trendingProducts = [
    {
      name: "African Print Dress",
      price: "$45",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop",
      vendor: "Adaora Fashion"
    },
    {
      name: "Handcrafted Jewelry",
      price: "$28",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop",
      vendor: "Golden Touch"
    },
    {
      name: "Organic Skincare Set",
      price: "$35",
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&fit=crop",
      vendor: "Natural Glow"
    },
    {
      name: "Traditional Fabric",
      price: "$22",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=300&h=300&fit=crop",
      vendor: "Heritage Textiles"
    }
  ];

  const testimonials = [
    {
      text: "ISA helped me find the perfect African print dresses for my boutique. The quality is amazing!",
      author: "Sarah M.",
      role: "Customer",
      rating: 5
    },
    {
      text: "As a vendor, ISA has increased my sales by 300%. The AI recommendations bring the right customers to my products.",
      author: "Kwame A.",
      role: "Vendor",
      rating: 5
    },
    {
      text: "I love how ISA understands my style preferences. Every recommendation is spot on!",
      author: "Amina K.",
      role: "Customer",
      rating: 5
    },
    {
      text: "The platform is so easy to use. I've been able to grow my jewelry business significantly.",
      author: "Grace O.",
      role: "Vendor",
      rating: 5
    },
    {
      text: "ISA's chat feature makes shopping feel personal. It's like having a friend help you shop!",
      author: "David L.",
      role: "Customer",
      rating: 5
    },
    {
      text: "Finally, a platform that showcases authentic African brands. My customers love the quality.",
      author: "Fatima S.",
      role: "Vendor",
      rating: 5
    }
  ];

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
              <a href="#trending" className="text-gray-600 hover:text-orange-500 transition-colors">Trending</a>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-orange-500"
                onClick={scrollToVendorSection}
              >
                Join as Vendor
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
          <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent animate-fade-in">
            Your AI Shopping Assistant
          </h1>
          <p className="text-2xl text-gray-600 mb-12 animate-fade-in">
            Discover a smarter way to shop with personalized recommendations, unbeatable prices, and a seamless experience.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold hover-scale">
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
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 hover-scale">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
              <p className="text-gray-500">Get tailored product suggestions based on your unique style and preferences.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 hover-scale">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Search className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search & Comparison</h3>
              <p className="text-gray-500">Easily compare products, prices, and features to make informed decisions.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 hover-scale">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Trusted Platform</h3>
              <p className="text-gray-500">Shop with confidence knowing your data is protected with top-notch security measures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced with Animations */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 text-xl">Experience the future of shopping in just a few simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-orange-500">1</span>
              </div>
              <div className="h-1 w-16 bg-orange-200 mx-auto mb-4 relative overflow-hidden">
                <div className="h-full bg-orange-500 w-0 group-hover:w-full transition-all duration-1000"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up & Personalize</h3>
              <p className="text-gray-500">Create your account and tell us about your preferences and shopping goals.</p>
            </div>
            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-green-500">2</span>
              </div>
              <div className="h-1 w-16 bg-green-200 mx-auto mb-4 relative overflow-hidden">
                <div className="h-full bg-green-500 w-0 group-hover:w-full transition-all duration-1000 delay-200"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Explore Recommendations</h3>
              <p className="text-gray-500">Browse personalized product suggestions tailored just for you.</p>
            </div>
            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-blue-500">3</span>
              </div>
              <div className="h-1 w-16 bg-blue-200 mx-auto mb-4 relative overflow-hidden">
                <div className="h-full bg-blue-500 w-0 group-hover:w-full transition-all duration-1000 delay-400"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Shop & Save</h3>
              <p className="text-gray-500">Enjoy a seamless shopping experience with unbeatable prices and exclusive deals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section id="trending" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trending Now</h2>
            <p className="text-gray-600 text-xl">Discover what's popular with our community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover-scale">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">by {product.vendor}</p>
                  <p className="text-orange-500 font-bold text-xl">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What People Say About ISA</h2>
            <p className="text-gray-600 text-xl">Real reviews from our amazing community</p>
          </div>
          <div className="relative">
            <div className="flex animate-slide-right space-x-6" style={{
              animation: 'slide-right 30s linear infinite',
              width: 'calc(300px * 12)' // 6 testimonials * 2 for seamless loop
            }}>
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-md min-w-[300px] flex-shrink-0">
                  <div className="flex items-center mb-4">
                    <Quote className="w-6 h-6 text-orange-500 mr-2" />
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Section */}
      <section id="vendor-section" className="py-16 bg-gradient-to-r from-orange-100 to-yellow-100">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Users className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Become a Vendor?</h2>
            <p className="text-xl text-gray-700 mb-8">
              Join thousands of successful vendors who are growing their businesses with ISA. 
              We're currently onboarding selected brands focused on quality, affordability, and African innovation.
            </p>
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold"
              onClick={handleVendorClick}
            >
              Apply as Vendor
            </Button>
            <p className="text-gray-600 text-sm mt-4">We review all applications and get back within 72 hours</p>
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

      <style jsx>{`
        @keyframes slide-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-slide-right {
          animation: slide-right 30s linear infinite;
        }
        
        .hover-scale {
          transition: transform 0.2s ease;
        }
        
        .hover-scale:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default Index;
