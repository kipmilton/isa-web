import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Eye, 
  Star, 
  ArrowLeft, 
  RotateCcw,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderWithDetails, OrderItem } from '@/types/order';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import TrackingCodeDisplay from '@/components/TrackingCodeDisplay';

interface OrderReturn {
  id: string;
  order_id: string;  
  reason: string;
  return_type: 'replacement' | 'exchange' | 'refund';
  customer_message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
}

interface OrderRating {
  product_rating?: number;
  delivery_rating?: number;
  product_review_comment?: string;
  delivery_review_comment?: string;
}

const MyOrders = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [orderReturns, setOrderReturns] = useState<Record<string, any>>({});
  const [returnFormData, setReturnFormData] = useState({
    reason: '',
    return_type: 'refund' as 'replacement' | 'exchange' | 'refund',
    customer_message: ''
  });
  const [orderRatings, setOrderRatings] = useState<Record<string, OrderRating>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      fetchOrderReturns();
    }
  }, [user]);

  const fetchOrders = async () => {
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
              return_eligible,
              return_policy_guidelines,
              return_policy_reason
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load your orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderReturns = async () => {
    try {
      // Check if order_returns table exists first
      const { data, error } = await supabase
        .from('order_returns')
        .select('*')
        .eq('customer_id', user?.id)
        .limit(1);

      if (error) {
        console.error('Error fetching order returns:', error);
        // If table doesn't exist or has policy issues, just set empty returns
        setOrderReturns({});
        return;
      }
      
      // If we got here, table exists, fetch all returns
      const { data: allReturns, error: fetchError } = await supabase
        .from('order_returns')
        .select('*')
        .eq('customer_id', user?.id);

      if (fetchError) {
        console.error('Error fetching all order returns:', fetchError);
        setOrderReturns({});
        return;
      }
      
      const returnsMap: Record<string, any> = {};
      allReturns?.forEach(returnItem => {
        returnsMap[returnItem.order_id] = returnItem;
      });
      setOrderReturns(returnsMap);
    } catch (error) {
      console.error('Error fetching order returns:', error);
      setOrderReturns({});
    }
  };

  const getOrderStatus = (order: OrderWithDetails) => {
    if (order.status === 'completed') {
      return { label: 'Completed', color: 'bg-green-500', icon: CheckCircle };
    } else if (order.status === 'pending') {
      return { label: 'Pending', color: 'bg-yellow-500', icon: Clock };
    } else if (order.status === 'delivered') {
      return { label: 'Delivered', color: 'bg-blue-500', icon: Truck };
    }
    return { label: order.status, color: 'bg-gray-500', icon: Package };
  };

  const isReturnEligible = (order: OrderWithDetails) => {
    if (order.status !== 'delivered' || !order.actual_delivery_date) return false;
    
    const deliveryDate = new Date(order.actual_delivery_date);
    const now = new Date();
    const hoursSinceDelivery = (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceDelivery <= 24;
  };

  const submitReturn = async () => {
    if (!selectedOrder || !returnFormData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('order_returns')
        .insert({
          order_id: selectedOrder.id,
          customer_id: user?.id,
          reason: returnFormData.reason,
          return_type: returnFormData.return_type,
          customer_message: returnFormData.customer_message
        });

      if (error) throw error;

      toast({
        title: "Return Request Submitted",
        description: "Successfully submitted, expect a call from ISA soon"
      });

      setShowReturnForm(false);
      setReturnFormData({ reason: '', return_type: 'refund', customer_message: '' });
      fetchOrderReturns();
    } catch (error) {
      console.error('Error submitting return:', error);
      toast({
        title: "Error",
        description: "Failed to submit return request",
        variant: "destructive"
      });
    }
  };

  const submitRating = async (orderId: string) => {
    const rating = orderRatings[orderId];
    if (!rating || !rating.product_rating || !rating.delivery_rating) {
      toast({
        title: "Error",
        description: "Please provide both product and delivery ratings",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          product_rating: rating.product_rating,
          delivery_rating: rating.delivery_rating,
          product_review_comment: rating.product_review_comment,
          delivery_review_comment: rating.delivery_review_comment,
          rated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!"
      });

      fetchOrders();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const returnReasons = [
    'Wrong item',
    "Don't like size",
    'Received wrong item',
    'Received broken item',
    'Product is missing from package',
    'Product quality is not as described',
    'Product is defective'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
              <Button onClick={() => navigate('/shop')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = getOrderStatus(order);
              const StatusIcon = status.icon;
              const returnRequest = orderReturns[order.id];
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Placed on {format(new Date(order.created_at || ''), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${status.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        <span className="font-semibold text-lg">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {item.product_image && (
                            <img 
                              src={item.product_image} 
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × {formatPrice(item.unit_price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                          
                        {order.status === 'delivered' && isReturnEligible(order) && !returnRequest && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowReturnForm(true);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Return Item
                          </Button>
                        )}
                        
                        {order.status === 'delivered' && returnRequest && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Return {returnRequest.status}
                          </Badge>
                        )}
                        
                        {order.status === 'delivered' && !(order as any).product_rating && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Rate Order
                          </Button>
                        )}
                      </div>
                      
                      {order.status === 'delivered' && !isReturnEligible(order) && order.actual_delivery_date && !returnRequest && (
                        <p className="text-xs text-gray-500 mt-2">
                          Return period expired (24hrs after delivery)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder && !showReturnForm} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details #{selectedOrder?.order_number}</DialogTitle>
              <DialogDescription>
                View detailed information about your order including items, tracking, and delivery status.
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Tracking Code Display */}
                <TrackingCodeDisplay orderId={selectedOrder.id} />
                
                <div>
                  <h3 className="font-semibold mb-3">Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.product_name}</h4>
                          <span className="font-semibold">{formatPrice(item.total_price)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Quantity: {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                        
                        {/* Return Policy Info */}
                        {(item as any).products && (
                          <div className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex items-center space-x-2 mb-1">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">Return Policy:</span>
                            </div>
                            {(item as any).products.return_eligible ? (
                              <div>
                                <p className="text-green-600 mb-1">✓ Eligible for return</p>
                                {(item as any).products.return_policy_guidelines && (
                                  <p className="text-gray-600">{(item as any).products.return_policy_guidelines}</p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="text-red-600 mb-1">✗ Not eligible for return</p>
                                {(item as any).products.return_policy_reason && (
                                  <p className="text-gray-600">{(item as any).products.return_policy_reason}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating Section */}
                {selectedOrder.status === 'delivered' && !(selectedOrder as any).product_rating && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Rate Your Experience</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Product Rating</Label>
                        <div className="flex space-x-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Button
                              key={star}
                              variant="ghost"
                              size="sm"
                              onClick={() => setOrderRatings(prev => ({
                                ...prev,
                                [selectedOrder.id]: {
                                  ...prev[selectedOrder.id],
                                  product_rating: star
                                }
                              }))}
                            >
                              <Star 
                                className={`w-5 h-5 ${
                                  (orderRatings[selectedOrder.id]?.product_rating || 0) >= star 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Delivery Rating</Label>
                        <div className="flex space-x-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Button
                              key={star}
                              variant="ghost"
                              size="sm"
                              onClick={() => setOrderRatings(prev => ({
                                ...prev,
                                [selectedOrder.id]: {
                                  ...prev[selectedOrder.id],
                                  delivery_rating: star
                                }
                              }))}
                            >
                              <Star 
                                className={`w-5 h-5 ${
                                  (orderRatings[selectedOrder.id]?.delivery_rating || 0) >= star 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Product Review</Label>
                        <Textarea
                          placeholder="Tell us about the product quality..."
                          value={orderRatings[selectedOrder.id]?.product_review_comment || ''}
                          onChange={(e) => setOrderRatings(prev => ({
                            ...prev,
                            [selectedOrder.id]: {
                              ...prev[selectedOrder.id],
                              product_review_comment: e.target.value
                            }
                          }))}
                        />
                      </div>

                      <div>
                        <Label>Delivery Review</Label>
                        <Textarea
                          placeholder="How was your delivery experience..."
                          value={orderRatings[selectedOrder.id]?.delivery_review_comment || ''}
                          onChange={(e) => setOrderRatings(prev => ({
                            ...prev,
                            [selectedOrder.id]: {
                              ...prev[selectedOrder.id],
                              delivery_review_comment: e.target.value
                            }
                          }))}
                        />
                      </div>

                      <Button 
                        onClick={() => submitRating(selectedOrder.id)}
                        className="w-full"
                      >
                        Submit Rating
                      </Button>
                    </div>
                  </div>
                )}

                {(selectedOrder as any).product_rating && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Your Review</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Product: </span>
                        <div className="flex">
                          {Array.from({ length: (selectedOrder as any).product_rating || 0 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Delivery: </span>
                        <div className="flex">
                          {Array.from({ length: (selectedOrder as any).delivery_rating || 0 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      {(selectedOrder as any).product_review_comment && (
                        <p className="text-sm mt-2"><strong>Product:</strong> {(selectedOrder as any).product_review_comment}</p>
                      )}
                      {(selectedOrder as any).delivery_review_comment && (
                        <p className="text-sm mt-1"><strong>Delivery:</strong> {(selectedOrder as any).delivery_review_comment}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Return Form Dialog */}
        <Dialog open={showReturnForm} onOpenChange={setShowReturnForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Request</DialogTitle>
              <DialogDescription>
                Submit a return request for your order. Please provide details about why you want to return the item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason for Return</Label>
                <Select 
                  value={returnFormData.reason} 
                  onValueChange={(value) => setReturnFormData(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>What would you like in return?</Label>
                <Select 
                  value={returnFormData.return_type} 
                  onValueChange={(value: 'replacement' | 'exchange' | 'refund') => 
                    setReturnFormData(prev => ({ ...prev, return_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replacement">Replacement</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="refund">Refund (to ISA Wallet)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Additional Message (Optional)</Label>
                <Textarea
                  placeholder="Provide any additional details about your return..."
                  value={returnFormData.customer_message}
                  onChange={(e) => setReturnFormData(prev => ({ ...prev, customer_message: e.target.value }))}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReturnForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitReturn}
                  className="flex-1"
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyOrders;