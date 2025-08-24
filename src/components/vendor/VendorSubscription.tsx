import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VendorSubscriptionPlan {
  id: string;
  name: string;
  plan_type: 'freemium' | 'premium_weekly' | 'premium_monthly' | 'premium_yearly' | 'pro';
  price_kes: number;
  billing_cycle: 'one-time' | 'weekly' | 'monthly' | 'yearly';
  features: string[];
  commission_savings: string;
  description: string;
}

const VendorSubscription = () => {
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'airtel' | 'card'>('mpesa');
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const subscriptionPlans: VendorSubscriptionPlan[] = [
    {
      id: 'freemium',
      name: 'Freemium Plan',
      plan_type: 'freemium',
      price_kes: 0,
      billing_cycle: 'one-time',
      features: [
        'Basic product listing',
        'Standard commission rates (8-12%)',
        'Email support',
        'Basic analytics',
        'Order management dashboard'
      ],
      commission_savings: 'Standard rates apply',
      description: 'Perfect for getting started with your online business'
    },
    {
      id: 'premium_weekly',
      name: 'Premium Weekly',
      plan_type: 'premium_weekly',
      price_kes: 199,
      billing_cycle: 'weekly',
      features: [
        'Unlimited product listings',
        'Reduced commission rates (2-5%)',
        'Priority support',
        'Advanced analytics & insights',
        'Featured product placement',
        'Boosted search placement',
        'Premium collections inclusion'
      ],
      commission_savings: 'Save up to 7% on commissions',
      description: 'Weekly premium access for maximum flexibility'
    },
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      plan_type: 'premium_monthly',
      price_kes: 699,
      billing_cycle: 'monthly',
      features: [
        'Unlimited product listings',
        'Reduced commission rates (2-5%)',
        'Priority support',
        'Advanced analytics & insights',
        'Featured product placement',
        'Boosted search placement',
        'Premium collections inclusion',
        'Direct customer messaging'
      ],
      commission_savings: 'Save up to 7% on commissions',
      description: 'Most popular plan for established vendors'
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      plan_type: 'premium_yearly',
      price_kes: 8999,
      billing_cycle: 'yearly',
      features: [
        'Unlimited product listings',
        'Reduced commission rates (2-5%)',
        'Priority support',
        'Advanced analytics & insights',
        'Featured product placement',
        'Boosted search placement',
        'Premium collections inclusion',
        'Direct customer messaging',
        'Dedicated account manager',
        'Early access to new features'
      ],
      commission_savings: 'Save up to 7% on commissions + 2 months free',
      description: 'Best value for long-term growth'
    },
    {
      id: 'pro',
      name: 'Pro Executive',
      plan_type: 'pro',
      price_kes: 9999,
      billing_cycle: 'monthly',
      features: [
        'Everything in Premium Yearly',
        'Lowest commission rates (2-3%)',
        'White-label solutions',
        'API access',
        'Custom integrations',
        'Dedicated success manager',
        'Priority feature requests',
        'Exclusive events & networking'
      ],
      commission_savings: 'Save up to 9% on commissions',
      description: 'Enterprise-level features for large-scale operations'
    }
  ];

  useEffect(() => {
    if (authUser?.id) {
      loadCurrentSubscription();
    }
  }, [authUser?.id]);

  const loadCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('vendor_id', authUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
      } else {
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgradeDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    // Validate payment details
    if (paymentMethod === 'mpesa' || paymentMethod === 'airtel') {
      if (!paymentDetails.phoneNumber) {
        toast({ title: 'Missing Information', description: 'Please enter your phone number', variant: 'destructive' });
        return;
      }
    } else if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardholderName) {
        toast({ title: 'Missing Information', description: 'Please fill in all card details', variant: 'destructive' });
        return;
      }
    }

    setIsProcessing(true);

    try {
      // For now, we'll simulate payment processing
      // In a real implementation, you'd integrate with a payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000));

             // Create or update vendor subscription
       const subscriptionData = {
         vendor_id: authUser.id,
         plan_type: plan.plan_type,
         monthly_fee_usd: plan.price_kes / 100, // Convert to USD (approximate)
         status: 'active',
         started_at: new Date().toISOString(),
         auto_renew: plan.billing_cycle !== 'one-time'
       };

      const { error } = await supabase
        .from('vendor_subscriptions')
        .upsert(subscriptionData, { onConflict: 'vendor_id' });

      if (error) {
        throw error;
      }

      toast({
        title: 'Subscription Updated',
        description: `Successfully upgraded to ${plan.name}!`,
        variant: 'default'
      });

      setShowUpgradeDialog(false);
      loadCurrentSubscription();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentPlan = () => {
    if (!currentSubscription) {
      return subscriptionPlans.find(p => p.id === 'freemium');
    }
    return subscriptionPlans.find(p => p.plan_type === currentSubscription.plan_type) || subscriptionPlans.find(p => p.id === 'freemium');
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendor Subscription Plans</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
              Choose the perfect plan to maximize your earnings and unlock premium features
            </p>
          </div>
        </div>

        {/* Current Plan Status */}
        {currentPlan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Current Plan: {currentPlan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div>
                   <p className="text-sm text-gray-600">Commission Savings</p>
                   <p className="text-lg font-semibold text-green-600">{currentPlan.commission_savings}</p>
                 </div>
                                 <div>
                   <p className="text-sm text-gray-600">Billing Cycle</p>
                   <p className="text-lg font-semibold">
                     {currentPlan.price_kes === 0 ? 'Free' : `${currentPlan.billing_cycle.charAt(0).toUpperCase() + currentPlan.billing_cycle.slice(1)}`}
                   </p>
                 </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
                         const isUpgrade = plan.plan_type !== 'freemium' && currentPlan?.plan_type === 'freemium';
            
            return (
              <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                                         <CardTitle className="flex items-center gap-2">
                       {plan.plan_type !== 'freemium' ? (
                         <Crown className="w-5 h-5 text-yellow-500" />
                       ) : (
                         <Zap className="w-5 h-5 text-blue-500" />
                       )}
                       {plan.name}
                     </CardTitle>
                                         <div className="text-right">
                       <div className="text-2xl font-bold">
                         {plan.price_kes === 0 ? 'Free' : `Ksh ${plan.price_kes.toLocaleString()}`}
                       </div>
                       <div className="text-sm text-gray-600">
                         {plan.billing_cycle === 'one-time' ? 'one-time' : `per ${plan.billing_cycle}`}
                       </div>
                     </div>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </CardHeader>
                <CardContent>
                                     <div className="mb-6">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm text-gray-600">Commission Savings:</span>
                       <span className="font-semibold text-green-600">{plan.commission_savings}</span>
                     </div>
                     {isUpgrade && (
                       <div className="text-sm text-green-600 font-medium">
                         Upgrade to enjoy reduced commission rates and premium features!
                       </div>
                     )}
                   </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={`w-full ${
                      isCurrentPlan
                        ? 'bg-gray-500 cursor-not-allowed'
                        : isUpgrade
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={isCurrentPlan}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentPlan ? 'Current Plan' : isUpgrade ? 'Upgrade Now' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Upgrade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="airtel">Airtel Money</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'mpesa' || paymentMethod === 'airtel' ? (
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="e.g., +254700000000"
                    value={paymentDetails.phoneNumber}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label>Card Number</Label>
                    <Input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        value={paymentDetails.expiryDate}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        type="text"
                        placeholder="123"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cardholder Name</Label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={paymentDetails.cardholderName}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Processing...' : 'Complete Payment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorSubscription;
