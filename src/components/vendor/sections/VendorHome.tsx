import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, TrendingUp, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VendorHomeProps {
  vendorId: string;
  plan?: string;
  planExpiry?: string | null;
  productCount?: number;
  onUpgrade?: () => void;
}

const VendorHome = ({ vendorId, plan, planExpiry, productCount, onUpgrade }: VendorHomeProps) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalOrders: 0,
    avgRating: 0,
    pendingOrders: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    fetchStats();
  }, [vendorId]);

  const fetchStats = async () => {
    try {
      // Fetch vendor products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId);

      // Fetch vendor orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products!inner (vendor_id)
          )
        `)
        .eq('order_items.products.vendor_id', vendorId);

      // Calculate stats
      const totalProducts = products?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending')?.length || 0;
      
      // Calculate average rating
      const productsWithRatings = products?.filter(p => p.rating && p.rating > 0) || [];
      const avgRating = productsWithRatings.length > 0 
        ? productsWithRatings.reduce((sum, p) => sum + p.rating, 0) / productsWithRatings.length 
        : 0;

      // Get unique customers
      const uniqueCustomers = new Set(orders?.map(order => order.user_id)).size;

      setStats({
        totalSales,
        totalProducts,
        totalOrders,
        avgRating,
        pendingOrders,
        totalCustomers: uniqueCustomers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('KSh', 'Ksh');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Track your business performance and growth</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Total Sales</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Average Rating</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Pending Orders</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Customers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Business Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Revenue Growth</span>
                <span className="text-green-600 font-semibold text-sm sm:text-base">+12.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Order Fulfillment Rate</span>
                <span className="text-blue-600 font-semibold text-sm sm:text-base">95.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Customer Satisfaction</span>
                <span className="text-yellow-600 font-semibold text-sm sm:text-base">{stats.avgRating.toFixed(1)}/5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">Add new products to increase sales</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800">
                  {stats.pendingOrders > 0 
                    ? `You have ${stats.pendingOrders} pending orders to process`
                    : "All orders are up to date!"
                  }
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-green-800">Check your wallet for available payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorHome;