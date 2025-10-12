import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import OrderMessaging from '@/components/order/OrderMessaging';

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  customer_email: string;
  customer_phone: string;
  packaging_guidelines: string;
  customer_additional_requests: string;
  created_at: string;
  order_items: any[];
}

const VendorOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string>('');

  useEffect(() => {
    fetchOrderDetails();
    getCurrentVendor();
  }, [orderId]);

  const getCurrentVendor = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setVendorId(user.id);
  };

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              main_image,
              vendor_id
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Create notification for customer
      if (newStatus === 'packaging') {
        await supabase.from('user_notifications').insert({
          user_id: order?.order_items?.[0]?.products?.vendor_id,
          type: 'order_status',
          title: 'Order Status Updated',
          message: `Your order ${order?.order_number} is now being packaged`,
          category: 'orders'
        });
      }

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`
      });

      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order #{order.order_number}</CardTitle>
            <Badge className={
              order.status === 'pending' ? 'bg-yellow-500' :
              order.status === 'packaging' ? 'bg-blue-500' :
              order.status === 'shipped' ? 'bg-purple-500' :
              'bg-green-500'
            }>
              {order.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Placed on {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <p>Email: {order.customer_email}</p>
              <p>Phone: {order.customer_phone || 'Not provided'}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {item.products?.main_image && (
                    <img
                      src={item.products.main_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Packaging Guidelines */}
          {order.packaging_guidelines && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Packaging Guidelines
              </h3>
              <p className="text-sm text-gray-700">{order.packaging_guidelines}</p>
            </div>
          )}

          {/* Customer Requests */}
          {order.customer_additional_requests && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Additional Customer Requests</h3>
              <p className="text-sm text-gray-700">{order.customer_additional_requests}</p>
            </div>
          )}

          {/* Actions */}
          {order.status === 'pending' && (
            <div className="flex gap-3">
              <Button onClick={() => updateOrderStatus('packaging')} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept & Start Packaging
              </Button>
              <Button variant="destructive" onClick={() => updateOrderStatus('declined')} className="flex-1">
                <XCircle className="w-4 h-4 mr-2" />
                Decline Order
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-lg font-semibold">
              Total: {formatPrice(order.total_amount)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Messaging */}
      {order.payment_status === 'completed' && vendorId && (
        <OrderMessaging orderId={order.id} userType="vendor" userId={vendorId} />
      )}
    </div>
  );
};

export default VendorOrderDetail;
