
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GiftIcon, Heart, Sparkles, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Gift = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: "",
    hobbies: "",
    budget: "",
    relationship: "",
    gender: ""
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check for rejected vendors on page load
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type, status')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.user_type === 'vendor' && profile.status === 'rejected') {
            navigate('/vendor-rejection');
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGetSuggestions = async () => {
    if (!formData.age || !formData.hobbies || !formData.budget) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call with mock data using realistic images
    setTimeout(() => {
      const mockSuggestions = [
        {
          id: 1,
          name: "Wireless Bluetooth Headphones",
          price: "KES 4,500",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
          description: "Perfect for music lovers and tech enthusiasts",
          rating: 4.8
        },
        {
          id: 2,
          name: "Premium Coffee Beans Set",
          price: "KES 3,200",
          image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
          description: "Ideal for coffee connoisseurs and morning ritual lovers",
          rating: 4.6
        },
        {
          id: 3,
          name: "Cozy Reading Blanket",
          price: "KES 2,800",
          image: "https://images.unsplash.com/photo-1586985564150-0f5b0e03e8c5?w=400&h=300&fit=crop",
          description: "Perfect for book lovers and comfort seekers",
          rating: 4.9
        },
        {
          id: 4,
          name: "Skincare Gift Set",
          price: "KES 5,200",
          image: "https://images.unsplash.com/photo-1556228578-dd6d3dcbc96d?w=400&h=300&fit=crop",
          description: "Great for skincare enthusiasts and self-care lovers",
          rating: 4.7
        },
        {
          id: 5,
          name: "Leather Wallet",
          price: "KES 3,500",
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
          description: "Stylish and practical for everyday use",
          rating: 4.5
        }
      ];
      
      setSuggestions(mockSuggestions);
      setIsLoading(false);
      toast.success("Found perfect gift suggestions for you!");
    }, 2000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-xl gap-6">
        <div>You must be signed in to access the Gift section.</div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg shadow-lg"
          onClick={() => setShowAuth(true)}
        >
          Sign In
        </Button>
        <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center text-gray-600 hover:text-orange-600 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-800">ISA Gifts</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <GiftIcon className="h-20 w-20 text-pink-500" />
              <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find the Perfect Gift
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let ISA help you discover thoughtful gifts that will make someone's day special ✨
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Gift Suggestion Form */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800 flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-500 mr-2" />
                Tell us about them
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age" className="text-gray-700 font-medium">Age *</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    placeholder="e.g., 25"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-gray-700 font-medium">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md mt-1 bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="relationship" className="text-gray-700 font-medium">Relationship</Label>
                <select
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1 bg-white"
                >
                  <option value="">Select relationship</option>
                  <option value="friend">Friend</option>
                  <option value="family">Family Member</option>
                  <option value="partner">Partner</option>
                  <option value="colleague">Colleague</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="hobbies" className="text-gray-700 font-medium">Hobbies & Interests *</Label>
                <Input
                  id="hobbies"
                  name="hobbies"
                  placeholder="e.g., reading, music, cooking, sports"
                  value={formData.hobbies}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="budget" className="text-gray-700 font-medium">Budget (KES) *</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  placeholder="e.g., 5000"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleGetSuggestions}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-3 text-lg font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ISA is thinking...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Let ISA Suggest
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Gift Suggestions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              {suggestions.length > 0 ? "Perfect Gift Ideas" : "Your suggestions will appear here"}
            </h2>
            
            {suggestions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <GiftIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Fill in the form and let ISA find amazing gifts!</p>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="shadow-md hover:shadow-lg transition-shadow bg-white">
                  <div className="flex">
                    <img
                      src={suggestion.image}
                      alt={suggestion.name}
                      className="w-24 h-24 object-cover rounded-l-lg"
                    />
                    <CardContent className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{suggestion.name}</h3>
                        <span className="font-bold text-orange-600">{suggestion.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < Math.floor(suggestion.rating) ? "★" : "☆"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 ml-2">({suggestion.rating})</span>
                        </div>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gift;
