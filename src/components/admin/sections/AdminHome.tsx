import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, ShoppingCart, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

const AdminHome = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalOrders: 0,
    siteVisits: 0,
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, [timeFilter]);

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

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateFilter = getDateFilter();
      
      // Fetch users
      let usersQuery = supabase
        .from('profiles')
        .select('created_at', { count: 'exact' })
        .eq('user_type', 'customer');
      
      if (dateFilter) {
        usersQuery = usersQuery.gte('created_at', dateFilter);
      }
      
      const { count: userCount } = await usersQuery;

      // Fetch vendors
      let vendorsQuery = supabase
        .from('profiles')
        .select('created_at', { count: 'exact' })
        .eq('user_type', 'vendor')
        .eq('status', 'approved');
      
      if (dateFilter) {
        vendorsQuery = vendorsQuery.gte('created_at', dateFilter);
      }
      
      const { count: vendorCount } = await vendorsQuery;

      // Fetch orders
      let ordersQuery = supabase
        .from('orders')
        .select('created_at', { count: 'exact' });
      
      if (dateFilter) {
        ordersQuery = ordersQuery.gte('created_at', dateFilter);
      }
      
      const { count: orderCount } = await ordersQuery;

      // Simulate site visits (in real app, you'd use analytics)
      const siteVisits = (userCount || 0) * 15 + (vendorCount || 0) * 8;

      setOverview({
        totalUsers: userCount || 0,
        totalVendors: vendorCount || 0,
        totalOrders: orderCount || 0,
        siteVisits,
      });

      // Generate trend data
      await generateTrendData(dateFilter);
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

  const generateTrendData = async (dateFilter: string | null) => {
    try {
      const days = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90;
      const data = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

        // Fetch daily stats
        const { count: newUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'customer')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);

        const { count: newVendors } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'vendor')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);

        data.push({
          date: timeFilter === 'today' ? date.toLocaleTimeString('en-US', { hour: '2-digit' }) : 
                timeFilter === 'week' ? date.toLocaleDateString('en-US', { weekday: 'short' }) :
                date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          customers: newUsers || 0,
          vendors: newVendors || 0,
          visits: ((newUsers || 0) * 15 + (newVendors || 0) * 8),
        });
      }

      setTrendData(data);
    } catch (error) {
      console.error('Error generating trend data:', error);
    }
  };

  const filters: { value: TimeFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Platform statistics and insights</p>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Platform statistics and insights</p>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAllData}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Platform statistics and insights</p>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-blue-700 font-medium mb-1">New Customers</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900">
                  {overview.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-purple-700 font-medium mb-1">New Vendors</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900">
                  {overview.totalVendors.toLocaleString()}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-green-700 font-medium mb-1">Total Orders</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900">
                  {overview.totalOrders.toLocaleString()}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-orange-700 font-medium mb-1">Site Visits</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900">
                  {overview.siteVisits.toLocaleString()}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="New Customers"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="vendors" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  name="New Vendors"
                  dot={{ fill: '#a855f7', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Site Visits"
                  dot={{ fill: '#f97316', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
