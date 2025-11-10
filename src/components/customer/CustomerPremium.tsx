import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Truck, Headphones, Gift, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CustomerPremium = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (userId) {
      checkPremiumStatus();
      fetchCurrentPlan();
    }
  }, [userId]);

  const checkPremiumStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('points_config')
        .select('customer_premium_enabled')
        .single();
      
      if (error) {
        console.error('Error fetching premium status:', error);
        return;
      }
      
      setPremiumEnabled(data?.customer_premium_enabled || false);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setPremiumEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setCurrentPlan(data.plan_type);
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const handleUpgradeToPremium = async () => {
    if (!userId) return;
    
    if (!premiumEnabled) {
      toast({
        title: "Premium Plans Coming Soon",
        description: "Premium plans will be available soon. You'll be notified when they become available!",
        variant: "default"
      });
      return;
    }

    setUpgrading(true);
    // Show PesaPal payment modal for premium subscription
    // TODO: Integrate with PesaPalPayment component for subscription upgrade
    toast({
      title: "Payment Integration",
      description: "PesaPal payment integration for subscriptions is being set up",
      variant: "default"
    });
    setUpgrading(false);
  };

  const premiumPlans = [
    {
      name: 'Free',
      price: 'Free',
      icon: <Star className="w-6 h-6 text-gray-400" />,
      features: [
        { text: 'Standard delivery (3-5 days)', icon: <Truck className="w-4 h-4" /> },
        { text: 'Email support', icon: <Headphones className="w-4 h-4" /> },
        { text: 'Regular deals and offers', icon: <Gift className="w-4 h-4" /> }
      ],
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-600'
    },
    {
      name: 'Premium',
      price: 'KES 299/month',
      icon: <Crown className="w-6 h-6 text-yellow-500" />,
      features: [
        { text: 'Free express delivery (1-2 days)', icon: <Truck className="w-4 h-4" /> },
        { text: 'Priority 24/7 support', icon: <Headphones className="w-4 h-4" /> },
        { text: 'Exclusive deals and early access', icon: <Gift className="w-4 h-4" /> },
        { text: 'Premium customer service', icon: <Clock className="w-4 h-4" /> }
      ],
      color: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200',
      textColor: 'text-yellow-700'
    }
  ];

  if (loading || !userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Premium Plans</h1>
        <p className="text-gray-600">Choose the plan that's right for you</p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Current Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                {currentPlan === 'premium' ? 'Premium Plan' : 'Free Plan'}
              </h3>
              <p className="text-gray-600">
                {currentPlan === 'premium' 
                  ? 'You have access to all premium benefits!' 
                  : 'You are currently on the free plan.'
                }
              </p>
            </div>
            <Badge variant={currentPlan === 'premium' ? 'default' : 'secondary'}>
              {currentPlan === 'premium' ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Premium Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {premiumPlans.map((plan) => (
          <Card key={plan.name} className={`${plan.color} ${
            !premiumEnabled && plan.name === 'Premium' ? 'border-dashed' : 'border-solid'
          }`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {plan.icon}
              </div>
              <CardTitle className={plan.textColor}>{plan.name}</CardTitle>
              <div className={`text-2xl font-bold ${plan.textColor}`}>
                {plan.price}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="text-green-500 mt-0.5">
                      {feature.icon}
                    </div>
                    <span className="text-sm text-gray-600">{feature.text}</span>
                  </li>
                ))}
              </ul>
              
              {plan.name === 'Premium' && (
                <Button
                  onClick={handleUpgradeToPremium}
                  disabled={!premiumEnabled || upgrading || currentPlan === 'premium'}
                  className={`w-full ${
                    !premiumEnabled 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                  }`}
                >
                  {upgrading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Upgrading...
                    </>
                  ) : currentPlan === 'premium' ? (
                    'Current Plan'
                  ) : !premiumEnabled ? (
                    'Coming Soon'
                  ) : (
                    'Upgrade to Premium'
                  )}
                </Button>
              )}
              
              {plan.name === 'Premium' && !premiumEnabled && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 text-center">
                    🌟 <strong>Coming Soon!</strong> Premium plans will be available soon. You'll be notified when they launch!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Premium Benefits Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Plan Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Delivery</h4>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Free: 3-5 days</div>
                <div className="text-sm font-medium text-green-600">Premium: 1-2 days</div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Support</h4>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Free: Email only</div>
                <div className="text-sm font-medium text-green-600">Premium: 24/7 Priority</div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Deals</h4>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Free: Regular offers</div>
                <div className="text-sm font-medium text-green-600">Premium: Exclusive deals</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPremium;
