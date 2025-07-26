import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Heart, ShoppingCart, Search, LogOut, Star, MessageCircle, User, Gift, Filter, TrendingUp, Plus, Minus, Eye, UserCheck, Menu, X } from "lucide-react";
import { ProductService } from "@/services/productService";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthDialog from "@/components/auth/AuthDialog";
import CartModal from "@/components/CartModal";
import AccountSetupModal from "@/components/AccountSetupModal";
import { useNavigate, Link } from "react-router-dom";

const categories = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sports", "Books"];

const ShopDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showLikedItems, setShowLikedItems] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showProductReviews, setShowProductReviews] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [showAskIsaDialog, setShowAskIsaDialog] = useState(true);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getSession();
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          setUserProfile(profile);
          // Show account setup modal if user hasn't completed setup
          if (!(profile as any).account_setup_completed && profile.user_type === 'customer') {
            setShowAccountSetup(true);
          }
        }
      }
    };
    loadUserProfile();
  }, [user]);

  const loadProducts = async () => {
    setProductLoading(true);
    let data = await ProductService.getProductsFiltered(selectedCategory, searchQuery);
    
    // Apply price range filter
    data = data.filter((product: any) => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    setProducts(data);
    setProductLoading(false);
  };

  const loadCart = async () => {
    if (!user?.id) return;
    const data = await OrderService.getCartItems(user.id);
    setCartItems(data);
  };

  const loadWishlist = async () => {
    if (!user?.id) return;
    const data = await OrderService.getWishlistItems(user.id);
    setLikedItems(data);
  };

  const loadProductReviews = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          profiles!inner (
            first_name,
            last_name
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!error) {
        setProductReviews(data || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const submitReview = async (productId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: reviewRating,
          comment: reviewText,
          title: `${reviewRating} star review`
        });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback."
      });

      setReviewText("");
      setReviewRating(5);
      loadProductReviews(productId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadCart();
      loadWishlist();
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery, priceRange]);

  const handleAddToCart = async (product: any) => {
    if (!user?.id) return;
    try {
      await OrderService.addToCart(user.id, {
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        price: product.price,
      });
      await loadCart();
      toast({ title: "Added to cart!", description: "Item has been added to your shopping cart." });
    } catch (e: any) {
      toast({ title: "Failed to add to cart", description: e.message || "Please try again." });
    }
  };

  const handleToggleLike = async (product: any) => {
    if (!user?.id) return;
    const alreadyLiked = likedItems.some((item: any) => item.product_id === product.id);
    try {
      if (alreadyLiked) {
        await OrderService.removeFromWishlist(user.id, product.id);
      } else {
        await OrderService.addToWishlist(user.id, {
          product_id: product.id,
          product_name: product.name,
          product_category: product.category,
        });
      }
      await loadWishlist();
    } catch (e: any) {
      toast({ title: "Failed to update wishlist", description: e.message || "Please try again." });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-xl gap-6">
        <div>Please sign in to shop.</div>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-4 hover:scale-105 transition-transform">
              <img 
                src="/lovable-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" 
                alt="ISA Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-md"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-orange-600">ISA Shop</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Smart Shopping Assistant</p>
              </div>
            </Link>
            
            {/* Desktop Navigation Icons */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              <Link to="/chat">
                <Button variant="ghost" size="icon" className="relative group bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg">
                  <MessageCircle className="w-5 h-5" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Ask ISA</span>
                </Button>
              </Link>
              
              <Link to="/gift">
                <Button variant="ghost" size="icon" className="relative group bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg">
                  <Gift className="w-5 h-5" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Gift Someone</span>
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowLikedItems(true)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600 relative group"
              >
                <Heart className="w-5 h-5" />
                {likedItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 text-xs bg-red-500">
                    {likedItems.length}
                  </Badge>
                )}
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Wishlist</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowCart(true)}
                className="text-green-600 hover:bg-green-50 hover:text-green-700 relative group"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 text-xs bg-green-500">
                    {cartItems.length}
                  </Badge>
                )}
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Cart</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 text-gray-700 hover:bg-gray-50" 
                onClick={() => setShowProfile(true)}
              >
                <Avatar className="w-8 h-8 border-2 border-orange-200">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-orange-100 text-orange-600">{user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:inline">{user?.email?.split('@')[0] || 'User'}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast({ title: "Signed out", description: "You have been logged out." });
                  navigate("/");
                }}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Cart and Wishlist buttons for quick access */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowCart(true)}
                className="text-green-600 hover:bg-green-50 hover:text-green-700 relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 text-xs bg-green-500">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowLikedItems(true)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600 relative"
              >
                <Heart className="w-5 h-5" />
                {likedItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 text-xs bg-red-500">
                    {likedItems.length}
                  </Badge>
                )}
              </Button>

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
              <div className="py-4 space-y-3">
                <Link 
                  to="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Ask ISA</span>
                </Link>
                
                <Link 
                  to="/gift"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Gift Someone</span>
                </Link>
                
                <button 
                  onClick={() => { setShowProfile(true); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <Avatar className="w-8 h-8 border-2 border-orange-200">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">{user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">Profile</span>
                </button>
                
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setMobileMenuOpen(false);
                    toast({ title: "Signed out", description: "You have been logged out." });
                    navigate("/");
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Account Setup Banner for Google Users */}
        {userProfile && userProfile.user_type === 'customer' && !(userProfile as any).account_setup_completed && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800">Complete Your Profile Setup</h3>
                  <p className="text-sm text-orange-700">
                    Help us provide more accurate and personalized product recommendations
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAccountSetup(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}

        {/* Categories and Search */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Shop by Category</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-600"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {/* Price Range Filter */}
          {showFilters && (
            <Card className="p-4 bg-white/70 backdrop-blur-sm">
              <h4 className="font-medium mb-3">Price Range</h4>
              <div className="space-y-3">
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={100000}
                  min={0}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>KES {priceRange[0].toLocaleString()}</span>
                  <span>KES {priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </Card>
          )}
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className={`rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:shadow-xl scale-105' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:scale-105'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-full shadow-md p-2 max-w-md">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <Input
              type="text"
              placeholder="Search for products, brands, categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 text-sm"
            />
            <Button onClick={loadProducts} size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600">
              Search
            </Button>
          </div>
        </div>
        
        {/* Products Grid */}
        {productLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-gray-600 text-lg">Finding amazing products for you...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or browse different categories</p>
            <Button onClick={() => setSelectedCategory("All")} className="bg-orange-500 hover:bg-orange-600">
              Browse All Products
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedCategory === "All" ? "All Products" : selectedCategory} 
                <span className="text-gray-500 ml-2">({products.length} items)</span>
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Popular items first</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => {
                const liked = likedItems.some((item: any) => item.product_id === product.id);
                return (
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white rounded-xl overflow-hidden border-0 shadow-md">
                    <div className="relative h-48 overflow-hidden">
                      {product.main_image ? (
                        <img 
                          src={product.main_image} 
                          alt={product.name} 
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                      
                      {/* Floating heart button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleLike(product)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full shadow-md transition-colors ${
                          liked ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white/80 text-gray-600 hover:bg-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      </Button>
                      
                      {/* View Reviews Button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setShowProductReviews(product.id);
                          loadProductReviews(product.id);
                        }}
                        className="absolute top-3 left-3 w-8 h-8 rounded-full shadow-md bg-white/80 text-gray-600 hover:bg-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Product badge */}
                      {product.is_featured && (
                        <Badge className="absolute bottom-3 left-3 bg-orange-500 text-white">
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          {product.category}
                        </Badge>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-gray-900">
                            KES {product.price?.toLocaleString()}
                          </div>
                          {product.original_price && product.original_price > product.price && (
                            <div className="text-sm text-gray-500 line-through">
                              KES {product.original_price.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating?.toFixed(1) || '4.5'}</span>
                          <span className="text-gray-400">({product.review_count || 0})</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-medium rounded-lg transition-all duration-200 hover:shadow-md"
                        variant="outline"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Product Reviews Modal */}
      {showProductReviews && (
        <Dialog open={!!showProductReviews} onOpenChange={() => setShowProductReviews(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Product Reviews & Ratings</DialogTitle>
              <DialogDescription className="sr-only">
                View and write reviews for this product.
              </DialogDescription>
            </DialogHeader>
            
            {user && (
              <div className="space-y-4 border-b pb-4 mb-4">
                <h4 className="font-semibold">Write a Review</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <Button
                        key={rating}
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviewRating(rating)}
                        className="p-1"
                      >
                        <Star className={`w-4 h-4 ${rating <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Share your thoughts about this product..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={() => submitReview(showProductReviews)}
                  disabled={!reviewText.trim()}
                  className="w-full"
                >
                  Submit Review
                </Button>
              </div>
            )}
            
            <div className="space-y-4">
              <h4 className="font-semibold">Customer Reviews ({productReviews.length})</h4>
              {productReviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
              ) : (
                productReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.profiles?.first_name || 'Anonymous'}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <Star key={rating} className={`w-3 h-3 ${rating <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Profile</DialogTitle>
              <DialogDescription className="sr-only">
                View and edit your profile information.
              </DialogDescription>
            </DialogHeader>
            <ProfileForm user={user} onClose={() => setShowProfile(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Cart Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        user={user}
        cartItems={cartItems}
        onRemoveFromCart={() => {}}
        onUpdateQuantity={() => {}}
      />

      {/* Wishlist Modal */}
      {showLikedItems && (
        <Dialog open={showLikedItems} onOpenChange={setShowLikedItems}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Favorites</DialogTitle>
              <DialogDescription className="sr-only">
                View and manage your favorite products.
              </DialogDescription>
            </DialogHeader>
            {likedItems.length === 0 ? (
              <div className="text-gray-500 py-8 text-center">You have no liked products.</div>
            ) : (
              <div className="space-y-4">
                {likedItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 border-b pb-2">
                    <div>
                      <div className="font-semibold">{item.product_name || item.product_id}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={async () => {
                        const product = products.find((p: any) => p.id === item.product_id);
                        if (product) {
                          await handleAddToCart(product);
                        }
                      }}>
                        <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await OrderService.removeFromWishlist(user.id, item.product_id);
                        await loadWishlist();
                      }}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Ask ISA Welcome Dialog */}
      <Dialog open={showAskIsaDialog} onOpenChange={setShowAskIsaDialog}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">Ask ISA Chatbot Introduction</DialogTitle>
            <DialogDescription className="sr-only">
              Learn about the Ask ISA chatbot and choose to proceed to shopping or try the chat feature.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-2">
            <img src="/lovable-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" alt="ISA Logo" className="h-16 w-16 mb-2 rounded-full bg-white p-2" />
            <h2 className="text-2xl font-bold mb-2">Welcome to ISA Shopping!</h2>
            <p className="text-gray-700 mb-4">
              Did you know? You can get instant product recommendations, compare prices, and ask for shopping advice using our <span className="font-semibold text-orange-600">Ask ISA</span> chatbot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600" onClick={() => setShowAskIsaDialog(false)}>
                Proceed to Shopping
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => { setShowAskIsaDialog(false); navigate('/chat'); }}>
                Try ISA Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Setup Modal */}
      <AccountSetupModal
        open={showAccountSetup}
        onOpenChange={setShowAccountSetup}
        user={user}
      />
    </div>
  );
};

export default ShopDashboard;

function ProfileForm({ user, onClose }: { user: any, onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        toast({ title: 'Error', description: 'Failed to load profile' });
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user.id]);

  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number,
        gender: profile.gender,
        location: profile.location,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile' });
    } else {
      toast({ title: 'Profile updated', description: 'Your profile was updated successfully.' });
      onClose();
    }
  };

  if (loading || !profile) return <div className="py-8 text-center">Loading...</div>;

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
      <div>
        <Label>First Name</Label>
        <Input value={profile.first_name || ''} onChange={e => handleChange('first_name', e.target.value)} />
      </div>
      <div>
        <Label>Last Name</Label>
        <Input value={profile.last_name || ''} onChange={e => handleChange('last_name', e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={profile.email || ''} disabled />
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input value={profile.phone_number || ''} onChange={e => handleChange('phone_number', e.target.value)} />
      </div>
      <div>
        <Label>Gender</Label>
        <select value={profile.gender || ''} onChange={e => handleChange('gender', e.target.value)} className="w-full p-2 border rounded-md">
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <Label>Location</Label>
        <Input value={profile.location || ''} onChange={e => handleChange('location', e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}