
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GiftIcon, Heart, Sparkles, ArrowLeft, ShoppingCart, Plus, Minus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductService } from "@/services/productService";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GiftCartItem {
  product: any;
  quantity: number;
}

const Gift = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: "",
    hobbies: "",
    budgetMin: "",
    budgetMax: "",
    relationship: "",
    gender: "",
    specialOccasion: ""
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [giftCart, setGiftCart] = useState<GiftCartItem[]>([]);
  const [showGiftCart, setShowGiftCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'self' | 'isa'>('self');
  const [recipientDetails, setRecipientDetails] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    message: ""
  });

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
    if (!formData.age || !formData.hobbies || !formData.budgetMin || !formData.budgetMax) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseInt(formData.budgetMin) > parseInt(formData.budgetMax)) {
      toast.error("Minimum budget cannot be greater than maximum budget");
      return;
    }

    setIsLoading(true);
    
    try {
      // Create a prompt for GPT-like analysis
      const prompt = `Analyze this gift request and suggest product categories:
        Age: ${formData.age}
        Gender: ${formData.gender}
        Relationship: ${formData.relationship}
        Special Occasion: ${formData.specialOccasion}
        Hobbies & Interests: ${formData.hobbies}
        Budget Range: KES ${formData.budgetMin} - ${formData.budgetMax}
        
        Based on this information, suggest 3-5 product categories that would be most suitable for this gift.`;

      // For now, we'll use a simple category mapping based on the data
      // In a real implementation, this would call a GPT API
      const suggestedCategories = getSuggestedCategories(formData);
      
      // Fetch products from database based on suggested categories and budget
      const allProducts = await ProductService.getProducts();
      const filteredProducts = allProducts.data?.filter((product: any) => {
        const inBudget = product.price >= parseInt(formData.budgetMin) && 
                        product.price <= parseInt(formData.budgetMax);
        const inCategory = suggestedCategories.includes(product.category);
        return inBudget && inCategory;
      }) || [];

      // Limit to top 8 suggestions
      const topSuggestions = filteredProducts.slice(0, 8);
      
      setSuggestions(topSuggestions);
      setIsLoading(false);
      toast.success(`Found ${topSuggestions.length} perfect gift suggestions!`);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast.error("Failed to get suggestions. Please try again.");
      setIsLoading(false);
    }
  };

  const getSuggestedCategories = (data: any) => {
    const categories = [];
    
    // Age-based suggestions
    if (parseInt(data.age) < 18) {
      categories.push('Electronics', 'Sports', 'Books');
    } else if (parseInt(data.age) < 30) {
      categories.push('Electronics', 'Fashion', 'Home');
    } else if (parseInt(data.age) < 50) {
      categories.push('Home', 'Beauty', 'Fashion');
    } else {
      categories.push('Home', 'Books', 'Beauty');
    }

    // Occasion-based suggestions
    if (data.specialOccasion === 'birthday') {
      categories.push('Electronics', 'Fashion', 'Beauty');
    } else if (data.specialOccasion === 'wedding') {
      categories.push('Home', 'Fashion', 'Beauty');
    } else if (data.specialOccasion === 'graduation') {
      categories.push('Electronics', 'Books', 'Fashion');
    } else if (data.specialOccasion === 'valentine') {
      categories.push('Fashion', 'Beauty', 'Home');
    }

    // Remove duplicates and return
    return [...new Set(categories)];
  };

  const addToGiftCart = (product: any) => {
    setGiftCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    toast.success("Added to gift cart!");
  };

  const removeFromGiftCart = (productId: string) => {
    setGiftCart(prev => prev.filter(item => item.product.id !== productId));
    toast.success("Removed from gift cart");
  };

  const updateGiftCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromGiftCart(productId);
      return;
    }
    setGiftCart(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getGiftCartTotal = () => {
    return giftCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (giftCart.length === 0) {
      toast.error("Your gift cart is empty");
      return;
    }
    setShowCheckout(true);
  };

  const handlePlaceOrder = async () => {
    if (deliveryOption === 'isa' && (!recipientDetails.name || !recipientDetails.phone || !recipientDetails.address)) {
      toast.error("Please fill in all recipient details");
      return;
    }

    // Here you would implement the actual order placement logic
    // For now, we'll just show a success message
    toast.success("Gift order placed successfully!");
    setShowCheckout(false);
    setGiftCart([]);
    setShowGiftCart(false);
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
              <img src="/isa-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-800">ISA Gifts</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowGiftCart(true)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Gift Cart
              {giftCart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 text-xs bg-orange-500">
                  {giftCart.length}
                </Badge>
              )}
            </Button>
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
                <Label htmlFor="specialOccasion" className="text-gray-700 font-medium">Special Occasion</Label>
                <select
                  id="specialOccasion"
                  name="specialOccasion"
                  value={formData.specialOccasion}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1 bg-white"
                >
                  <option value="">Select occasion (optional)</option>
                  <option value="birthday">Birthday</option>
                  <option value="wedding">Wedding</option>
                  <option value="graduation">Graduation</option>
                  <option value="valentine">Valentine's Day</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="christmas">Christmas</option>
                  <option value="mothers-day">Mother's Day</option>
                  <option value="fathers-day">Father's Day</option>
                  <option value="girlfriends-day">Girlfriend's Day</option>
                  <option value="boyfriends-day">Boyfriend's Day</option>
                  <option value="friendship-day">Friendship Day</option>
                  <option value="housewarming">Housewarming</option>
                  <option value="baby-shower">Baby Shower</option>
                  <option value="promotion">Job Promotion</option>
                  <option value="retirement">Retirement</option>
                  <option value="get-well">Get Well Soon</option>
                  <option value="congratulations">Congratulations</option>
                  <option value="thank-you">Thank You</option>
                  <option value="just-because">Just Because</option>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetMin" className="text-gray-700 font-medium">Budget Min (KES) *</Label>
                  <Input
                    id="budgetMin"
                    name="budgetMin"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.budgetMin}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="budgetMax" className="text-gray-700 font-medium">Budget Max (KES) *</Label>
                  <Input
                    id="budgetMax"
                    name="budgetMax"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.budgetMax}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
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
                      src={suggestion.image_url || suggestion.image}
                      alt={suggestion.name}
                      className="w-24 h-24 object-cover rounded-l-lg"
                    />
                    <CardContent className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{suggestion.name}</h3>
                        <span className="font-bold text-orange-600">KES {suggestion.price?.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < Math.floor(suggestion.rating || 4.5) ? "★" : "☆"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 ml-2">({suggestion.rating || 4.5})</span>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-pink-500 hover:bg-pink-600 text-white"
                          onClick={() => addToGiftCart(suggestion)}
                        >
                          Add to Gift Cart
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

      {/* Gift Cart Modal */}
      <Dialog open={showGiftCart} onOpenChange={setShowGiftCart}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Gift Cart ({giftCart.length} items)
            </DialogTitle>
          </DialogHeader>
          
          {giftCart.length === 0 ? (
            <div className="text-center py-8">
              <GiftIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Your gift cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {giftCart.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <img
                    src={item.product.image_url || item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">KES {item.product.price?.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGiftCartQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGiftCartQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromGiftCart(item.product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-orange-600">KES {getGiftCartTotal().toLocaleString()}</span>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gift Checkout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Delivery Option */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Delivery Option</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="self-delivery"
                    name="delivery"
                    value="self"
                    checked={deliveryOption === 'self'}
                    onChange={(e) => setDeliveryOption(e.target.value as 'self' | 'isa')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <Label htmlFor="self-delivery" className="text-base">Receive Gift Order Myself</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="isa-delivery"
                    name="delivery"
                    value="isa"
                    checked={deliveryOption === 'isa'}
                    onChange={(e) => setDeliveryOption(e.target.value as 'self' | 'isa')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <Label htmlFor="isa-delivery" className="text-base">Let ISA Deliver Them the Gift</Label>
                </div>
              </div>
            </div>

            {/* Recipient Details (only if ISA delivery is selected) */}
            {deliveryOption === 'isa' && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-lg">Recipient Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      value={recipientDetails.name}
                      onChange={(e) => setRecipientDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter recipient name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientPhone">Phone Number *</Label>
                    <Input
                      id="recipientPhone"
                      value={recipientDetails.phone}
                      onChange={(e) => setRecipientDetails(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="recipientWhatsapp">WhatsApp Number</Label>
                  <Input
                    id="recipientWhatsapp"
                    value={recipientDetails.whatsapp}
                    onChange={(e) => setRecipientDetails(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="Enter WhatsApp number"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientAddress">Delivery Address *</Label>
                  <Textarea
                    id="recipientAddress"
                    value={recipientDetails.address}
                    onChange={(e) => setRecipientDetails(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter complete delivery address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="giftMessage">Gift Message</Label>
                  <Textarea
                    id="giftMessage"
                    value={recipientDetails.message}
                    onChange={(e) => setRecipientDetails(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Add a personal message to your gift"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2">
                {giftCart.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>KES {(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-orange-600">KES {getGiftCartTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCheckout(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceOrder}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Place Gift Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gift;
