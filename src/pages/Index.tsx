
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AuthDialog from "@/components/auth/AuthDialog";
import TryFreeDialog from "@/components/TryFreeDialog";
import { Brain, Users } from "lucide-react";

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authType, setAuthType] = useState<'customer' | 'vendor'>('customer');
  const [tryFreeOpen, setTryFreeOpen] = useState(false);

  const handleAuthClick = (type: 'customer' | 'vendor') => {
    setAuthType(type);
    setAuthDialogOpen(true);
  };

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
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
            <a href="#vision" className="text-gray-600 hover:text-gray-900 transition-colors">Vision</a>
            <a href="#founders" className="text-gray-600 hover:text-gray-900 transition-colors">Founders</a>
            <a href="#investors" className="text-gray-600 hover:text-gray-900 transition-colors">Investors</a>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => handleAuthClick('customer')} variant="outline" size="sm">Sign In</Button>
            <Button onClick={() => handleAuthClick('vendor')} size="sm">For Vendors</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="w-24 h-24 mx-auto mb-8" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
            Meet ISA
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">Your AI Shopping Assistant</p>
          <p className="text-lg text-gray-500 mb-8 italic">
            "Powered by AI. Designed for Trust. Built for Africa"
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => setTryFreeOpen(true)}
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              <Brain className="mr-2 h-5 w-5" />
              Ask ISA - Try Free
            </Button>
            <Button 
              onClick={() => handleAuthClick('customer')}
              variant="outline" 
              size="lg"
            >
              Get Started
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

      {/* About Section */}
      <section id="about" className="bg-white/40 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">About ISA</h2>
            <p className="text-lg text-gray-600 mb-8">
              ISA is Africa's premier AI Shopping Assistant, designed to revolutionize the way people shop and discover products. 
              Our intelligent assistant helps users find the best products, compare prices, and make informed purchasing decisions 
              while supporting local African businesses and vendors.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section id="vision" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Our Vision & Mission</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4 text-orange-600">Vision</h3>
                <p className="text-gray-700">
                  To become Africa's leading AI-powered shopping platform that empowers consumers with intelligent 
                  shopping decisions while fostering economic growth across the continent.
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4 text-green-600">Mission</h3>
                <p className="text-gray-700">
                  To democratize access to intelligent shopping assistance through cutting-edge AI technology, 
                  building trust between consumers and vendors while supporting African businesses in the digital economy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section id="founders" className="bg-white/40 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">Meet Our Founders</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">NK</span>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Neema Kinoti</h3>
                <p className="text-orange-600 font-medium mb-4">CEO & Co-founder</p>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl">
                  <p className="text-gray-700 italic">
                    "ISA represents our commitment to bridging the gap between technology and trust in African commerce. 
                    We're not just building an AI assistant; we're creating a platform that understands and serves our unique market needs."
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
                    "Our technical vision focuses on creating AI that truly understands African consumers and businesses. 
                    ISA's intelligence is built on local insights, ensuring relevant and trustworthy shopping assistance for everyone."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investors Section */}
      <section id="investors" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Join Our Journey</h2>
            <p className="text-xl text-gray-600 mb-8">
              Interested in investing in the future of African commerce?
            </p>
            <div className="bg-gradient-to-r from-orange-500 to-green-500 p-8 rounded-2xl text-white">
              <h3 className="text-2xl font-semibold mb-4">Investment Opportunities</h3>
              <p className="mb-6">
                Be part of revolutionizing shopping in Africa. ISA is seeking strategic investors 
                who share our vision of AI-powered commerce transformation.
              </p>
              <Button size="lg" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                <Users className="mr-2 h-5 w-5" />
                Contact for Investment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="w-8 h-8" />
              <span className="text-xl font-bold">ISA</span>
            </div>
            <p className="text-gray-400 text-center md:text-right">
              © 2024 ISA. Powered by AI. Designed for Trust. Built for Africa.
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
