import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Star, Eye, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface VendorHomeProps {
  vendorId: string;
  plan?: string;
  planExpiry?: string | null;
  productCount?: number;
  onUpgrade?: () => void;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';

const VendorHome = ({ vendorId }: VendorHomeProps) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    productsSold: 0,
    productClicks: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [vendorId, timeFilter]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return monthAgo.toISOString();
      default:
        return null;
    }
  };

  const fetchStats = async () => {
    try {
      const dateFilter = getDateFilter();
      
      // Base query for orders
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          order_items!inner (
            quantity,
            total_price,
            products!inner (vendor_id)
          )
        `)
        .eq('order_items.products.vendor_id', vendorId);

      if (dateFilter) {
        ordersQuery = ordersQuery.gte('created_at', dateFilter);
      }

      const { data: orders } = await ordersQuery;

      // Fetch products for ratings and clicks
      const { data: products } = await supabase
        .from('products')
        .select('rating, review_count')
        .eq('vendor_id', vendorId);

      // Calculate stats
      const totalSales = orders?.reduce((sum, order) => {
        const vendorItems = order.order_items.filter(
          (item: any) => item.products.vendor_id === vendorId
        );
        return sum + vendorItems.reduce((itemSum: number, item: any) => itemSum + (item.total_price || 0), 0);
      }, 0) || 0;

      const pendingOrders = orders?.filter(order => order.status === 'pending')?.length || 0;
      
      const productsSold = orders?.reduce((sum, order) => {
        const vendorItems = order.order_items.filter(
          (item: any) => item.products.vendor_id === vendorId
        );
        return sum + vendorItems.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
      }, 0) || 0;

      // Calculate average rating
      const productsWithRatings = products?.filter(p => p.rating && p.rating > 0) || [];
      const avgRating = productsWithRatings.length > 0 
        ? productsWithRatings.reduce((sum, p) => sum + p.rating, 0) / productsWithRatings.length 
        : 0;

      // Simulate product clicks (in a real app, you'd track this)
      const productClicks = products?.reduce((sum, p) => sum + (p.review_count || 0) * 10, 0) || 0;

      setStats({
        totalSales,
        pendingOrders,
        productsSold,
        productClicks,
        avgRating,
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

  const filters: { value: TimeFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Track your business performance</p>
        </div>
        
        {/* Time Filter */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={timeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter(filter.value)}
              className="text-xs sm:text-sm"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-green-700 font-medium mb-1">Total Sales</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 truncate">
                  {formatCurrency(stats.totalSales)}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-orange-700 font-medium mb-1">Pending Orders</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900">
                  {stats.pendingOrders}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-blue-700 font-medium mb-1">Products Sold</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900">
                  {stats.productsSold}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-purple-700 font-medium mb-1">Product Views</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900">
                  {stats.productClicks.toLocaleString()}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-yellow-700 font-medium mb-1">Average Rating</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-900">
                  {stats.avgRating.toFixed(1)} ★
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-indigo-700 font-medium mb-1">Performance</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-900">
                  {stats.pendingOrders === 0 ? '100%' : '85%'}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-800 font-medium">
                Add new products to increase sales
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs sm:text-sm text-orange-800 font-medium">
                {stats.pendingOrders > 0 
                  ? `${stats.pendingOrders} orders need processing`
                  : "All orders processed!"
                }
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs sm:text-sm text-green-800 font-medium">
                Check wallet for available payouts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorHome;
