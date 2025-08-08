import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gift, History, Star, Share2, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserWalletProps {
  userId: string;
}

interface PointsData {
  total_points: number;
  available_points: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  points: number;
  reason: string;
  created_at: string;
  expires_at?: string;
}

interface PointsConfig {
  point_value_kes: number;
}

export default function UserWallet({ userId }: UserWalletProps) {
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pointsConfig, setPointsConfig] = useState<PointsConfig | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWalletData();
    generateReferralCode();
  }, [userId]);

  const loadWalletData = async () => {
    try {
      // Load points balance
      const { data: points } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (points) {
        setPointsData(points);
      }

      // Load recent transactions
      const { data: transactionData } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionData) {
        setTransactions(transactionData);
      }

      // Load points configuration
      const { data: config } = await supabase
        .from('points_config')
        .select('point_value_kes')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (config) {
        setPointsConfig(config);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = () => {
    const code = `ISA${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setReferralCode(code);
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shop?ref=${referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Referral link copied!",
        description: "Share with friends to earn 200 points per signup"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually"
      });
    }
  };

  const getPointsValue = (points: number) => {
    if (!pointsConfig) return 0;
    return points * pointsConfig.point_value_kes;
  };

  if (loading) {
    return <div className="animate-pulse">Loading wallet...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Points Balance */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            ISA Points Wallet
          </CardTitle>
          <CardDescription>
            Earn points with every purchase and redeem for discounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {pointsData?.available_points || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Available Points (≈ KES {getPointsValue(pointsData?.available_points || 0)})
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{pointsData?.lifetime_earned || 0}</div>
              <div className="text-xs text-muted-foreground">Total Earned</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{pointsData?.lifetime_redeemed || 0}</div>
              <div className="text-xs text-muted-foreground">Total Redeemed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earn Points Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ways to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Every KES 100 spent</span>
            <Badge variant="outline">10 points</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>First purchase</span>
            <Badge variant="outline">100 points</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Friend signs up via your link</span>
            <Badge variant="outline">200 points</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Friend makes first purchase</span>
            <Badge variant="outline">200 points</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Complete style quiz</span>
            <Badge variant="outline">20 points</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Refer Friends
          </CardTitle>
          <CardDescription>
            Share your link and earn 400 points when friends sign up and make their first purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-mono break-all">{getReferralLink()}</div>
          </div>
          <Button onClick={copyReferralLink} className="w-full">
            Copy Referral Link
          </Button>
        </CardContent>
      </Card>

      {/* Redemption Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Redeem Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg text-center">
              <div className="font-semibold">100 points</div>
              <div className="text-sm text-muted-foreground">KES 10</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="font-semibold">500 points</div>
              <div className="text-sm text-muted-foreground">KES 50</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="font-semibold">1,000 points</div>
              <div className="text-sm text-muted-foreground">KES 100</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="font-semibold">5,000 points</div>
              <div className="text-sm text-muted-foreground">KES 500</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Points can be used as discount during checkout. Points expire after 12 months.
          </p>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No transactions yet. Start shopping to earn points!
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{transaction.reason}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.transaction_type === 'earned' 
                      ? 'text-green-600' 
                      : transaction.transaction_type === 'redeemed'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {transaction.transaction_type === 'earned' ? '+' : ''}
                    {transaction.points} points
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}