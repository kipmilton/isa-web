import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_vendor_id_fkey (
            first_name,
            last_name,
            company,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanProduct = (product: any) => {
    setSelectedProduct(product);
    setBanReason("");
    setBanDialogOpen(true);
  };

  const confirmBanProduct = async () => {
    if (!selectedProduct || !banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for banning this product",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          banned: true, 
          banned_reason: banReason.trim(),
          is_active: false 
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Product Banned",
        description: "Product has been banned and the vendor will see the reason."
      });

      setBanDialogOpen(false);
      setSelectedProduct(null);
      setBanReason("");
      fetchProducts();
    } catch (error) {
      console.error('Error banning product:', error);
      toast({
        title: "Error",
        description: "Failed to ban product",
        variant: "destructive"
      });
    }
  };

  const handleUnbanProduct = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          banned: false, 
          banned_reason: null,
          is_active: true 
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Product Unbanned",
        description: "Product has been unbanned and is now active."
      });

      fetchProducts();
    } catch (error) {
      console.error('Error unbanning product:', error);
      toast({
        title: "Error",
        description: "Failed to unban product",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600 mt-2">Manage and moderate platform products</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (KSH)</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {product.price?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell>
                    {product.profiles?.company || 
                     `${product.profiles?.first_name || ''} ${product.profiles?.last_name || ''}`.trim() ||
                     product.profiles?.email?.split('@')[0] ||
                     'Unknown Vendor'
                    }
                  </TableCell>
                  <TableCell>
                    {product.stock_quantity || 0}
                  </TableCell>
                  <TableCell>
                    {product.banned ? (
                      <div>
                        <Badge variant="destructive">Banned</Badge>
                        {product.banned_reason && (
                          <p className="text-xs text-gray-500 mt-1 max-w-48 truncate">
                            Reason: {product.banned_reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnbanProduct(product)}
                      >
                        Unban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBanProduct(product)}
                      >
                        Ban
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {products.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban Reason Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Product</DialogTitle>
            <DialogDescription>
              Provide a reason for banning this product. The vendor will see this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Product:</label>
              <p className="text-sm text-gray-600">{selectedProduct?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Ban Reason:</label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for banning this product..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setBanDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBanProduct}
                disabled={!banReason.trim()}
              >
                Ban Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;