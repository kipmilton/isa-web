import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, ShoppingCart, Search, LogOut, Menu, Star, MessageCircle, User, Moon, Sun, Gift, Sparkles } from "lucide-react";
import { ProductService } from "@/services/productService";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthDialog from "@/components/auth/AuthDialog";
import { useNavigate } from "react-router-dom";

const categories = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sports", "Books"];

const ShopDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showLikedItems, setShowLikedItems] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [showAskIsaDialog, setShowAskIsaDialog] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getSession();
  }, []);

  const loadProducts = async () => {
    setProductLoading(true);
    const data = await ProductService.getProductsFiltered(selectedCategory, searchQuery);
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

  useEffect(() => {
    if (user?.id) {
      loadCart();
      loadWishlist();
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img 
                src="/lovable-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" 
                alt="ISA Logo" 
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">ISA</h1>
            </div>
            {/* Placeholder for actions */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Button variant="ghost" size="icon"><Moon className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><MessageCircle className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><Gift className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setShowLikedItems(true)}><Heart className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(true)}><ShoppingCart className="w-5 h-5" /></Button>
              <Button variant="ghost" className="flex items-center space-x-2" onClick={() => setShowProfile(true)}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>{user?.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:inline">{user?.email || 'User'}</span>
              </Button>
              <Button variant="ghost" size="icon"><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Categories and Search */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className={`rounded-full text-xs sm:text-sm ${selectedCategory === category ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button onClick={loadProducts} variant="outline" size="sm"><Search className="w-4 h-4" /></Button>
          </div>
        </div>
        {/* Products Grid */}
        {productLoading ? (
          <div className="flex items-center justify-center py-12">
            <span>Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500">No products found.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => {
              const liked = likedItems.some((item: any) => item.product_id === product.id);
              return (
                <Card key={product.id} className="flex flex-col">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {product.main_image ? (
                      <img src={product.main_image} alt={product.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </div>
                  <CardContent className="flex-1 flex flex-col p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <div className="text-gray-600 text-sm mb-2">{product.category}</div>
                    <div className="font-bold text-xl mb-2">KES {product.price}</div>
                    <div className="flex gap-2 mt-auto">
                      <Button size="sm" variant="outline" onClick={() => handleAddToCart(product)}>
                        <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                      </Button>
                      <Button size="sm" variant={liked ? "default" : "outline"} onClick={() => handleToggleLike(product)}>
                        <Heart className={`w-4 h-4 mr-1 ${liked ? 'text-red-500' : ''}`} /> {liked ? 'Liked' : 'Like'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {/* Modals Placeholders */}
      {showProfile && (
        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Profile</DialogTitle>
            </DialogHeader>
            <ProfileForm user={user} onClose={() => setShowProfile(false)} />
          </DialogContent>
        </Dialog>
      )}
      {showCart && (
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Cart</DialogTitle>
            </DialogHeader>
            {cartItems.length === 0 ? (
              <div className="text-gray-500 py-8 text-center">Your cart is empty.</div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 border-b pb-2">
                    <div>
                      <div className="font-semibold">{item.product_name}</div>
                      <div className="text-sm text-gray-500">Qty: 
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={async (e) => {
                            const qty = parseInt(e.target.value);
                            if (qty > 0) {
                              await OrderService.updateCartItem(item.id, qty);
                              await loadCart();
                            }
                          }}
                          className="w-12 ml-2 border rounded px-1 text-center"
                        />
                      </div>
                      <div className="text-sm text-gray-500">KES {item.price}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={async () => { await OrderService.removeFromCart(item.id); await loadCart(); }}>Remove</Button>
                  </div>
                ))}
                <div className="font-bold text-right pt-4">Total: KES {cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)}</div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      {showLikedItems && (
        <Dialog open={showLikedItems} onOpenChange={setShowLikedItems}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Favorites</DialogTitle>
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
                        // Try to find the product in the loaded products for price/name
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
      {/* Ask ISA Chatbot Info Dialog */}
      <Dialog open={showAskIsaDialog} onOpenChange={setShowAskIsaDialog}>
        <DialogContent className="max-w-md text-center">
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