import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Heart, ShoppingCart, Search, LogOut, Star, MessageCircle, User, Gift, Filter, TrendingUp, Plus, Minus, Eye, UserCheck, Menu, X, Truck, Settings, Wallet, CreditCard, Crown, Globe, MessageSquare, Package } from "lucide-react";
import { ProductService } from "@/services/productService";
import { OrderService } from "@/services/orderService";
import { SubscriptionService } from "@/services/subscriptionService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthDialog from "@/components/auth/AuthDialog";
import CartModal from "@/components/CartModal";
import AccountSetupModal from "@/components/AccountSetupModal";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import NotificationBell from "@/components/ui/notification-bell";
import { useNavigate, Link } from "react-router-dom";
import ProductImageFallback from "@/components/ProductImageFallback";
import { useUISound } from "@/contexts/SoundContext";
import ShareButton from "@/components/sharing/ShareButton";
import EnhancedWishlistModal from "@/components/wishlist/EnhancedWishlistModal";
import SupportTicketDialog from "@/components/support/SupportTicketDialog";

const categories = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sports", "Books"];

const ShopDashboard = () => {
  const playAddToCart = useUISound("add_to_cart");
  const playLike = useUISound("like_toggle");
  const playOpenReviews = useUISound("open_reviews");
  const playSubmitReview = useUISound("submit_review");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  const [showAskIsaDialog, setShowAskIsaDialog] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KES');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getSession();
  }, []);

  // Show Ask MyPlug AI dialog only once per user/browser
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('myplug_seen_ask_myplug') === 'true';
      if (!hasSeen) {
        setShowAskIsaDialog(true);
        localStorage.setItem('myplug_seen_ask_myplug', 'true');
      }
    } catch (e) {
      // ignore storage errors
    }
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
          // Check if user is a customer and hasn't completed account setup
          if (profile.user_type === 'customer' && !profile.account_setup_completed) {
            // Double-check if they actually have all required data
            const hasCompleteData = profile.first_name && 
              profile.last_name && 
              profile.phone_number && 
              profile.date_of_birth && 
              profile.gender && 
              profile.location;
            
            if (!hasCompleteData) {
              setShowAccountSetup(true);
            } else {
              // They have all data but account_setup_completed is false, update it
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ account_setup_completed: true })
                .eq('id', user.id);
              
              if (!updateError) {
                setUserProfile({ ...profile, account_setup_completed: true });
              }
            }
          }
        }
      }
    };
    loadUserProfile();
  }, [user]);

  // Load products when component mounts and when filters change
  useEffect(() => {
    if (user) {
      loadProducts();
      loadCart();
      loadWishlist();
      loadSubscription();
    }
  }, [user, selectedCategory, searchQuery, priceRange]);

  // Load user subscription
  const loadSubscription = async () => {
    if (!user?.id) return;
    try {
      const subscription = await SubscriptionService.getUserSubscription(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const loadProducts = async () => {
    setProductLoading(true);
    let data = await ProductService.getProductsFiltered(selectedCategory, searchQuery);
    // Only show approved products
    data = data.filter((product: any) => product.status === 'approved');
    
    // Apply price range filter
    data = data.filter((product: any) => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Fetch real ratings and review counts for each product
    const productsWithRatings = await Promise.all(
      data.map(async (product: any) => {
        try {
          const reviews = await ProductService.getProductReviews(product.id);
          const rating = reviews.length > 0 
            ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length)
            : 0;
          const reviewCount = reviews.length;
          
          return {
            ...product,
            rating,
            review_count: reviewCount
          };
        } catch (error) {
          console.warn(`Error fetching reviews for product ${product.id}:`, error);
          return {
            ...product,
            rating: 0,
            review_count: 0
          };
        }
      })
    );
    
    // Shuffle the products array to randomize the order
    const shuffledProducts = [...productsWithRatings].sort(() => Math.random() - 0.5);
    
    setProducts(shuffledProducts);
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
    
    // Fetch product details for each liked item to get images
    const likedItemsWithProducts = await Promise.all(
      data.map(async (item: any) => {
        try {
          const { data: productData, error } = await supabase
            .from('products')
            .select('id, name, price, main_image, category, original_price')
            .eq('id', item.product_id)
            .single();
          
          if (!error && productData) {
            return {
              ...item,
              product: productData
            };
          }
          return item;
        } catch (error) {
          console.warn(`Error fetching product details for ${item.product_id}:`, error);
          return item;
        }
      })
    );
    
    setLikedItems(likedItemsWithProducts);
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
      try { playSubmitReview(); } catch {}

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
      try { playAddToCart(); } catch {}
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
      try { playLike(); } catch {}
    } catch (e: any) {
      toast({ title: "Failed to update wishlist", description: e.message || "Please try again." });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Signed out", description: "You have been logged out." });
      navigate("/");
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getConvertedPrice = (priceKES: number) => {
    return SubscriptionService.convertPrice(priceKES, 'KES', selectedCurrency);
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
                src="/MyPlug.png" 
                alt="MyPlug Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-md"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-orange-600">MyPlug Shop</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Smart Shopping Assistant</p>
              </div>
            </Link>
            
            {/* Desktop Navigation Icons */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {/* Currency Selector */}
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-600" />
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-20 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Link to="/chat">
                <Button variant="ghost" className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg px-3 py-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Ask MyPlug</span>
                </Button>
              </Link>
              
              
              
              <Link to="/gift">
                <Button variant="ghost" className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg px-3 py-2">
                  <Gift className="w-5 h-5" />
                  <span className="text-sm font-medium">Gift Someone</span>
                </Button>
              </Link>
              
              {/* Notification Bell */}
              {user && (
                <NotificationBell 
                  userId={user.id} 
                  className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                />
              )}
              
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 text-gray-700 hover:bg-gray-50" 
                  >
                    <Avatar className="w-8 h-8 border-2 border-orange-200">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">{user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:inline">{user?.email?.split('@')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Premium Status Indicator */}
                  {currentSubscription?.plan_type === 'premium' && (
                    <div className="px-2 py-1.5 text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-t-md text-center">
                      ⭐ Premium Member
                    </div>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=profile')}>
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=wallet')}>
                    <Wallet className="w-4 h-4 mr-2" />
                    My Wallet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=quiz')}>
                    <Star className="w-4 h-4 mr-2" />
                    Style Quiz
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/shipping')}>
                    <Truck className="w-4 h-4 mr-2" />
                    My Shipping
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/premium')}>
                    <Crown className="w-4 h-4 mr-2" />
                    Premium Plans
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSubscriptionManager(true)}>
                    <Crown className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Currency Selector for Mobile */}
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-16 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>

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
              
              {/* Notification Bell for Mobile */}
              {user && (
                <NotificationBell 
                  userId={user.id} 
                  className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                />
              )}

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
                  <span className="font-medium">Ask MyPlug</span>
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
                  onClick={() => { navigate('/profile?tab=profile'); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <Avatar className="w-8 h-8 border-2 border-orange-200">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">{user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">View Profile</span>
                </button>

                <button
                  onClick={() => { navigate('/profile?tab=wallet'); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">My Wallet</span>
                </button>

                <button
                  onClick={() => { navigate('/profile?tab=quiz'); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Style Quiz</span>
                </button>

                <button
                  onClick={() => { navigate('/shipping'); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">My Shipping</span>
                </button>

                <button
                  onClick={() => { setShowSubscriptionManager(true); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Manage Subscription</span>
                </button>

                <button
                  onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="font-medium">Settings</span>
                </button>

                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-600" />
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

        {/* Subscription Banner */}
        {currentSubscription && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800">Premium Subscription Active</h3>
                  <p className="text-sm text-purple-700">
                    Enjoy unlimited AI assistance, ad-free browsing, and exclusive features
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowSubscriptionManager(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
                size="sm"
              >
                Manage
              </Button>
            </div>
          </div>
        )}

        {/* Upgrade to Premium Banner */}
        {!currentSubscription && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Upgrade to Premium</h3>
                  <p className="text-sm text-blue-700">
                    Get unlimited AI assistance, ad-free browsing, and exclusive features
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowSubscriptionManager(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                Upgrade Now
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
            <Button size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600">
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
                      <ProductImageFallback
                        product={product}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                        alt={product.name}
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                      
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
                          try { playOpenReviews(); } catch {}
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
                        <div className="flex items-center justify-between">
                          <h3 
                            className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer flex-1"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            {product.name}
                          </h3>
                          <ShareButton
                            contentType="product"
                            contentId={product.id}
                            contentTitle={product.name}
                            contentImage={product.main_image}
                            variant="ghost"
                            size="sm"
                            showText={false}
                            className="ml-2"
                          />
                        </div>
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          {product.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(getConvertedPrice(product.price || 0), selectedCurrency)}
                          </div>
                          {product.original_price && product.original_price > product.price && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatPrice(getConvertedPrice(product.original_price), selectedCurrency)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating > 0 ? product.rating.toFixed(1) : '0.0'}</span>
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



      {/* Cart Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        user={user}
        cartItems={cartItems}
        onRemoveFromCart={() => {}}
        onUpdateQuantity={() => {}}
      />

      {/* Enhanced Wishlist Modal */}
      <EnhancedWishlistModal
        open={showLikedItems}
        onOpenChange={setShowLikedItems}
        userId={user.id}
        onAddToCart={handleAddToCart}
      />

      {/* Ask MyPlug Welcome Dialog */}
      <Dialog open={showAskIsaDialog} onOpenChange={setShowAskIsaDialog}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">Ask MyPlug Chatbot Introduction</DialogTitle>
            <DialogDescription className="sr-only">
              Learn about the Ask MyPlug chatbot and choose to proceed to shopping or try the chat feature.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-2">
            <img src="/MyPlug.png" alt="MyPlug Logo" className="h-16 w-16 mb-2 rounded-full bg-white p-2" />
            <h2 className="text-2xl font-bold mb-2">Welcome to MyPlug Shopping!</h2>
            <p className="text-gray-700 mb-4">
              Did you know? You can get instant product recommendations, compare prices, and ask for shopping advice using our <span className="font-semibold text-orange-600">Ask MyPlug</span> chatbot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600" onClick={() => setShowAskIsaDialog(false)}>
                Proceed to Shopping
              </Button>
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => { setShowAskIsaDialog(false); navigate('/chat'); }}>
                Try MyPlug Chat
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

      {/* Subscription Manager */}
      {user && (
        <SubscriptionManager
          userId={user.id}
          isOpen={showSubscriptionManager}
          onClose={() => {
            setShowSubscriptionManager(false);
            loadSubscription(); // Reload subscription data when modal closes
          }}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Share Button - positioned above ticket button */}
        <div className="relative group">
          <ShareButton className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0" />
        </div>
        
        {/* Support Ticket Button */}
        {user && (
          <div className="relative group">
            <SupportTicketDialog userId={user.id}>
              <Button 
                className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 bg-gradient-to-r from-orange-500 to-red-600 text-white border-0"
                size="icon"
              >
                <MessageSquare className="w-6 h-6" />
              </Button>
            </SupportTicketDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;