import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Gift, DollarSign, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PointsConfig {
  id: string;
  point_value_kes: number;
  spending_points_per_100_kes: number;
  first_purchase_points: number;
  referral_signup_points: number;
  referral_purchase_points: number;
  quiz_completion_points: number;
  points_expiry_months: number;
}

interface CommissionRate {
  id: string;
  category: string;
  freemium_commission_rate: number;
  premium_commission_rate: number;
}

export default function AdminLoyalty() {
  const [pointsConfig, setPointsConfig] = useState<PointsConfig | null>(null);
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load points configuration
      const { data: configData } = await supabase
        .from('points_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (configData) {
        setPointsConfig(configData);
      }

      // Load commission rates
      const { data: ratesData } = await supabase
        .from('vendor_commissions')
        .select('*')
        .order('category');

      if (ratesData) {
        setCommissionRates(ratesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load loyalty settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePointsConfig = async () => {
    if (!pointsConfig) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('points_config')
        .update({
          point_value_kes: pointsConfig.point_value_kes,
          spending_points_per_100_kes: pointsConfig.spending_points_per_100_kes,
          first_purchase_points: pointsConfig.first_purchase_points,
          referral_signup_points: pointsConfig.referral_signup_points,
          referral_purchase_points: pointsConfig.referral_purchase_points,
          quiz_completion_points: pointsConfig.quiz_completion_points,
          points_expiry_months: pointsConfig.points_expiry_months
        })
        .eq('id', pointsConfig.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Points configuration updated successfully"
      });
    } catch (error) {
      console.error('Error saving points config:', error);
      toast({
        title: "Error",
        description: "Failed to save points configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveCommissionRate = async (rateId: string, field: 'freemium_commission_rate' | 'premium_commission_rate', value: number) => {
    try {
      const { error } = await supabase
        .from('vendor_commissions')
        .update({ [field]: value })
        .eq('id', rateId);

      if (error) throw error;

      setCommissionRates(prev => 
        prev.map(rate => 
          rate.id === rateId ? { ...rate, [field]: value } : rate
        )
      );

      toast({
        title: "Rate updated",
        description: "Commission rate updated successfully"
      });
    } catch (error) {
      console.error('Error saving commission rate:', error);
      toast({
        title: "Error",
        description: "Failed to update commission rate",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading loyalty settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Gift className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Loyalty & Rewards Management</h1>
      </div>

      <Tabs defaultValue="points" className="space-y-6">
        <TabsList>
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Points System
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Commission Rates
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Points Configuration
              </CardTitle>
              <CardDescription>
                Configure how users earn and redeem ISA points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pointsConfig && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pointValue">Point Value (KES)</Label>
                      <Input
                        id="pointValue"
                        type="number"
                        step="0.01"
                        value={pointsConfig.point_value_kes}
                        onChange={(e) => setPointsConfig({
                          ...pointsConfig,
                          point_value_kes: parseFloat(e.target.value) || 0
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        How much 1 point is worth in KES
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spendingPoints">Points per KES 100 spent</Label>
                      <Input
                        id="spendingPoints"
                        type="number"
                        value={pointsConfig.spending_points_per_100_kes}
                        onChange={(e) => setPointsConfig({
                          ...pointsConfig,
                          spending_points_per_100_kes: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstPurchase">First Purchase Bonus</Label>
                      <Input
                        id="firstPurchase"
                        type="number"
                        value={pointsConfig.first_purchase_points}
                        onChange={(e) => setPointsConfig({
                          ...pointsConfig,
                          first_purchase_points: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referralSignup">Referral Signup Points</Label>
                      <Input
                        id="referralSignup"
                        type="number"
                        value={pointsConfig.referral_signup_points}
                        onChange={(e) => setPointsConfig({
                          ...pointsConfig,
                          referral_signup_points: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referralPurchase">Referral Purchase Points</Label>
                      <Input
                        id="referralPurchase"
                        type="number"
                        value={pointsConfig.referral_purchase_points}
                        onChange={(e) => setPointsConfig({
                          ...pointsConfig,
                          referral_purchase_points: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quizCompletion">Quiz Completion Points</Label>
                      <Input
                        id="quizCompletion"
                        type="number"
                        value={pointsConfig.quiz_completion_points}
                        onChange={(e) => setPointsConfig({
                          ...pointsConfig,
                          quiz_completion_points: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry">Points Expiry (months)</Label>
                      <Input
                        id="expiry"
                        type="number"
                        value={pointsConfig.points_expiry_months}
                        onChange={(e) => setPointsConfig({
                          ...pointsConfig,
                          points_expiry_months: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Preview: Redemption Values</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[100, 500, 1000, 5000].map(points => (
                        <div key={points} className="p-3 border rounded-lg text-center">
                          <div className="font-semibold">{points} points</div>
                          <div className="text-sm text-muted-foreground">
                            ≈ KES {(points * pointsConfig.point_value_kes).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={savePointsConfig} disabled={saving}>
                    {saving ? "Saving..." : "Save Configuration"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Commission Rates</CardTitle>
              <CardDescription>
                Set commission rates by category for freemium and premium vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissionRates.map((rate) => (
                  <div key={rate.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                    <div>
                      <Badge variant="outline" className="capitalize">
                        {rate.category}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Freemium Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={rate.freemium_commission_rate}
                        onChange={(e) => saveCommissionRate(
                          rate.id, 
                          'freemium_commission_rate', 
                          parseFloat(e.target.value) || 0
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Premium Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={rate.premium_commission_rate}
                        onChange={(e) => saveCommissionRate(
                          rate.id, 
                          'premium_commission_rate', 
                          parseFloat(e.target.value) || 0
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points Issued</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">125,000</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,200</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,847</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Quiz completions increased</p>
                    <p className="text-sm text-muted-foreground">+25 completions today</p>
                  </div>
                  <Badge variant="outline">+25</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Referral signups</p>
                    <p className="text-sm text-muted-foreground">8 new referrals</p>
                  </div>
                  <Badge variant="outline">+8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Points redemptions</p>
                    <p className="text-sm text-muted-foreground">152 redemptions today</p>
                  </div>
                  <Badge variant="outline">+152</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}