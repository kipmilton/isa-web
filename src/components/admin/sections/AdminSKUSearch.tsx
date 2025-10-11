import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Calendar, User, DollarSign, MapPin, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { format } from "date-fns";

interface ProductHistory {
  product: Product;
  vendor: {
    first_name: string;
    last_name: string;
    vendor_serial_number: string;
    email: string;
  } | null;
  orders: {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    actual_delivery_date: string | null;
  }[];
  returns: {
    id: string;
    status: string;
    reason: string;
    created_at: string;
  }[];
}

export default function AdminSKUSearch() {
  const [skuQuery, setSkuQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [productHistory, setProductHistory] = useState<ProductHistory | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!skuQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SKU to search",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch product with vendor info
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_vendor_id_fkey (
            first_name,
            last_name,
            vendor_serial_number,
            email
          )
        `)
        .eq('sku', skuQuery.trim())
        .single();

      if (productError) throw productError;

      if (!productData) {
        toast({
          title: "Not Found",
          description: "No product found with this SKU",
          variant: "destructive"
        });
        setProductHistory(null);
        return;
      }

      // Fetch orders containing this product
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          orders (
            id,
            order_number,
            status,
            created_at,
            actual_delivery_date
          )
        `)
        .eq('product_id', productData.id);

      if (orderError) throw orderError;

      // Fetch returns for orders containing this product
      const orderIds = orderItems?.map(item => item.order_id) || [];
      const { data: returns, error: returnsError } = await supabase
        .from('order_returns')
        .select('*')
        .in('order_id', orderIds);

      if (returnsError) throw returnsError;

      setProductHistory({
        product: productData as Product,
        vendor: productData.profiles as any,
        orders: orderItems?.map(item => item.orders).filter(Boolean) as any[] || [],
        returns: returns || []
      });

      toast({
        title: "Success",
        description: "Product information retrieved"
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search product",
        variant: "destructive"
      });
      setProductHistory(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            SKU Search & Product History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="sku">Enter SKU</Label>
              <Input
                id="sku"
                value={skuQuery}
                onChange={(e) => setSkuQuery(e.target.value)}
                placeholder="e.g., HP-LAP-8F3B-V001234"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="mt-auto"
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {productHistory && (
        <div className="space-y-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Product Name</Label>
                    <p className="font-semibold">{productHistory.product.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">SKU</Label>
                    <p className="font-mono text-sm">{productHistory.product.sku}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <div className="flex gap-2 mt-1">
                      <Badge>{productHistory.product.category}</Badge>
                      {productHistory.product.subcategory && (
                        <Badge variant="outline">{productHistory.product.subcategory}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Price</Label>
                    <p className="text-lg font-bold">Ksh {productHistory.product.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stock</Label>
                    <p>{productHistory.product.stock_quantity || 0} units</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={
                        productHistory.product.status === 'approved' ? 'default' :
                        productHistory.product.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {productHistory.product.status}
                      </Badge>
                      {productHistory.product.banned && (
                        <Badge className="bg-red-600">Banned</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(productHistory.product.created_at!), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Brand</Label>
                    <p>{productHistory.product.brand || 'N/A'}</p>
                  </div>
                  {productHistory.product.pickup_location && (
                    <div>
                      <Label className="text-muted-foreground">Pickup Location</Label>
                      <p className="flex items-start gap-1 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        {productHistory.product.pickup_location}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Details */}
          {productHistory.vendor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Vendor Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Vendor Name</Label>
                    <p className="font-semibold">
                      {productHistory.vendor.first_name} {productHistory.vendor.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vendor Serial Number</Label>
                    <p className="font-mono text-sm">{productHistory.vendor.vendor_serial_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-sm">{productHistory.vendor.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Purchase History ({productHistory.orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productHistory.orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No purchases yet</p>
              ) : (
                <div className="space-y-3">
                  {productHistory.orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Ordered: {format(new Date(order.created_at), 'PPP')}
                          </p>
                          {order.actual_delivery_date && (
                            <p className="text-sm text-muted-foreground">
                              Delivered: {format(new Date(order.actual_delivery_date), 'PPP')}
                            </p>
                          )}
                        </div>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'cancelled' ? 'destructive' : 'secondary'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Returns History */}
          {productHistory.returns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Returns History ({productHistory.returns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productHistory.returns.map((returnItem) => (
                    <div key={returnItem.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Return Reason: {returnItem.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(returnItem.created_at), 'PPP')}
                          </p>
                        </div>
                        <Badge variant={
                          returnItem.status === 'approved' ? 'default' :
                          returnItem.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {returnItem.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}