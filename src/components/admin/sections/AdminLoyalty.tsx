import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Settings, 
  Save, 
  TrendingUp, 
  Users, 
  Star,
  ShoppingCart,
  Gift,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLoyalty = () => {
  const [pointsConfig, setPointsConfig] = useState<any>(null);
  const [commissionRates, setCommissionRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redemptionEnabled, setRedemptionEnabled] = useState(false);
  const [vendorSubscriptionEnabled, setVendorSubscriptionEnabled] = useState(false);
  const [customerPremiumEnabled, setCustomerPremiumEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      // Load points configuration
      const { data: configData, error: configError } = await supabase
        .from('points_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

              if (!configError && configData) {
         setPointsConfig(configData);
         // Use the new fields from the database
         setRedemptionEnabled(configData.redemption_enabled || false);
         setVendorSubscriptionEnabled(configData.vendor_subscription_enabled || false);
         setCustomerPremiumEnabled(configData.customer_premium_enabled || false);
       }

      // Load commission rates with enhanced structure
      const { data: commissionData, error: commissionError } = await supabase
        .from('vendor_commissions')
        .select('*')
        .order('main_category', { ascending: true })
        .order('subcategory', { ascending: true })
        .order('sub_subcategory', { ascending: true });

      if (!commissionError && commissionData) {
        setCommissionRates(commissionData);
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePointsConfigUpdate = async () => {
    if (!pointsConfig) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('points_config')
        .insert({
          point_value_kes: parseFloat(pointsConfig.point_value_kes),
          spending_points_per_100_kes: parseInt(pointsConfig.spending_points_per_100_kes),
          first_purchase_points: parseInt(pointsConfig.first_purchase_points),
          referral_signup_points: parseInt(pointsConfig.referral_signup_points),
          referral_purchase_points: parseInt(pointsConfig.referral_purchase_points),
          quiz_completion_points: parseInt(pointsConfig.quiz_completion_points),
          points_expiry_months: parseInt(pointsConfig.points_expiry_months)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Points configuration updated successfully!"
      });

      await loadLoyaltyData();
    } catch (error) {
      console.error('Error updating points config:', error);
      toast({
        title: "Error",
        description: "Failed to update points configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRedemptionToggle = async () => {
    setSaving(true);
    try {
      const newStatus = !redemptionEnabled;
      
      // Update the redemption status in the database
      const { error } = await supabase
        .from('points_config')
        .insert({
          redemption_enabled: newStatus,
          point_value_kes: pointsConfig?.point_value_kes || 0.1,
          spending_points_per_100_kes: pointsConfig?.spending_points_per_100_kes || 10,
          first_purchase_points: pointsConfig?.first_purchase_points || 100,
          referral_signup_points: pointsConfig?.referral_signup_points || 200,
          referral_purchase_points: pointsConfig?.referral_purchase_points || 200,
          quiz_completion_points: pointsConfig?.quiz_completion_points || 20,
          points_expiry_months: pointsConfig?.points_expiry_months || 12
        });

      if (error) throw error;

      setRedemptionEnabled(newStatus);

      if (newStatus) {
        // Notify all users that redemption is now available
        const { data: users, error: usersError } = await supabase
          .from('user_points')
          .select('user_id')
          .gt('available_points', 0);

        if (!usersError && users) {
          // Import NotificationService dynamically to avoid circular dependency
          const { NotificationService } = await import('@/services/notificationService');
          
          for (const user of users) {
            try {
              await NotificationService.notifyRedemptionAvailable(user.user_id);
            } catch (notificationError) {
              console.error('Error notifying user:', notificationError);
            }
          }
        }

        toast({
          title: "Redemption Enabled!",
          description: `Points redemption is now available for all users. ${users?.length || 0} users have been notified.`
        });
      } else {
        toast({
          title: "Redemption Disabled",
          description: "Points redemption has been disabled."
        });
      }
    } catch (error) {
      console.error('Error toggling redemption:', error);
      toast({
        title: "Error",
        description: "Failed to toggle redemption status",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVendorSubscriptionToggle = async () => {
    setSaving(true);
    try {
      const newStatus = !vendorSubscriptionEnabled;
      
      // Update the vendor subscription status in the database
      const { error } = await supabase
        .from('points_config')
        .insert({
          vendor_subscription_enabled: newStatus,
          point_value_kes: pointsConfig?.point_value_kes || 0.1,
          spending_points_per_100_kes: pointsConfig?.spending_points_per_100_kes || 10,
          first_purchase_points: pointsConfig?.first_purchase_points || 100,
          referral_signup_points: pointsConfig?.referral_signup_points || 200,
          referral_purchase_points: pointsConfig?.referral_purchase_points || 200,
          quiz_completion_points: pointsConfig?.quiz_completion_points || 20,
          points_expiry_months: pointsConfig?.points_expiry_months || 12
        });

      if (error) throw error;

      setVendorSubscriptionEnabled(newStatus);

      if (newStatus) {
        // Notify all vendors that subscription is now available
        const { data: vendors, error: vendorsError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_type', 'vendor')
          .eq('status', 'approved');

        if (!vendorsError && vendors) {
          // Import NotificationService dynamically to avoid circular dependency
          const { NotificationService } = await import('@/services/notificationService');
          
          for (const vendor of vendors) {
            try {
              await NotificationService.notifyVendorSubscriptionAvailable(vendor.id);
            } catch (notificationError) {
              console.error('Error notifying vendor:', notificationError);
            }
          }
        }

        toast({
          title: "Vendor Subscriptions Enabled!",
          description: `Vendor subscriptions are now available. ${vendors?.length || 0} vendors have been notified.`
        });
      } else {
        toast({
          title: "Vendor Subscriptions Disabled",
          description: "Vendor subscriptions have been disabled."
        });
      }
    } catch (error) {
      console.error('Error toggling vendor subscription:', error);
      toast({
        title: "Error",
        description: "Failed to toggle vendor subscription status",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

     const handleCommissionUpdate = async (commissionId: string, field: string, value: number) => {
     try {
       const { error } = await supabase
         .from('vendor_commissions')
         .update({ [field]: value })
         .eq('id', commissionId);

       if (error) throw error;

       toast({
         title: "Success",
         description: `Commission rate updated successfully`
       });

       await loadLoyaltyData();
     } catch (error) {
       console.error('Error updating commission:', error);
       toast({
         title: "Error",
         description: "Failed to update commission rate",
         variant: "destructive"
       });
     }
      };

   const handleCustomerPremiumToggle = async () => {
     setSaving(true);
     try {
       const newStatus = !customerPremiumEnabled;
       
        // Update the customer premium status in the database
        const { error } = await supabase
          .from('points_config')
          .insert({
            customer_premium_enabled: newStatus,
            point_value_kes: pointsConfig?.point_value_kes || 0.1,
            spending_points_per_100_kes: pointsConfig?.spending_points_per_100_kes || 10,
            first_purchase_points: pointsConfig?.first_purchase_points || 100,
            referral_signup_points: pointsConfig?.referral_signup_points || 200,
            referral_purchase_points: pointsConfig?.referral_purchase_points || 200,
            quiz_completion_points: pointsConfig?.quiz_completion_points || 20,
            points_expiry_months: pointsConfig?.points_expiry_months || 12
          });

       if (error) throw error;

       setCustomerPremiumEnabled(newStatus);

       if (newStatus) {
         // Notify all customers that premium plans are now available
         const { data: customers, error: customersError } = await supabase
           .from('profiles')
           .select('id')
           .eq('user_type', 'customer')
           .eq('status', 'approved');

         if (!customersError && customers) {
           // Import NotificationService dynamically to avoid circular dependency
           const { NotificationService } = await import('@/services/notificationService');
           
           for (const customer of customers) {
             try {
               await NotificationService.notifyCustomerPremiumAvailable(customer.id);
             } catch (notificationError) {
               console.error('Error notifying customer:', notificationError);
             }
           }
         }

         toast({
           title: "Customer Premium Plans Enabled!",
           description: `Customer premium plans are now available. ${customers?.length || 0} customers have been notified.`
         });
       } else {
         toast({
           title: "Customer Premium Plans Disabled",
           description: "Customer premium plans have been disabled."
         });
       }
     } catch (error) {
       console.error('Error toggling customer premium:', error);
       toast({
         title: "Error",
         description: "Failed to toggle customer premium status",
         variant: "destructive"
       });
     } finally {
       setSaving(false);
     }
   };

   const handleConfigChange = (field: string, value: string) => {
    setPointsConfig((prev: any) => ({
      ...prev,
      [field]: value
    }));
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
        <h1 className="text-3xl font-bold text-gray-900">Loyalty Program Management</h1>
        <p className="text-gray-600 mt-2">Manage MyPlug Points configuration and vendor commission rates</p>
      </div>

      <Tabs defaultValue="points" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
           <TabsTrigger value="points" className="flex items-center space-x-2">
             <Wallet className="w-4 h-4" />
             <span>Points Configuration</span>
           </TabsTrigger>
           <TabsTrigger value="commissions" className="flex items-center space-x-2">
             <DollarSign className="w-4 h-4" />
             <span>Commission Rates</span>
           </TabsTrigger>
           <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
             <Crown className="w-4 h-4" />
             <span>Vendor Subscriptions</span>
           </TabsTrigger>
           <TabsTrigger value="customer-premium" className="flex items-center space-x-2">
             <Star className="w-4 h-4" />
             <span>Customer Premium</span>
           </TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Points Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="pointValue">Point Value (KES)</Label>
                  <Input
                    id="pointValue"
                    type="number"
                    step="0.01"
                    value={pointsConfig?.point_value_kes || 0.1}
                    onChange={(e) => handleConfigChange('point_value_kes', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">Value of 1 point in KES</p>
                </div>

                <div>
                  <Label htmlFor="expiryMonths">Points Expiry (Months)</Label>
                  <Input
                    id="expiryMonths"
                    type="number"
                    value={pointsConfig?.points_expiry_months || 12}
                    onChange={(e) => handleConfigChange('points_expiry_months', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">How long points remain valid</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Points Earning Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="spendingPoints">Points per KES 100 Spent</Label>
                    <Input
                      id="spendingPoints"
                      type="number"
                      value={pointsConfig?.spending_points_per_100_kes || 10}
                      onChange={(e) => handleConfigChange('spending_points_per_100_kes', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="firstPurchase">First Purchase Bonus</Label>
                    <Input
                      id="firstPurchase"
                      type="number"
                      value={pointsConfig?.first_purchase_points || 100}
                      onChange={(e) => handleConfigChange('first_purchase_points', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="referralSignup">Referral Signup Bonus</Label>
                    <Input
                      id="referralSignup"
                      type="number"
                      value={pointsConfig?.referral_signup_points || 200}
                      onChange={(e) => handleConfigChange('referral_signup_points', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="referralPurchase">Referral Purchase Bonus</Label>
                    <Input
                      id="referralPurchase"
                      type="number"
                      value={pointsConfig?.referral_purchase_points || 200}
                      onChange={(e) => handleConfigChange('referral_purchase_points', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quizCompletion">Style Quiz Completion</Label>
                    <Input
                      id="quizCompletion"
                      type="number"
                      value={pointsConfig?.quiz_completion_points || 20}
                      onChange={(e) => handleConfigChange('quiz_completion_points', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handlePointsConfigUpdate}
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Points Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Redemption Toggle Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <span>Points Redemption Control</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-blue-800">Enable Points Redemption</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    {redemptionEnabled 
                      ? "Points redemption is currently enabled for all users." 
                      : "Points redemption is currently disabled. Users can earn points but cannot redeem them yet."
                    }
                  </p>
                </div>
                <Button
                  onClick={handleRedemptionToggle}
                  disabled={saving}
                  variant={redemptionEnabled ? "default" : "outline"}
                  className={`flex items-center space-x-2 ${
                    redemptionEnabled 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "border-orange-300 text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : redemptionEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Enabled</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Enable Redemption</span>
                    </>
                  )}
                </Button>
              </div>
              
              {!redemptionEnabled && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm text-orange-800">
                    💡 <strong>Coming Soon Mode:</strong> Users are currently earning points and will be notified when redemption becomes available.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Current Points System</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {pointsConfig?.spending_points_per_100_kes || 10}
                  </div>
                  <div className="text-sm text-green-700">Points per KES 100</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {pointsConfig?.first_purchase_points || 100}
                  </div>
                  <div className="text-sm text-blue-700">First Purchase Bonus</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {pointsConfig?.referral_signup_points || 200}
                  </div>
                  <div className="text-sm text-purple-700">Referral Bonus</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {pointsConfig?.quiz_completion_points || 20}
                  </div>
                  <div className="text-sm text-orange-700">Quiz Completion</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

                 <TabsContent value="commissions" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <DollarSign className="w-5 h-5" />
                 <span>Vendor Commission Rates</span>
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-6">
                 {/* Group by main category */}
                 {Array.from(new Set(commissionRates.map(rate => rate.main_category))).map(mainCategory => (
                   <div key={mainCategory} className="border rounded-lg p-6">
                     <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">{mainCategory}</h3>
                     <div className="space-y-4">
                       {commissionRates
                         .filter(rate => rate.main_category === mainCategory)
                         .map((rate) => (
                           <div key={rate.id} className="border-l-4 border-orange-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                             <div className="flex items-center justify-between mb-3">
                               <div>
                                 <h4 className="font-semibold text-gray-800">
                                   {rate.subcategory || 'General'}
                                 </h4>
                                 {rate.sub_subcategory && (
                                   <p className="text-sm text-gray-600 mt-1">
                                     {rate.sub_subcategory}
                                   </p>
                                 )}
                               </div>
                               <Badge variant="outline" className="text-xs">
                                 {rate.category_path}
                               </Badge>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                 <Label htmlFor={`freemium-${rate.id}`}>Freemium Commission (%)</Label>
                                 <Input
                                   id={`freemium-${rate.id}`}
                                   type="number"
                                   step="0.1"
                                   value={rate.freemium_commission_rate}
                                   onChange={(e) => handleCommissionUpdate(rate.id, 'freemium_commission_rate', parseFloat(e.target.value))}
                                   className="mt-1"
                                 />
                               </div>
                               <div>
                                 <Label htmlFor={`premium-${rate.id}`}>Premium Commission (%)</Label>
                                 <Input
                                   id={`premium-${rate.id}`}
                                   type="number"
                                   step="0.1"
                                   value={rate.premium_commission_rate}
                                   onChange={(e) => handleCommissionUpdate(rate.id, 'premium_commission_rate', parseFloat(e.target.value))}
                                   className="mt-1"
                                 />
                               </div>
                             </div>
                           </div>
                         ))}
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>

                     {/* Commission Summary */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <TrendingUp className="w-5 h-5" />
                 <span>Commission Summary by Category</span>
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-6">
                 {Array.from(new Set(commissionRates.map(rate => rate.main_category))).map(mainCategory => (
                   <div key={mainCategory} className="border rounded-lg p-4">
                     <h4 className="font-semibold mb-3 text-gray-800 capitalize">{mainCategory}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <h5 className="font-medium mb-2 text-green-600">Freemium Rates</h5>
                         <div className="space-y-1">
                           {commissionRates
                             .filter(rate => rate.main_category === mainCategory)
                             .map((rate) => (
                               <div key={rate.id} className="flex justify-between text-sm">
                                 <span className="truncate">
                                   {rate.subcategory || 'General'}
                                   {rate.sub_subcategory && ` - ${rate.sub_subcategory}`}
                                 </span>
                                 <span className="font-semibold">{rate.freemium_commission_rate}%</span>
                               </div>
                             ))}
                         </div>
                       </div>
                       <div>
                         <h5 className="font-medium mb-2 text-blue-600">Premium Rates</h5>
                         <div className="space-y-1">
                           {commissionRates
                             .filter(rate => rate.main_category === mainCategory)
                             .map((rate) => (
                               <div key={rate.id} className="flex justify-between text-sm">
                                 <span className="truncate">
                                   {rate.subcategory || 'General'}
                                   {rate.sub_subcategory && ` - ${rate.sub_subcategory}`}
                                 </span>
                                 <span className="font-semibold">{rate.premium_commission_rate}%</span>
                               </div>
                             ))}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
                 </TabsContent>

         <TabsContent value="subscriptions" className="space-y-6">
           {/* Vendor Subscription Control */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <Crown className="w-5 h-5" />
                 <span>Vendor Subscription Control</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                 <div>
                   <h3 className="font-semibold text-purple-800">Enable Vendor Subscriptions</h3>
                   <p className="text-sm text-purple-600 mt-1">
                     {vendorSubscriptionEnabled 
                       ? "Vendor subscriptions are currently enabled. Vendors can upgrade to premium plans." 
                       : "Vendor subscriptions are currently disabled. Vendors can see plans but cannot subscribe yet."
                     }
                   </p>
                 </div>
                 <Button
                   onClick={handleVendorSubscriptionToggle}
                   disabled={saving}
                   variant={vendorSubscriptionEnabled ? "default" : "outline"}
                   className={`flex items-center space-x-2 ${
                     vendorSubscriptionEnabled 
                       ? "bg-purple-600 hover:bg-purple-700" 
                       : "border-purple-300 text-purple-600 hover:bg-purple-50"
                   }`}
                 >
                   {saving ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : vendorSubscriptionEnabled ? (
                     <>
                       <ToggleRight className="w-4 h-4" />
                       <span>Enabled</span>
                     </>
                   ) : (
                     <>
                       <ToggleLeft className="w-4 h-4" />
                       <span>Enable Subscriptions</span>
                     </>
                   )}
                 </Button>
               </div>
               
               {!vendorSubscriptionEnabled && (
                 <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                   <div className="text-sm text-purple-800">
                     💡 <strong>Coming Soon Mode:</strong> Vendors can currently see subscription plans and benefits, but cannot subscribe yet. They will be notified when subscriptions become available.
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>

           {/* Subscription Plans Preview */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <Crown className="w-5 h-5" />
                 <span>Subscription Plans {!vendorSubscriptionEnabled && '(Coming Soon)'}</span>
               </CardTitle>
             </CardHeader>
             <CardContent>
               {!vendorSubscriptionEnabled && (
                 <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                   <div className="text-sm text-purple-800 text-center">
                     🚀 <strong>Coming Soon!</strong> These subscription plans will be available when you enable vendor subscriptions.
                   </div>
                 </div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                   {
                     name: 'Freemium',
                     price: 'Free',
                     features: ['Basic listing', 'Standard commission', 'Email support'],
                     color: 'bg-gray-50 border-gray-200'
                   },
                   {
                     name: 'Premium',
                     price: 'KES 699/month',
                     features: ['Priority listing', 'Reduced commission', 'Priority support', 'Advanced analytics'],
                     color: 'bg-purple-50 border-purple-200'
                   },
                   {
                     name: 'Pro Executive',
                     price: 'KES 9999/month',
                     features: ['All Premium features', 'Dedicated account manager', 'Custom integrations', 'White-label options'],
                     color: 'bg-pink-50 border-pink-200'
                   }
                 ].map((plan) => (
                   <div key={plan.name} className={`p-4 rounded-lg border-2 ${plan.color} ${
                     !vendorSubscriptionEnabled ? 'border-dashed' : 'border-solid'
                   }`}>
                     <div className="text-center mb-4">
                       <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                       <div className="text-2xl font-bold text-purple-600 mt-2">{plan.price}</div>
                     </div>
                     <ul className="space-y-2">
                       {plan.features.map((feature, index) => (
                         <li key={index} className="flex items-center text-sm text-gray-600">
                           <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                           {feature}
                         </li>
                       ))}
                     </ul>
                     {!vendorSubscriptionEnabled && (
                       <div className="text-xs text-gray-500 mt-3 text-center">Coming Soon</div>
                     )}
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>

           {/* Commission Benefits */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <DollarSign className="w-5 h-5" />
                 <span>Commission Benefits {!vendorSubscriptionEnabled && '(Coming Soon)'}</span>
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h4 className="font-semibold mb-3 text-gray-600">Freemium Commission</h4>
                   <div className="space-y-2">
                     {commissionRates.map((rate) => (
                       <div key={rate.id} className="flex justify-between">
                         <span className="capitalize">{rate.category}</span>
                         <span className="font-semibold text-red-600">{rate.freemium_commission_rate}%</span>
                       </div>
                     ))}
                   </div>
                 </div>
                 <div>
                   <h4 className="font-semibold mb-3 text-purple-600">Premium Commission</h4>
                   <div className="space-y-2">
                     {commissionRates.map((rate) => (
                       <div key={rate.id} className="flex justify-between">
                         <span className="capitalize">{rate.category}</span>
                         <span className="font-semibold text-green-600">{rate.premium_commission_rate}%</span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
               {!vendorSubscriptionEnabled && (
                 <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                   <div className="text-sm text-purple-800">
                     💰 <strong>Commission Savings:</strong> Premium vendors enjoy significantly lower commission rates, helping them maximize profits!
                   </div>
                 </div>
               )}
                        </CardContent>
         </Card>
       </TabsContent>

       <TabsContent value="customer-premium" className="space-y-6">
         {/* Customer Premium Control */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center space-x-2">
               <Star className="w-5 h-5" />
               <span>Customer Premium Control</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
               <div>
                 <h3 className="font-semibold text-green-800">Enable Customer Premium Plans</h3>
                 <p className="text-sm text-green-600 mt-1">
                   {customerPremiumEnabled 
                     ? "Customer premium plans are currently enabled. Customers can upgrade to premium plans." 
                     : "Customer premium plans are currently disabled. Customers can see plans but cannot subscribe yet."
                   }
                 </p>
               </div>
               <Button
                 onClick={handleCustomerPremiumToggle}
                 disabled={saving}
                 variant={customerPremiumEnabled ? "default" : "outline"}
                 className={`flex items-center space-x-2 ${
                   customerPremiumEnabled 
                     ? "bg-green-600 hover:bg-green-700" 
                     : "border-green-300 text-green-600 hover:bg-green-50"
                 }`}
               >
                 {saving ? (
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 ) : customerPremiumEnabled ? (
                   <>
                     <ToggleRight className="w-4 h-4" />
                     <span>Enabled</span>
                   </>
                 ) : (
                   <>
                     <ToggleLeft className="w-4 h-4" />
                     <span>Enable Premium</span>
                   </>
                 )}
               </Button>
             </div>
             
             {!customerPremiumEnabled && (
               <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                 <div className="text-sm text-green-800">
                   💡 <strong>Coming Soon Mode:</strong> Customers can currently see premium plans and benefits, but cannot subscribe yet. They will be notified when premium plans become available.
                 </div>
               </div>
             )}
           </CardContent>
         </Card>

         {/* Customer Premium Plans Preview */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center space-x-2">
               <Star className="w-5 h-5" />
               <span>Premium Plans {!customerPremiumEnabled && '(Coming Soon)'}</span>
             </CardTitle>
           </CardHeader>
           <CardContent>
             {!customerPremiumEnabled && (
               <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                 <div className="text-sm text-green-800 text-center">
                   🌟 <strong>Coming Soon!</strong> These premium plans will be available when you enable customer premium plans.
                 </div>
               </div>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 {
                   name: 'Free',
                   price: 'Free',
                   features: ['Standard delivery', 'Basic support', 'Regular deals'],
                   color: 'bg-gray-50 border-gray-200'
                 },
                 {
                   name: 'Premium',
                   price: 'KES 299/month',
                   features: ['Free express delivery', 'Priority support', 'Exclusive deals', 'Early access to sales', 'Premium customer service'],
                   color: 'bg-green-50 border-green-200'
                 }
               ].map((plan) => (
                 <div key={plan.name} className={`p-4 rounded-lg border-2 ${plan.color} ${
                   !customerPremiumEnabled ? 'border-dashed' : 'border-solid'
                 }`}>
                   <div className="text-center mb-4">
                     <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                     <div className="text-2xl font-bold text-green-600 mt-2">{plan.price}</div>
                   </div>
                   <ul className="space-y-2">
                     {plan.features.map((feature, index) => (
                       <li key={index} className="flex items-center text-sm text-gray-600">
                         <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                         {feature}
                       </li>
                     ))}
                   </ul>
                   {!customerPremiumEnabled && (
                     <div className="text-xs text-gray-500 mt-3 text-center">Coming Soon</div>
                   )}
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>

         {/* Premium Benefits */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center space-x-2">
               <Star className="w-5 h-5" />
               <span>Premium Benefits {!customerPremiumEnabled && '(Coming Soon)'}</span>
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <h4 className="font-semibold mb-3 text-gray-600">Free Plan</h4>
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span>Delivery</span>
                     <span className="font-semibold text-gray-600">Standard (3-5 days)</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Support</span>
                     <span className="font-semibold text-gray-600">Email only</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Deals</span>
                     <span className="font-semibold text-gray-600">Regular offers</span>
                   </div>
                 </div>
               </div>
               <div>
                 <h4 className="font-semibold mb-3 text-green-600">Premium Plan</h4>
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span>Delivery</span>
                     <span className="font-semibold text-green-600">Express (1-2 days)</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Support</span>
                     <span className="font-semibold text-green-600">Priority 24/7</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Deals</span>
                     <span className="font-semibold text-green-600">Exclusive offers</span>
                   </div>
                 </div>
               </div>
             </div>
             {!customerPremiumEnabled && (
               <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                 <div className="text-sm text-green-800">
                   ⭐ <strong>Premium Benefits:</strong> Premium customers enjoy faster delivery, priority support, and exclusive deals for an enhanced shopping experience!
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
       </TabsContent>
     </Tabs>
   </div>
 );
};

export default AdminLoyalty;