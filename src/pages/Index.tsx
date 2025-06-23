
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthDialog from "@/components/auth/AuthDialog";
import TryFreeDialog from "@/components/TryFreeDialog";
import { Brain, ShoppingBag, Users, MessageCircle, Star, CheckCircle } from "lucide-react";

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authType, setAuthType] = useState<'customer' | 'vendor'>('customer');
  const [tryFreeOpen, setTryFreeOpen] = useState(false);

  const handleAuthClick = (type: 'customer' | 'vendor') => {
    setAuthType(type);
    setAuthDialogOpen(true);
  };

  const featuredProducts = [
    { title: "Top Picks Under KES 5,000", image: "photo-1649972904349-6e44c42644a7", category: "Fashion" },
    { title: "Sustainable Fashion", image: "photo-1581091226825-a6a2a5aee158", category: "Eco-Friendly" },
    { title: "Tech Essentials", image: "photo-1519389950473-47ba0277781c", category: "Electronics" },
    { title: "Local Brands", image: "photo-1581092795360-fd1ca04f0952", category: "Made in Africa" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">ISA</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#trending" className="text-gray-600 hover:text-gray-900 transition-colors">Trending</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => handleAuthClick('customer')} variant="outline" size="sm">Sign In</Button>
            <Button onClick={() => handleAuthClick('customer')} size="sm">Sign Up Free</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Shop Smarter, <span className="bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">Buy Better</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Discover fashion, lifestyle & essentials curated just for you — powered by AI.
          </p>
          <p className="text-lg text-gray-500 mb-12 italic">
            "Powered by AI. Designed for Trust. Built for Africa"
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              onClick={() => setTryFreeOpen(true)}
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Start Shopping
            </Button>
            <Button 
              onClick={() => handleAuthClick('customer')}
              variant="outline" 
              size="lg"
            >
              Sign Up Free
            </Button>
          </div>

          {/* App Download Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 mb-16">
            <h3 className="text-2xl font-semibold mb-4">Download Our App</h3>
            <p className="text-gray-600 mb-6">Get the full ISA experience on your mobile device</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => alert("Coming Soon!")}>
                <span>📱</span>
                <span>App Store</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => alert("Coming Soon!")}>
                <span>🤖</span>
                <span>Google Play</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How ISA Works Section */}
      <section id="how-it-works" className="bg-white/40 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16">How ISA Works</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">1. Ask us anything</h3>
                <p className="text-gray-600">WhatsApp-style chat or app interface - just tell us what you're looking for</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">2. Get personalized recommendations</h3>
                <p className="text-gray-600">AI finds the best products & deals based on your style, budget, and preferences</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">3. Buy easily</h3>
                <p className="text-gray-600">Shop from top brands & platforms with confidence and convenience</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products / What's Trending */}
      <section id="trending" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">What's Trending</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/${product.image}?w=400&h=300&fit=crop`} 
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{product.title}</CardTitle>
                      <span className="text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline" onClick={() => setTryFreeOpen(true)}>
                      Explore Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Soft Brand Mention */}
      <section className="bg-white/40 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-2xl font-semibold">Trusted by select African & global brands</h3>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              We're working with a curated group of ethical, sustainable and local vendors.
            </p>
            <Button variant="outline" onClick={() => window.open('/vendors', '_blank')} className="text-sm">
              Want to become a vendor? Apply here
            </Button>
          </div>
        </div>
      </section>

      {/* About/Vision Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">About ISA</h2>
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4 text-orange-600">Our Vision</h3>
                <p className="text-gray-700">
                  To become Africa's leading AI-powered shopping platform that empowers consumers with intelligent 
                  shopping decisions while fostering economic growth across the continent.
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4 text-green-600">Our Mission</h3>
                <p className="text-gray-700">
                  To democratize access to intelligent shopping assistance through cutting-edge AI technology, 
                  building trust between consumers and vendors while supporting African businesses.
                </p>
              </div>
            </div>

            {/* Founders */}
            <div className="grid md:grid-cols-2 gap-12">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">NK</span>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Neema Kinoti</h3>
                <p className="text-orange-600 font-medium mb-4">CEO & Co-founder</p>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl">
                  <p className="text-gray-700 italic">
                    "ISA represents our commitment to making shopping smarter and more accessible for everyone in Africa. 
                    We're building trust through AI that truly understands our market."
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">MK</span>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Milton Kiprop</h3>
                <p className="text-green-600 font-medium mb-4">CTO & Co-founder</p>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl">
                  <p className="text-gray-700 italic">
                    "Our AI is built with African consumers in mind, understanding local preferences, 
                    budgets, and shopping behaviors to deliver truly relevant recommendations."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="w-8 h-8" />
              <span className="text-xl font-bold">ISA</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="/vendors" className="text-gray-400 hover:text-white transition-colors">Become a Vendor</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact us</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm border-t border-gray-800 pt-8">
            <p>© 2024 ISA. Powered by AI. Designed for Trust. Built for Africa.</p>
            <p className="mt-2">
              <a href="/vendors" className="hover:text-white transition-colors">
                Partner with ISA: isa.africa/vendors
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen} 
        type={authType}
      />
      <TryFreeDialog 
        open={tryFreeOpen} 
        onOpenChange={setTryFreeOpen}
      />
    </div>
  );
};

export default Index;
