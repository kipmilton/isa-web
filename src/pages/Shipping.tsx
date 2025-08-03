import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Clock, 
  Package, 
  User, 
  Phone, 
  Navigation, 
  CheckCircle, 
  XCircle,
  Truck,
  DollarSign,
  Calendar,
  ArrowLeft,
  Map,
  PhoneCall
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DeliveryOrder {
  id: string;
  order_id: string;
  pickup_location_address: string;
  delivery_location_address: string;
  distance_km: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  estimated_delivery_time: string | null;
  actual_delivery_time: string | null;
  current_location_lat: number | null;
  current_location_lng: number | null;
  tracking_updates: any[];
  order: {
    customer_email: string;
    customer_phone: string | null;
    order_number: string;
    total_amount: number;
    delivery_type: string;
  };
  delivery_personnel: {
    first_name: string;
    last_name: string;
    phone_number: string;
  } | null;
}

const Shipping = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchDeliveryOrders();
    }
  }, [user?.id, activeTab]);

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('delivery_orders')
        .select(`
          *,
          order:orders(
            customer_email,
            customer_phone,
            order_number,
            total_amount,
            delivery_type
          ),
          delivery_personnel:delivery_personnel(
            first_name,
            last_name,
            phone_number
          )
        `)
        .eq('order.user_id', user.id);

      if (activeTab === 'active') {
        query = query.not('status', 'in', ['delivered', 'cancelled']);
      } else if (activeTab === 'completed') {
        query = query.in('status', ['delivered', 'cancelled']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeliveryOrders(data || []);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      assigned: { color: 'bg-blue-100 text-blue-800', icon: Package },
      picked_up: { color: 'bg-orange-100 text-orange-800', icon: Truck },
      in_transit: { color: 'bg-purple-100 text-purple-800', icon: Navigation },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      pending: "Your order is waiting to be assigned to a delivery partner",
      assigned: "A delivery partner has been assigned to your order",
      picked_up: "Your order has been picked up from the vendor",
      in_transit: "Your order is on its way to you",
      delivered: "Your order has been successfully delivered",
      cancelled: "Your order has been cancelled"
    };

    return descriptions[status as keyof typeof descriptions] || descriptions.pending;
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const formatEstimatedTime = (timeString: string | null) => {
    if (!timeString) return "Not available";
    return new Date(timeString).toLocaleString();
  };

  const calculateEstimatedArrival = (order: DeliveryOrder) => {
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return null;
    }

    if (order.estimated_delivery_time) {
      const estimated = new Date(order.estimated_delivery_time);
      const now = new Date();
      const diffMs = estimated.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins > 0) {
        return `${diffMins} minutes`;
      } else if (diffMins < 0) {
        return "Overdue";
      } else {
        return "Arriving now";
      }
    }

    return "Calculating...";
  };

  const openMap = (lat: number, lng: number, address: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const callDeliveryPersonnel = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your shipping information</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/shop" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Shop</span>
            </Link>
            <div className="ml-6">
              <h1 className="text-xl font-semibold text-gray-900">Shipping & Delivery</h1>
              <p className="text-sm text-gray-600">Track your orders in real-time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Deliveries</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Deliveries</h2>
              <Button onClick={fetchDeliveryOrders} variant="outline" size="sm">
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading deliveries...</p>
              </div>
            ) : deliveryOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Deliveries</h3>
                  <p className="text-gray-600">You don't have any active deliveries at the moment.</p>
                  <Button onClick={() => navigate('/shop')} className="mt-4">
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {deliveryOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          Order #{order.order.order_number}
                        </CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium">Pickup:</span>
                          <span className="ml-1 text-gray-600 truncate">{order.pickup_location_address}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium">Delivery:</span>
                          <span className="ml-1 text-gray-600 truncate">{order.delivery_location_address}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Navigation className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{formatDistance(order.distance_km)}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                          <span className="font-medium">KES {order.delivery_fee}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                        <span>Ordered: {formatTime(order.created_at)}</span>
                      </div>

                      {order.estimated_delivery_time && (
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-1 text-gray-500" />
                          <span>Estimated: {formatEstimatedTime(order.estimated_delivery_time)}</span>
                        </div>
                      )}

                      {order.status === 'in_transit' && order.current_location_lat && order.current_location_lng && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-green-600">
                            🚚 Your order is {calculateEstimatedArrival(order)} away
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => openMap(order.current_location_lat!, order.current_location_lng!, order.delivery_location_address)}
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                            >
                              <Map className="w-4 h-4 mr-1" />
                              View on Map
                            </Button>
                            {order.delivery_personnel && (
                              <Button 
                                onClick={() => callDeliveryPersonnel(order.delivery_personnel!.phone_number)}
                                variant="outline" 
                                size="sm"
                                className="flex-1"
                              >
                                <PhoneCall className="w-4 h-4 mr-1" />
                                Call Driver
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {order.delivery_personnel && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1 text-gray-500" />
                              <span className="font-medium">Driver:</span>
                              <span className="ml-1">{order.delivery_personnel.first_name} {order.delivery_personnel.last_name}</span>
                            </div>
                            <Button 
                              onClick={() => callDeliveryPersonnel(order.delivery_personnel!.phone_number)}
                              variant="ghost" 
                              size="sm"
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        {getStatusDescription(order.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Completed Deliveries</h2>
              <Button onClick={fetchDeliveryOrders} variant="outline" size="sm">
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading deliveries...</p>
              </div>
            ) : deliveryOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Deliveries</h3>
                  <p className="text-gray-600">You haven't completed any deliveries yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {deliveryOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          Order #{order.order.order_number}
                        </CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium">Pickup:</span>
                          <span className="ml-1 text-gray-600 truncate">{order.pickup_location_address}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium">Delivery:</span>
                          <span className="ml-1 text-gray-600 truncate">{order.delivery_location_address}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Navigation className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{formatDistance(order.distance_km)}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                          <span className="font-medium">KES {order.delivery_fee}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                        <span>Ordered: {formatTime(order.created_at)}</span>
                      </div>

                      {order.actual_delivery_time && (
                        <div className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                          <span>Delivered: {formatTime(order.actual_delivery_time)}</span>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {getStatusDescription(order.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Shipping; 