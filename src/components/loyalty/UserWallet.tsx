import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  Gift, 
  TrendingUp, 
  History, 
  Share2, 
  Copy, 
  Check,
  Star,
  Users,
  ShoppingCart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserWalletProps {
  user: any;
}

const UserWallet = ({ user }: UserWalletProps) => {
  const [userPoints, setUserPoints] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pointsConfig, setPointsConfig] = useState<any>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redemptionEnabled, setRedemptionEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        console.error('Error loading points:', pointsError);
      } else if (pointsData) {
        setUserPoints(pointsData);
      } else {
        // Initialize user points if not exists
        const { data: newPoints } = await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            total_points: 0,
            available_points: 0,
            lifetime_earned: 0,
            lifetime_redeemed: 0
          })
          .select()
          .single();
        
        if (newPoints) {
          setUserPoints(newPoints);
        }
      }

      // Load transactions (excluding deprecated daily login bonuses)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .not('reason', 'ilike', '%daily login%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!transactionsError && transactionsData) {
        setTransactions(transactionsData);
      }

      // Load points configuration
      const { data: configData, error: configError } = await supabase
        .from('points_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!configError && configData) {
        setPointsConfig(configData);
        setRedemptionEnabled(configData.redemption_enabled || false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number of points to redeem.",
        variant: "destructive"
      });
      return;
    }

    if (!userPoints || points > userPoints.available_points) {
      toast({
        title: "Insufficient points",
        description: "You don't have enough points to redeem.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('redeem_points', {
        user_id_param: user.id,
        points_to_redeem: points
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Points redeemed successfully!",
          description: `${points} points have been redeemed. Value: KES ${(points * (pointsConfig?.point_value_kes || 0.1)).toFixed(2)}`
        });
        setShowRedeemDialog(false);
        setRedeemAmount("");
        loadUserData(); // Refresh data
      } else {
        toast({
          title: "Redemption failed",
          description: "Unable to redeem points. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast({
        title: "Error",
        description: "Failed to redeem points. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${user.id}`;
  };

  const copyReferralLink = async () => {
    const link = generateReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Your referral link has been copied to clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'redeemed':
        return <Gift className="w-4 h-4 text-orange-600" />;
      case 'expired':
        return <History className="w-4 h-4 text-red-600" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'redeemed':
        return 'text-orange-600';
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
      {/* Points Overview */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Wallet className="w-6 h-6" />
            <span>ISA Points Wallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-orange-600">
                {userPoints?.available_points || 0}
              </div>
              <div className="text-sm text-gray-600">Available Points</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {userPoints?.lifetime_earned || 0}
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                KES {((userPoints?.available_points || 0) * (pointsConfig?.point_value_kes || 0.1)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Current Value</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setShowRedeemDialog(true)}
              disabled={!userPoints?.available_points || userPoints.available_points <= 0}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Gift className="w-4 h-4 mr-2" />
              {redemptionEnabled ? 'Redeem Points' : 'Redeem Points (Coming Soon!)'}
            </Button>
            <Button 
              variant="outline" 
              onClick={copyReferralLink}
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Referral Link
                </>
              )}
            </Button>
          </div>
          
          {/* Coming Soon Notice */}
          {!redemptionEnabled && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <div className="font-semibold text-blue-800">Points Redemption Coming Soon!</div>
                  <div className="text-sm text-blue-600">
                    Keep earning points now and you'll be able to redeem them for purchases very soon. 
                    Your points are safe and will be ready when redemption launches!
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>How to Earn Points</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium">Shopping</div>
                <div className="text-sm text-gray-600">
                  {pointsConfig?.spending_points_per_100_kes || 10} points per KES 100 spent
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Refer Friends</div>
                <div className="text-sm text-gray-600">
                  {pointsConfig?.referral_signup_points || 200} points per signup
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium">Style Quiz</div>
                <div className="text-sm text-gray-600">
                  {pointsConfig?.quiz_completion_points || 20} points for completion
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Gift className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium">First Purchase</div>
                <div className="text-sm text-gray-600">
                  {pointsConfig?.first_purchase_points || 100} bonus points
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redemption Values */}
      <Card>
        <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
          <Gift className="w-5 h-5 text-orange-600" />
          <span>Redemption Values {!redemptionEnabled && '(Coming Soon)'}</span>
        </CardTitle>
        </CardHeader>
        <CardContent>
          {!redemptionEnabled && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800 text-center">
                🎉 <strong>Coming Soon!</strong> These will be the redemption values when we launch.
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { points: 100, value: 10 },
              { points: 500, value: 50 },
              { points: 1000, value: 100 },
              { points: 5000, value: 500 }
            ].map((tier) => (
              <div key={tier.points} className={`text-center p-4 rounded-lg ${
                redemptionEnabled 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-gray-50 border-2 border-dashed border-gray-300'
              }`}>
                <div className="text-2xl font-bold text-orange-600">{tier.points}</div>
                <div className="text-sm text-gray-600">points</div>
                <div className="text-lg font-semibold text-green-600">KES {tier.value}</div>
                {!redemptionEnabled && (
                  <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet. Start shopping to earn points!
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <div className="font-medium">{transaction.reason}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                    {transaction.transaction_type === 'earned' ? '+' : ''}{transaction.points} points
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemption Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-orange-600" />
              <span>{redemptionEnabled ? 'Redeem Points' : 'Points Redemption Coming Soon!'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {redemptionEnabled ? (
              // Actual redemption form
              <>
                <div>
                  <Label htmlFor="redeemAmount">Number of Points to Redeem</Label>
                  <Input
                    id="redeemAmount"
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="Enter points to redeem"
                    min="100"
                    max={userPoints?.available_points || 0}
                  />
                </div>
                {redeemAmount && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      Value: KES {(parseInt(redeemAmount) * (pointsConfig?.point_value_kes || 0.1)).toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleRedeemPoints}
                    disabled={!redeemAmount || parseInt(redeemAmount) <= 0 || parseInt(redeemAmount) > (userPoints?.available_points || 0)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    Redeem Points
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRedeemDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              // Coming soon content
              <>
                {/* Coming Soon Illustration */}
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Get Ready to Redeem!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We're working hard to bring you the best redemption experience. 
                    Your points are safe and growing!
                  </p>
                </div>

                          {/* Current Points Status */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {userPoints?.available_points || 0} Points
                  </div>
                  <div className="text-sm text-green-700">
                    Ready to redeem when we launch!
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Current value: KES {((userPoints?.available_points || 0) * (pointsConfig?.point_value_kes || 0.1)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* What's Coming */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">What you'll be able to do:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Redeem points for discounts on purchases</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Get exclusive member-only deals</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Convert points to store credit</span>
                  </div>
                </div>
              </div>

              {/* Keep Earning Notice */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm text-orange-800">
                  💡 <strong>Pro tip:</strong> Keep earning points now so you'll have more to redeem when we launch!
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowRedeemDialog(false)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Got it!
                </Button>
              </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserWallet;