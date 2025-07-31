import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, ShoppingCart, Package, Star, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminHome = () => {
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    pendingVendors: 0,
    lowStockProducts: 0
  });
  const [vendorsByPlan, setVendorsByPlan] = useState<any[]>([]);
  const [usersByCounty, setUsersByCounty] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchOverviewData(),
        fetchVendorsByPlan(),
        fetchUsersByCounty(),
        fetchRecentOrders()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewData = async () => {
    try {
      // Total users (customers)
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'customer');

      if (userError) throw userError;

      // Total vendors
      const { count: vendorCount, error: vendorError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'vendor')
        .eq('status', 'approved');

      if (vendorError) throw vendorError;

      // Pending vendors
      const { count: pendingVendorCount, error: pendingVendorError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'vendor')
        .eq('status', 'pending');

      if (pendingVendorError) throw pendingVendorError;

      // Total orders
      const { count: orderCount, error: orderError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (orderError) throw orderError;

      // Total products
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (productError) throw productError;

      // Low stock products (less than 5 items)
      const { count: lowStockCount, error: lowStockError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('stock_quantity', 5);

      if (lowStockError) throw lowStockError;

      // Total revenue (sum of completed orders)
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'completed');

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Pending payments (from withdrawals table)
      const { count: pendingPayments, error: pendingPaymentsError } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingPaymentsError) throw pendingPaymentsError;

      setOverview({
        totalUsers: userCount || 0,
        totalVendors: vendorCount || 0,
        totalOrders: orderCount || 0,
        totalProducts: productCount || 0,
        totalRevenue,
        pendingPayments: pendingPayments || 0,
        pendingVendors: pendingVendorCount || 0,
        lowStockProducts: lowStockCount || 0
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
      throw error;
    }
  };

  const fetchVendorsByPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('user_type', 'vendor')
        .eq('status', 'approved');

      if (error) throw error;

      const planCounts: Record<string, number> = {
        free: 0,
        premium_weekly: 0,
        premium_monthly: 0,
        premium_yearly: 0,
        pro: 0
      };

      data?.forEach((profile) => {
        let preferences = profile.preferences;
        if (typeof preferences === 'string') {
          try { preferences = JSON.parse(preferences); } catch { preferences = {}; }
        }
        const plan = (preferences && typeof preferences === 'object' && 'plan' in preferences && typeof preferences.plan === 'string') 
          ? preferences.plan 
          : 'free';
        if (planCounts.hasOwnProperty(plan)) {
          planCounts[plan]++;
        } else {
          planCounts.free++;
        }
      });

      const planData = Object.entries(planCounts).map(([plan, count]) => ({
        plan: plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count
      }));

      setVendorsByPlan(planData);
    } catch (error) {
      console.error('Error fetching vendors by plan:', error);
      throw error;
    }
  };

  const fetchUsersByCounty = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location')
        .eq('user_type', 'customer');

      if (error) throw error;

      const countyCounts: Record<string, number> = {};
      data?.forEach((profile) => {
        const county = profile.location || 'Unknown';
        countyCounts[county] = (countyCounts[county] || 0) + 1;
      });

      const countyData = Object.entries(countyCounts)
        .map(([county, count]) => ({ county, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 counties

      setUsersByCounty(countyData);
    } catch (error) {
      console.error('Error fetching users by county:', error);
      throw error;
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          payment_status,
          created_at,
          profiles!orders_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('KSh', 'Ksh');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-2">Platform statistics and insights</p>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-2">Platform statistics and insights</p>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600 mt-2">Platform statistics and insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalVendors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overview.pendingVendors > 0 && `${overview.pendingVendors} pending approval`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overview.lowStockProducts > 0 && `${overview.lowStockProducts} low stock`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Payments Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Withdrawal requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendors by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendorsByPlan.map((item) => (
                <div key={item.plan} className="flex justify-between items-center">
                  <span className="font-medium">{item.plan}</span>
                  <span className="text-2xl font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Counties by Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Counties by Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usersByCounty.map((item, index) => (
                <div key={item.county} className="flex justify-between items-center">
                  <span className="font-medium">
                    {index + 1}. {item.county}
                  </span>
                  <span className="text-2xl font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">
                      {order.profiles?.first_name && order.profiles?.last_name 
                        ? `${order.profiles.first_name} ${order.profiles.last_name}`
                        : order.profiles?.email?.split('@')[0] || 'Unknown'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{formatCurrency(order.total_amount || 0)}</span>
                    <p className="text-xs text-gray-500 capitalize">{order.payment_status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;