
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ShoppingCart, Store, Package, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const [vendorApplications, setVendorApplications] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [overview, setOverview] = useState({ users: 0, vendors: 0, orders: 0, products: 0 });
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewVendorDialogOpen, setViewVendorDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
    fetchProducts();
    fetchOrders();
    fetchUserStats();
    fetchOverview();
  }, []);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'vendor')
      .eq('status', 'pending');
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch vendors', variant: 'destructive' });
      return;
    }
    setVendorApplications(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
      return;
    }
    setProducts(data || []);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*');
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch orders', variant: 'destructive' });
      return;
    }
    setOrders(data || []);
  };

  const fetchUserStats = async () => {
    // Fetch all customers with their county and user_type
    const { data, error } = await supabase
      .from('profiles')
      .select('county, user_type')
      .eq('user_type', 'customer');
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch user stats', variant: 'destructive' });
      return;
    }
    // Group by county in JS
    const countyCounts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      if (row.county) {
        countyCounts[row.county] = (countyCounts[row.county] || 0) + 1;
      }
    });
    // Get all counties (including those with zero users)
    const allCounties = Array.from(new Set((data || []).map((u: any) => u.county).filter(Boolean)));
    const stats = allCounties.map(county => ({ county, count: countyCounts[county] || 0 }));
    setUserStats(stats);
  };

  const fetchOverview = async () => {
    // Users
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'customer');
    // Vendors
    const { count: vendorCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'vendor');
    // Orders
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    // Products
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    setOverview({
      users: userCount || 0,
      vendors: vendorCount || 0,
      orders: orderCount || 0,
      products: productCount || 0,
    });
  };

  const handleVendorAction = async (vendorId: string, action: 'approve' | 'decline', email: string) => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', vendorId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update vendor status', variant: 'destructive' });
      return;
    }
    toast({
      title: action === 'approve' ? 'Vendor Approved' : 'Vendor Declined',
      description: `Vendor application has been ${action === 'approve' ? 'approved' : 'declined'} successfully.`,
    });
    fetchVendors();
    setViewVendorDialogOpen(false);
    setSelectedVendor(null);
  };

  const handleViewVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setViewVendorDialogOpen(true);
  };

  const handleBanProduct = (product: any) => {
    setSelectedProduct(product);
    setBanReason("");
    setBanDialogOpen(true);
  };

  const confirmBanProduct = async () => {
    if (!selectedProduct) return;
    const { error } = await supabase
      .from('products')
      .update({ banned: true, banned_reason: banReason })
      .eq('id', selectedProduct.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to ban product', variant: 'destructive' });
      return;
    }
    toast({ title: 'Product Banned', description: 'Product has been banned and the vendor will see the reason.' });
    setBanDialogOpen(false);
    setSelectedProduct(null);
    setBanReason("");
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your platform operations</p>
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.users}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.vendors}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.orders}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.products}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Users by County</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>County</TableHead>
                      <TableHead>Number of Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStats.map((stat: any) => (
                      <TableRow key={stat.county}>
                        <TableCell className="font-medium">{stat.county}</TableCell>
                        <TableCell>{stat.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="vendors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Vendor Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Representative</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorApplications.map((vendor: any) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.company || '-'}</TableCell>
                        <TableCell>{vendor.first_name} {vendor.last_name}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.location || '-'}</TableCell>
                        <TableCell>{vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleViewVendor(vendor)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {/* Vendor Details Dialog */}
            <Dialog open={viewVendorDialogOpen} onOpenChange={setViewVendorDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Vendor Application Details</DialogTitle>
                  <DialogDescription>Review and take action on this vendor application.</DialogDescription>
                </DialogHeader>
                {selectedVendor && (
                  <div className="space-y-2">
                    <div><b>Company:</b> {selectedVendor.company || '-'}</div>
                    <div><b>Name:</b> {selectedVendor.first_name} {selectedVendor.last_name}</div>
                    <div><b>Email:</b> {selectedVendor.email}</div>
                    <div><b>Location:</b> {selectedVendor.location || '-'}</div>
                    <div><b>Phone:</b> {selectedVendor.phone_number || '-'}</div>
                    <div><b>Status:</b> {selectedVendor.status}</div>
                    <div><b>Applied:</b> {selectedVendor.created_at ? new Date(selectedVendor.created_at).toLocaleDateString() : '-'}</div>
                    {/* Add more fields as needed */}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVendorAction(selectedVendor.id, 'approve', selectedVendor.email)}>Accept</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleVendorAction(selectedVendor.id, 'decline', selectedVendor.email)}>Reject</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount (KSH)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customer_email || order.customer || '-'}</TableCell>
                        <TableCell>{order.vendor_id || order.vendor || '-'}</TableCell>
                        <TableCell>{order.amount?.toLocaleString() || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'fulfilled' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.date ? new Date(order.date).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Management</CardTitle>
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
                    {products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.price}</TableCell>
                        <TableCell>{product.vendor_id}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          {product.banned ? (
                            <span className="text-red-600 font-semibold">Banned</span>
                          ) : (
                            <span className="text-green-600">Active</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!product.banned && (
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Ban Reason Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban Product</DialogTitle>
              <DialogDescription>Provide a reason for banning this product. The vendor will see this reason.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Enter reason for banning..."
                rows={4}
                required
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
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
    </div>
  );
};

export default Admin;
