import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  DollarSign,
  Crown,
  Star,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminSubscriptions = () => {
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [vendorSubscriptions, setVendorSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // Load user subscriptions
      const { data: userSubs, error: userError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles!inner (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (!userError && userSubs) {
        setUserSubscriptions(userSubs);
      }

      // Load vendor subscriptions
      const { data: vendorSubs, error: vendorError } = await supabase
        .from('vendor_subscriptions')
        .select(`
          *,
          profiles!inner (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (!vendorError && vendorSubs) {
        setVendorSubscriptions(vendorSubs);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500 text-white">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'premium':
        return <Badge className="bg-purple-500 text-white">Premium</Badge>;
      case 'freemium':
        return <Badge className="bg-blue-500 text-white">Freemium</Badge>;
      case 'free':
        return <Badge className="bg-gray-500 text-white">Free</Badge>;
      default:
        return <Badge variant="outline">{planType}</Badge>;
    }
  };

  const getBillingCycleBadge = (cycle: string) => {
    switch (cycle) {
      case 'weekly':
        return <Badge variant="outline">Weekly</Badge>;
      case 'monthly':
        return <Badge variant="outline">Monthly</Badge>;
      case 'yearly':
        return <Badge variant="outline">Yearly</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage user and vendor subscription plans</p>
      </div>

      {/* Subscription Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total User Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              {userSubscriptions.filter(s => s.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendor Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              {vendorSubscriptions.filter(s => s.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userSubscriptions.filter(s => s.plan_type === 'premium' && s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active premium subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Vendors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendorSubscriptions.filter(s => s.plan_type === 'premium' && s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active premium vendors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Subscription Plans</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-600">User Plans</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Free Plan</h4>
                    <Badge className="bg-gray-500 text-white">Free</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Basic features for casual shoppers</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Up to 5 brand recommendations</li>
                    <li>• Basic profile setup</li>
                    <li>• Limited AI interactions (15/month)</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Premium Plan</h4>
                    <Badge className="bg-purple-500 text-white">Premium</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Full MyPlug experience with advanced features</p>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Pricing:</strong> KES 99/week | KES 499/month | KES 4,999/year
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Unlimited AI shopping assistance</li>
                    <li>• Virtual try-on & personal styling</li>
                    <li>• Exclusive early access to drops</li>
                    <li>• Ad-free browsing</li>
                    <li>• Multiple wishlists</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-600">Vendor Plans</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Freemium Plan</h4>
                    <Badge className="bg-blue-500 text-white">Freemium</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Commission-only for small brands</p>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Commission:</strong> 10% (fashion/lifestyle/home) | 5% (beverages/wellness)
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Product listing & buyer access</li>
                    <li>• Order management dashboard</li>
                    <li>• Basic analytics</li>
                    <li>• Email support</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Premium Plan</h4>
                    <Badge className="bg-orange-500 text-white">Premium</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Growth-focused for established brands</p>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Pricing:</strong> $20/month + reduced commission
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Commission:</strong> 5% (fashion/lifestyle/home) | 2% (beverages/wellness)
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Unlimited product listings</li>
                    <li>• Advanced analytics & insights</li>
                    <li>• Boosted search placement</li>
                    <li>• Premium collections inclusion</li>
                    <li>• Direct customer messaging</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>User Subscriptions ({userSubscriptions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center space-x-2">
            <Crown className="w-4 h-4" />
            <span>Vendor Subscriptions ({vendorSubscriptions.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              {userSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No user subscriptions found
                </div>
              ) : (
                <div className="space-y-4">
                  {userSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">
                              {subscription.profiles?.first_name} {subscription.profiles?.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">{subscription.profiles?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPlanBadge(subscription.plan_type)}
                          {getSubscriptionStatusBadge(subscription.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Billing Cycle:</span>
                          <div className="mt-1">{getBillingCycleBadge(subscription.billing_cycle)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Price:</span>
                          <div className="mt-1 font-medium">
                            {subscription.price_kes ? `KES ${subscription.price_kes}` : 'Free'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <div className="mt-1">
                            {new Date(subscription.started_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {subscription.expires_at && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-500">Expires:</span>
                          <div className="mt-1">
                            {new Date(subscription.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No vendor subscriptions found
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">
                              {subscription.profiles?.first_name} {subscription.profiles?.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">{subscription.profiles?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPlanBadge(subscription.plan_type)}
                          {getSubscriptionStatusBadge(subscription.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Monthly Fee:</span>
                          <div className="mt-1 font-medium">
                            ${subscription.monthly_fee_usd}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <div className="mt-1">
                            {new Date(subscription.started_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Auto Renew:</span>
                          <div className="mt-1">
                            {subscription.auto_renew ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {subscription.expires_at && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-500">Expires:</span>
                          <div className="mt-1">
                            {new Date(subscription.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubscriptions; 