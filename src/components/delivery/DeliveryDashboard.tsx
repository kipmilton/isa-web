import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

interface DeliveryDashboardProps {
  user: any;
  onLogout: () => void;
}

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
  current_location_lat: number | null;
  current_location_lng: number | null;
  order: {
    customer_email: string;
    customer_phone: string | null;
    order_number: string;
    total_amount: number;
  };
}

const DeliveryDashboard = ({ user, onLogout }: DeliveryDashboardProps) => {
  const [activeTab, setActiveTab] = useState('available');
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliveryOrders();
    checkOnlineStatus();
  }, [user.id, activeTab]);

  const checkOnlineStatus = async () => {
    try {
      const { data: deliveryPersonnel } = await supabase
        .from('delivery_personnel')
        .select('is_online, is_available, status')
        .eq('user_id', user.id)
        .single();

      if (deliveryPersonnel) {
        setIsOnline(deliveryPersonnel.is_online && deliveryPersonnel.is_available);
      }
    } catch (error) {
      console.error('Error checking online status:', error);
    }
  };

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      
      // Get delivery personnel ID
      const { data: deliveryPersonnel } = await supabase
        .from('delivery_personnel')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!deliveryPersonnel) return;

      let query = supabase
        .from('delivery_orders')
        .select(`
          *,
          order:orders(
            customer_email,
            customer_phone,
            order_number,
            total_amount
          )
        `)
        .eq('delivery_personnel_id', deliveryPersonnel.id);

      if (activeTab === 'available') {
        query = supabase
          .from('delivery_orders')
          .select(`
            *,
            order:orders(
              customer_email,
              customer_phone,
              order_number,
              total_amount
            )
          `)
          .is('delivery_personnel_id', null)
          .eq('status', 'pending');
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

  const toggleOnlineStatus = async () => {
    try {
      const { error } = await supabase
        .from('delivery_personnel')
        .update({ 
          is_online: !isOnline,
          is_available: !isOnline 
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsOnline(!isOnline);
      toast({
        title: isOnline ? "Going Offline" : "Going Online",
        description: isOnline ? "You are now offline" : "You are now online and available for deliveries"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      // Get delivery personnel ID
      const { data: deliveryPersonnel } = await supabase
        .from('delivery_personnel')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!deliveryPersonnel) return;

      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          delivery_personnel_id: deliveryPersonnel.id,
          status: 'assigned'
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Delivery Accepted",
        description: "You have successfully accepted this delivery"
      });

      fetchDeliveryOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept delivery",
        variant: "destructive"
      });
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Delivery status updated to ${status}`
      });

      fetchDeliveryOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
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

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Delivery Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={toggleOnlineStatus}
                variant={isOnline ? "default" : "outline"}
                className={isOnline ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {isOnline ? "Online" : "Offline"}
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Deliveries</TabsTrigger>
            <TabsTrigger value="my-deliveries">My Deliveries</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Available Deliveries</h2>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Deliveries</h3>
                  <p className="text-gray-600">There are currently no deliveries available in your area.</p>
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

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{order.order.customer_email}</span>
                        </div>
                        {order.order.customer_phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1 text-gray-500" />
                            <span>{order.order.customer_phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                        <span>{formatTime(order.created_at)}</span>
                      </div>

                      <Button 
                        onClick={() => acceptDelivery(order.id)}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        disabled={!isOnline}
                      >
                        Accept Delivery
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-deliveries" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Deliveries</h2>
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
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Deliveries</h3>
                  <p className="text-gray-600">You don't have any active deliveries at the moment.</p>
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

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{order.order.customer_email}</span>
                        </div>
                        {order.order.customer_phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1 text-gray-500" />
                            <span>{order.order.customer_phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                        <span>{formatTime(order.created_at)}</span>
                      </div>

                      <div className="space-y-2">
                        {order.status === 'assigned' && (
                          <Button 
                            onClick={() => updateDeliveryStatus(order.id, 'picked_up')}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                          >
                            Mark as Picked Up
                          </Button>
                        )}
                        {order.status === 'picked_up' && (
                          <Button 
                            onClick={() => updateDeliveryStatus(order.id, 'in_transit')}
                            className="w-full bg-purple-500 hover:bg-purple-600"
                          >
                            Start Delivery
                          </Button>
                        )}
                        {order.status === 'in_transit' && (
                          <Button 
                            onClick={() => updateDeliveryStatus(order.id, 'delivered')}
                            className="w-full bg-green-500 hover:bg-green-600"
                          >
                            Mark as Delivered
                          </Button>
                        )}
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

export default DeliveryDashboard; 