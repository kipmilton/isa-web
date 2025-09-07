import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LoyaltyService } from "@/services/loyaltyService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Star, Search, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  main_image?: string;
  description?: string;
  category: string;
}

interface GiftWithPointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GiftWithPointsModal = ({ open, onOpenChange }: GiftWithPointsModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      checkLoyaltyProgram();
      loadUserPoints();
      loadProducts();
    }
  }, [open, user]);

  const checkLoyaltyProgram = async () => {
    try {
      const enabled = await LoyaltyService.isLoyaltyProgramEnabled();
      setLoyaltyEnabled(enabled);
    } catch (error) {
      console.error('Error checking loyalty program:', error);
    }
  };

  const loadUserPoints = async () => {
    if (!user) return;
    
    try {
      const pointsData = await LoyaltyService.getUserPoints(user.id);
      setUserPoints(pointsData?.available_points || 0);
    } catch (error) {
      console.error('Error loading user points:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, main_image, description, category')
        .eq('status', 'approved')
        .eq('is_active', true)
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateDiscount = async (points: number) => {
    return await LoyaltyService.calculatePointsDiscount(user?.id || '', points);
  };

  const handlePointsChange = async (value: string) => {
    const points = parseInt(value) || 0;
    if (points <= userPoints) {
      setPointsToRedeem(points);
    }
  };

  const handleGiftPurchase = async () => {
    if (!selectedProduct || !user) return;
    
    if (!loyaltyEnabled) {
      toast({
        title: "Loyalty Program Disabled",
        description: "Points redemption is currently disabled by the administrator",
        variant: "destructive"
      });
      return;
    }

    if (!recipientEmail) {
      toast({
        title: "Recipient Email Required",
        description: "Please enter the recipient's email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const discount = await calculateDiscount(pointsToRedeem);
      const finalPrice = Math.max(0, selectedProduct.price - discount);

      // Create gift order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `GIFT-${Date.now()}`,
          subtotal: selectedProduct.price,
          discount_amount: discount,
          total_amount: finalPrice,
          status: 'pending',
          fulfillment_method: 'gift',
          customer_email: recipientEmail,
          notes: `Gift from ${user.email}: ${giftMessage}`,
          currency: 'KES'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          unit_price: selectedProduct.price,
          quantity: 1,
          total_price: selectedProduct.price
        });

      if (itemError) throw itemError;

      // Redeem points if any were used
      if (pointsToRedeem > 0) {
        await LoyaltyService.redeemPoints(user.id, pointsToRedeem, order.id);
      }

      toast({
        title: "Gift Sent Successfully! 🎁",
        description: `Gift order created for ${recipientEmail}. They will receive notification shortly.`
      });

      onOpenChange(false);
      setSelectedProduct(null);
      setPointsToRedeem(0);
      setRecipientEmail("");
      setGiftMessage("");
    } catch (error) {
      console.error('Error processing gift purchase:', error);
      toast({
        title: "Error",
        description: "Failed to process gift purchase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!loyaltyEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Gift with ISA Points
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Feature Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              The loyalty program is currently disabled by the administrator. 
              Points redemption for gifts will be available once enabled.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Gift a Loved One with ISA Points
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Points Balance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available ISA Points</p>
                  <p className="text-2xl font-bold text-primary">{userPoints.toLocaleString()}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  Worth ~KES {(userPoints * 0.1).toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          {!selectedProduct ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search for products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4" onClick={() => setSelectedProduct(product)}>
                      {product.main_image && (
                        <img
                          src={product.main_image}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <p className="text-lg font-bold text-primary">KES {product.price.toLocaleString()}</p>
                      <Button size="sm" className="w-full mt-2">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Select for Gift
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Gift Configuration */
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {selectedProduct.main_image && (
                      <img
                        src={selectedProduct.main_image}
                        alt={selectedProduct.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{selectedProduct.description}</p>
                      <p className="text-xl font-bold text-primary">KES {selectedProduct.price.toLocaleString()}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="pointsRedeem">ISA Points to Redeem</Label>
                  <Input
                    id="pointsRedeem"
                    type="number"
                    placeholder="0"
                    max={userPoints}
                    value={pointsToRedeem}
                    onChange={(e) => handlePointsChange(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max: {userPoints} points (KES {(userPoints * 0.1).toFixed(2)})
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="giftMessage">Gift Message (Optional)</Label>
                <Input
                  id="giftMessage"
                  placeholder="Happy Birthday! Enjoy this gift..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                />
              </div>

              {/* Order Summary */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Product Price:</span>
                      <span>KES {selectedProduct.price.toLocaleString()}</span>
                    </div>
                    {pointsToRedeem > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Points Discount ({pointsToRedeem} points):</span>
                        <span>-KES {(pointsToRedeem * 0.1).toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-bold">
                      <span>Final Price:</span>
                      <span>KES {Math.max(0, selectedProduct.price - (pointsToRedeem * 0.1)).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGiftPurchase}
                  disabled={loading || !recipientEmail}
                >
                  {loading ? "Processing..." : "Send Gift 🎁"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftWithPointsModal;