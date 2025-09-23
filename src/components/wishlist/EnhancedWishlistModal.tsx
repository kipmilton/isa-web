import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Plus, X, Hash, ShoppingCart, Gift } from "lucide-react";
import ProductImageFallback from "@/components/ProductImageFallback";

interface WishlistGroup {
  id: string;
  name: string;
  description?: string;
  hashtag?: string;
  created_at: string;
}

interface WishlistItem {
  id: string;
  product_id: string;
  custom_note?: string;
  wishlist_group_id?: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    main_image?: string;
    category: string;
    original_price?: number;
  };
}

interface EnhancedWishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onAddToCart: (product: any) => void;
}

const EnhancedWishlistModal = ({ open, onOpenChange, userId, onAddToCart }: EnhancedWishlistModalProps) => {
  const [wishlistGroups, setWishlistGroups] = useState<WishlistGroup[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupHashtag, setNewGroupHashtag] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      loadWishlistData();
    }
  }, [open, userId]);

  const loadWishlistData = async () => {
    setLoading(true);
    try {
      // Load wishlist groups
      const { data: groups, error: groupsError } = await supabase
        .from('wishlist_groups')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;
      setWishlistGroups(groups || []);

      // Load wishlist items with product details
      const { data: items, error: itemsError } = await supabase
        .from('user_likes')
        .select(`
          *,
          products (
            id,
            name,
            price,
            main_image,
            category,
            original_price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      
      // Transform the data to match our interface
      const transformedItems = (items || []).map(item => ({
        ...item,
        product: item.products
      }));
      setWishlistItems(transformedItems);
    } catch (error) {
      console.error('Error loading wishlist data:', error);
      toast({
        title: "Error",
        description: "Failed to load wishlist data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createWishlistGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const { error } = await supabase
        .from('wishlist_groups')
        .insert({
          user_id: userId,
          name: newGroupName,
          description: newGroupDescription || null,
          hashtag: newGroupHashtag || null
        });

      if (error) throw error;

      toast({
        title: "Group created!",
        description: `"${newGroupName}" wishlist group has been created.`
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupHashtag("");
      setShowCreateGroup(false);
      loadWishlistData();
    } catch (error) {
      console.error('Error creating wishlist group:', error);
      toast({
        title: "Error",
        description: "Failed to create wishlist group",
        variant: "destructive"
      });
    }
  };

  const moveItemToGroup = async (itemId: string, groupId: string | null) => {
    try {
      const { error } = await supabase
        .from('user_likes')
        .update({ wishlist_group_id: groupId })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item moved!",
        description: "Item has been moved to the selected group."
      });

      loadWishlistData();
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: "Error",
        description: "Failed to move item",
        variant: "destructive"
      });
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('user_likes')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist."
      });

      loadWishlistData();
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const filteredItems = selectedGroup === "all" 
    ? wishlistItems 
    : selectedGroup === "ungrouped"
    ? wishlistItems.filter(item => !item.wishlist_group_id)
    : wishlistItems.filter(item => item.wishlist_group_id === selectedGroup);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price).replace('KSh', 'Ksh');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>My Wishlist</span>
            <Badge variant="secondary">{wishlistItems.length} items</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Management */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Label>Filter by group:</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="ungrouped">Ungrouped</SelectItem>
                  {wishlistGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.hashtag ? `#${group.hashtag}` : group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={() => setShowCreateGroup(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>

          {/* Create Group Form */}
          {showCreateGroup && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium">Create New Wishlist Group</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateGroup(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Group Name *</Label>
                      <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g., Linda's Birthday"
                        required
                      />
                    </div>
                    <div>
                      <Label>Hashtag (Optional)</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          value={newGroupHashtag}
                          onChange={(e) => setNewGroupHashtag(e.target.value.replace('#', ''))}
                          placeholder="birthday2024"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Special items for Linda's birthday celebration"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createWishlistGroup} disabled={!newGroupName.trim()}>
                      Create Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wishlist Items */}
          {loading ? (
            <div className="text-center py-8">Loading wishlist...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedGroup === "all" ? "Your wishlist is empty" : "No items in this group"}
              </h3>
              <p className="text-gray-600">
                {selectedGroup === "all" 
                  ? "Start adding items to your wishlist by clicking the heart icon on products" 
                  : "Try selecting a different group or add items to this group"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <ProductImageFallback
                        product={{ main_image: item.product?.main_image, name: item.product?.name }}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm line-clamp-2">{item.product?.name}</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-orange-600">
                            {formatPrice(item.product?.price || 0)}
                          </span>
                          {item.product?.original_price && item.product.original_price > item.product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product.original_price)}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.product?.category}
                        </Badge>
                      </div>

                      {item.custom_note && (
                        <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                          "{item.custom_note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Select
                          value={item.wishlist_group_id || "ungrouped"}
                          onValueChange={(value) => moveItemToGroup(item.id, value === "ungrouped" ? null : value)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ungrouped">No Group</SelectItem>
                            {wishlistGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.hashtag ? `#${group.hashtag}` : group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          onClick={() => onAddToCart(item.product)}
                          className="h-8 px-3 text-xs"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedWishlistModal;