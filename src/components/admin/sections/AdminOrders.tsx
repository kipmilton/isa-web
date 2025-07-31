import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, Eye, Package, Calendar, DollarSign, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentStatusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            unit_price,
            product_id
          ),
          profiles!orders_user_id_fkey (
            first_name,
            last_name,
            email,
            phone_number,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(order => order.payment_status === paymentStatusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Status Updated",
        description: `Order status has been updated to ${newStatus}.`
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0).replace('KSh', 'Ksh');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">View and manage all platform orders</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPaymentStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Orders ({filteredOrders.length} of {orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Fulfillment Method</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.order_number || order.id?.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {order.profiles?.first_name && order.profiles?.last_name 
                          ? `${order.profiles.first_name} ${order.profiles.last_name}`
                          : order.profiles?.email?.split('@')[0] || order.customer_email?.split('@')[0] || 'N/A'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.profiles?.email || order.customer_email || 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.payment_status || 'pending')}>
                      {order.payment_status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.fulfillment_method || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.created_at 
                      ? new Date(order.created_at).toLocaleDateString() 
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setOrderDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleOrderStatusUpdate(order.id, 'processing')}
                        >
                          Process
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleOrderStatusUpdate(order.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {orders.length === 0 ? "No orders found" : "No orders match your filters"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Order Information</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Number:</span>
                      <span className="text-sm font-medium">{selectedOrder.order_number || selectedOrder.id?.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Date:</span>
                      <span className="text-sm font-medium">
                        {selectedOrder.created_at 
                          ? new Date(selectedOrder.created_at).toLocaleDateString() 
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant={getStatusVariant(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Status:</span>
                      <Badge variant={getStatusVariant(selectedOrder.payment_status || 'pending')}>
                        {selectedOrder.payment_status || 'pending'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fulfillment Method:</span>
                      <span className="text-sm font-medium">{selectedOrder.fulfillment_method || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Customer Information</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium">
                        {selectedOrder.profiles?.first_name && selectedOrder.profiles?.last_name 
                          ? `${selectedOrder.profiles.first_name} ${selectedOrder.profiles.last_name}`
                          : 'Not provided'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedOrder.profiles?.email || selectedOrder.customer_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm font-medium">{selectedOrder.profiles?.phone_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium">{selectedOrder.profiles?.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Order Items</span>
                </div>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.order_items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Total */}
              <div className="flex justify-end">
                <div className="text-right space-y-2">
                  <div className="text-lg font-bold">
                    Total: {formatCurrency(selectedOrder.total_amount)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOrderDetailsOpen(false)}
                >
                  Close
                </Button>
                {selectedOrder.status === 'pending' && (
                  <Button
                    onClick={() => {
                      handleOrderStatusUpdate(selectedOrder.id, 'processing');
                      setOrderDetailsOpen(false);
                    }}
                  >
                    Process Order
                  </Button>
                )}
                {selectedOrder.status === 'processing' && (
                  <Button
                    onClick={() => {
                      handleOrderStatusUpdate(selectedOrder.id, 'completed');
                      setOrderDetailsOpen(false);
                    }}
                  >
                    Complete Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;