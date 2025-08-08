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
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLoyalty = () => {
  const [pointsConfig, setPointsConfig] = useState<any>(null);
  const [commissionRates, setCommissionRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      }

      // Load commission rates
      const { data: commissionData, error: commissionError } = await supabase
        .from('vendor_commissions')
        .select('*')
        .order('category', { ascending: true });

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

  const handleCommissionUpdate = async (category: string, field: string, value: number) => {
    try {
      const { error } = await supabase
        .from('vendor_commissions')
        .update({ [field]: value })
        .eq('category', category);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Commission rate updated for ${category}`
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
        <p className="text-gray-600 mt-2">Manage ISA Points configuration and vendor commission rates</p>
      </div>

      <Tabs defaultValue="points" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="points" className="flex items-center space-x-2">
            <Wallet className="w-4 h-4" />
            <span>Points Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Commission Rates</span>
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
              <div className="space-y-4">
                {commissionRates.map((rate) => (
                  <div key={rate.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold capitalize">{rate.category}</h3>
                      <Badge variant="outline">{rate.category}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`freemium-${rate.category}`}>Freemium Commission (%)</Label>
                        <Input
                          id={`freemium-${rate.category}`}
                          type="number"
                          step="0.1"
                          value={rate.freemium_commission_rate}
                          onChange={(e) => handleCommissionUpdate(rate.category, 'freemium_commission_rate', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`premium-${rate.category}`}>Premium Commission (%)</Label>
                        <Input
                          id={`premium-${rate.category}`}
                          type="number"
                          step="0.1"
                          value={rate.premium_commission_rate}
                          onChange={(e) => handleCommissionUpdate(rate.category, 'premium_commission_rate', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
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
                <span>Commission Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">Freemium Rates</h4>
                  <div className="space-y-2">
                    {commissionRates.map((rate) => (
                      <div key={rate.id} className="flex justify-between">
                        <span className="capitalize">{rate.category}</span>
                        <span className="font-semibold">{rate.freemium_commission_rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-blue-600">Premium Rates</h4>
                  <div className="space-y-2">
                    {commissionRates.map((rate) => (
                      <div key={rate.id} className="flex justify-between">
                        <span className="capitalize">{rate.category}</span>
                        <span className="font-semibold">{rate.premium_commission_rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLoyalty;