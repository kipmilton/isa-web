import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User, CreditCard, Settings as SettingsIcon, Phone, CreditCard as CreditCardIcon, Trash2, Edit2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VendorSettingsProps {
  vendorId: string;
  defaultTab?: string;
  showUpgradeModal?: boolean;
  onCloseUpgradeModal?: () => void;
}

const VendorSettings = ({ vendorId, defaultTab = 'account', showUpgradeModal = false, onCloseUpgradeModal }: VendorSettingsProps) => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    company: '',
    business_type: '',
    location: ''
  });
  const [payoutSettings, setPayoutSettings] = useState({
    mpesa_number: '',
    mpesa_name: '',
    airtel_number: '',
    bank_account: '',
    bank_name: ''
  });
  const [notifications, setNotifications] = useState({
    order_notifications: true,
    payment_notifications: true,
    review_notifications: true,
    marketing_emails: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    card_number: '',
    expiry: '',
    cvc: '',
    name: '',
    id: '' // for editing
  });
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [plan, setPlan] = useState('free');
  const [planExpiry, setPlanExpiry] = useState<string | null>(null);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  // Plan options with price
  const PLAN_OPTIONS = [
    { value: 'premium_weekly', label: 'Premium Weekly (199 KES)', price: 199 },
    { value: 'premium_monthly', label: 'Premium Monthly (699 KES)', price: 699 },
    { value: 'premium_yearly', label: 'Premium Yearly (8999 KES)', price: 8999 },
    { value: 'pro', label: 'Pro Executive (9999 KES)', price: 9999 },
  ];

  // Helper to determine plan order for downgrade restriction
  const PLAN_ORDER = ['free', 'premium_weekly', 'premium_monthly', 'premium_yearly', 'pro'];

  const isUpgrade = (from: string, to: string) => PLAN_ORDER.indexOf(to) > PLAN_ORDER.indexOf(from);
  const isDowngrade = (from: string, to: string) => PLAN_ORDER.indexOf(to) < PLAN_ORDER.indexOf(from);

  const isPlainObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj);

  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showUpgrade, setShowUpgrade] = useState(showUpgradeModal);
  useEffect(() => { setShowUpgrade(showUpgradeModal); }, [showUpgradeModal]);

  useEffect(() => {
    fetchProfile();
    fetchPayoutSettings();
    fetchPaymentMethods();
    fetchPlan();
    checkSubscriptionStatus();
  }, [vendorId]);

  const parsePreferences = (prefs: any) => {
    if (!prefs) return {};
    if (typeof prefs === 'string') {
      try {
        return JSON.parse(prefs);
      } catch {
        return {};
      }
    }
    return prefs;
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          company: data.company || '',
          business_type: data.business_type || '',
          location: data.location || ''
        });
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
    }
  };

  const fetchPayoutSettings = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', vendorId)
      .single();
    const preferences = parsePreferences(data?.preferences);
    if (isPlainObject(preferences) && isPlainObject(preferences.payout)) {
      setPayoutSettings({
        mpesa_number: preferences.payout.mpesa_number || '',
        mpesa_name: preferences.payout.mpesa_name || '',
        airtel_number: preferences.payout.airtel_number || '',
        bank_account: preferences.payout.bank_account || '',
        bank_name: preferences.payout.bank_name || ''
      });
    } else {
      setPayoutSettings({
        mpesa_number: '', mpesa_name: '', airtel_number: '', bank_account: '', bank_name: ''
      });
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          company: profile.company,
          business_type: profile.business_type,
          location: profile.location
        })
        .eq('id', vendorId);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutSettings = async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', vendorId)
        .single();
      let preferences = parsePreferences(profileData?.preferences);
      if (!isPlainObject(preferences)) preferences = {};
      preferences.payout = {
        mpesa_number: payoutSettings.mpesa_number,
        mpesa_name: payoutSettings.mpesa_name,
        airtel_number: payoutSettings.airtel_number,
        bank_account: payoutSettings.bank_account,
        bank_name: payoutSettings.bank_name,
        last_updated: new Date().toISOString()
      };
      const { error } = await supabase
        .from('profiles')
        .update({ preferences })
        .eq('id', vendorId);
      if (error) throw error;
      toast({
        title: "Payout Settings Updated",
        description: "Your payout preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error updating your payout settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', vendorId)
      .single();
    const preferences = parsePreferences(data?.preferences);
    if (isPlainObject(preferences) && Array.isArray(preferences.payment_methods)) {
      setPaymentMethods(preferences.payment_methods);
    } else {
      setPaymentMethods([]);
    }
  };

  const savePaymentMethods = async (methods: any[]) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', vendorId)
      .single();
    let preferences = parsePreferences(profileData?.preferences);
    if (!isPlainObject(preferences)) preferences = {};
    preferences.payment_methods = methods;
    await supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', vendorId);
    setPaymentMethods(methods);
  };

  const handleAddOrUpdateCard = async () => {
    let methods = [...paymentMethods];
    if (cardForm.id) {
      // Update existing
      methods = methods.map((m) => m.id === cardForm.id ? { ...cardForm } : m);
    } else {
      // Add new
      methods.push({ ...cardForm, id: Date.now().toString() });
    }
    await savePaymentMethods(methods);
    setCardModalOpen(false);
    setCardForm({ card_number: '', expiry: '', cvc: '', name: '', id: '' });
    toast({ title: 'Card Saved', description: 'Your card details have been saved.' });
  };

  const handleEditCard = (card: any) => {
    setCardForm(card);
    setCardModalOpen(true);
  };

  const handleDeactivateCard = async (id: string) => {
    const methods = paymentMethods.filter((m) => m.id !== id);
    await savePaymentMethods(methods);
    toast({ title: 'Card Removed', description: 'Card has been deactivated.' });
  };

  const fetchPlan = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', vendorId)
      .single();
    const preferences = parsePreferences(data?.preferences);
    if (isPlainObject(preferences)) {
      setPlan(typeof preferences.plan === 'string' ? preferences.plan : 'free');
      setPlanExpiry(typeof preferences.plan_expiry === 'string' ? preferences.plan_expiry : null);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('points_config')
        .select('vendor_subscription_enabled')
        .single();
      
      if (error) {
        console.error('Error fetching subscription status:', error);
        return;
      }
      
      setSubscriptionEnabled(data?.vendor_subscription_enabled || false);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionEnabled(false);
    }
  };

  const handleUpgradePlan = async (newPlan: string) => {
    setPlanMessage(null);
    
    if (!subscriptionEnabled) {
      setPlanMessage('Vendor subscriptions are not available yet. You will be notified when they become available.');
      return;
    }
    
    if (isDowngrade(plan, newPlan)) {
      setPlanMessage('Downgrades are not allowed. Please contact support for assistance.');
      return;
    }
    if (isUpgrade(plan, newPlan) && paymentMethods.length === 0) {
      setPlanMessage('You must add a payment card before upgrading your plan.');
      return;
    }
    // Simulate payment and plan upgrade
    let expiry = null;
    const now = new Date();
    if (newPlan === 'premium_weekly') {
      expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (newPlan === 'premium_monthly') {
      expiry = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    } else if (newPlan === 'premium_yearly') {
      expiry = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    } else if (newPlan === 'pro') {
      expiry = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    }
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', vendorId)
      .single();
    let preferences = parsePreferences(profileData?.preferences);
    if (!isPlainObject(preferences)) preferences = {};
    preferences.plan = newPlan;
    preferences.plan_expiry = expiry;
    await supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', vendorId);
    setPlan(newPlan);
    setPlanExpiry(expiry);
    toast({ title: 'Plan Updated', description: 'Your plan has been updated.' });
  };

  // In the billing tab, add payment method selection to the upgrade modal
  // Upgrade Modal state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({ card_number: '', expiry: '', cvc: '', name: '' });
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [airtelNumber, setAirtelNumber] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium_monthly');

  const handleUpgradePayment = async () => {
    setUpgradeLoading(true);
    // Simulate payment logic for each method
    await new Promise(res => setTimeout(res, 1200));
    // On success, update plan in Supabase
    let expiry = null;
    const now = new Date();
    if (selectedPlan === 'premium_weekly') {
      expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (selectedPlan === 'premium_monthly') {
      expiry = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    } else if (selectedPlan === 'premium_yearly') {
      expiry = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    } else if (selectedPlan === 'pro') {
      expiry = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', vendorId)
      .single();
    let preferences = parsePreferences(profileData?.preferences);
    if (!isPlainObject(preferences)) preferences = {};
    preferences.plan = selectedPlan;
    preferences.plan_expiry = expiry;
    await supabase
      .from('profiles')
      .update({ preferences })
      .eq('id', vendorId);
    setUpgradeLoading(false);
    setUpgradeSuccess(true);
    setTimeout(() => {
      setShowUpgrade(false);
      setUpgradeSuccess(false);
      onCloseUpgradeModal && onCloseUpgradeModal();
    }, 1800);
    toast({ title: 'Plan Upgraded', description: 'Your plan has been upgraded successfully.' });
  };

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast({ 
        title: 'Error', 
        description: 'Please enter your current password', 
        variant: 'destructive' 
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ 
        title: 'Error', 
        description: 'New passwords do not match', 
        variant: 'destructive' 
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ 
        title: 'Error', 
        description: 'Password must be at least 6 characters long', 
        variant: 'destructive' 
      });
      return;
    }
    setSavingPassword(true);
    try {
      // Optionally, you could re-authenticate the user here if needed
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Password updated successfully!' });
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update password', 
        variant: 'destructive' 
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="payout" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Payout</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-sm">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50 text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed here. Contact support if needed.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone_number}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company" className="text-sm">Company Name</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="business_type" className="text-sm">Business Type</Label>
                  <Input
                    id="business_type"
                    value={profile.business_type}
                    onChange={(e) => setProfile(prev => ({ ...prev, business_type: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <Button 
                onClick={updateProfile} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <div className="mt-8">
                {!showPasswordForm ? (
                  <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={e => setPasswordData(d => ({ ...d, currentPassword: e.target.value }))}
                        autoComplete="current-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData(d => ({ ...d, newPassword: e.target.value }))}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData(d => ({ ...d, confirmPassword: e.target.value }))}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={handlePasswordChange} disabled={savingPassword}>
                        {savingPassword ? 'Saving...' : 'Update Password'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowPasswordForm(false)} disabled={savingPassword}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle>Payout Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">M-Pesa Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mpesa_number">M-Pesa Number</Label>
                    <Input
                      id="mpesa_number"
                      value={payoutSettings.mpesa_number}
                      onChange={(e) => setPayoutSettings(prev => ({ ...prev, mpesa_number: e.target.value }))}
                      placeholder="254712345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesa_name">Account Name</Label>
                    <Input
                      id="mpesa_name"
                      value={payoutSettings.mpesa_name}
                      onChange={(e) => setPayoutSettings(prev => ({ ...prev, mpesa_name: e.target.value }))}
                      placeholder="Full name as registered"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Airtel Money</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="airtel_number">Airtel Number</Label>
                    <Input
                      id="airtel_number"
                      value={payoutSettings.airtel_number || ''}
                      onChange={(e) => setPayoutSettings(prev => ({ ...prev, airtel_number: e.target.value }))}
                      placeholder="2547XXXXXXXX"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bank Account (Coming Soon)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_account">Account Number</Label>
                    <Input
                      id="bank_account"
                      value={payoutSettings.bank_account}
                      onChange={(e) => setPayoutSettings(prev => ({ ...prev, bank_account: e.target.value }))}
                      disabled
                      placeholder="Coming soon"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={payoutSettings.bank_name}
                      onChange={(e) => setPayoutSettings(prev => ({ ...prev, bank_name: e.target.value }))}
                      disabled
                      placeholder="Coming soon"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={updatePayoutSettings} disabled={loading}>
                {loading ? "Updating..." : "Update Payout Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan {!subscriptionEnabled && '(Coming Soon)'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">{PLAN_OPTIONS.find(p => p.value === plan)?.label || 'Free Plan'}</h3>
                    <p className="text-gray-600">
                      {plan === 'free' && 'Basic vendor features with unlimited products'}
                      {plan === 'premium_weekly' && 'Premium features with unlimited products'}
                      {plan === 'premium_monthly' && 'Premium features with unlimited products'}
                      {plan === 'premium_yearly' && 'Premium features with unlimited products'}
                      {plan === 'pro' && 'Executive features: Marketing promotions, customer notifications, reduced commission rates'}
                    </p>
                    {planExpiry && (
                      <div className="text-xs text-gray-500 mt-1">Expiry: {new Date(planExpiry).toLocaleDateString()}</div>
                    )}
                    {planMessage && (
                      <div className="text-xs text-red-600 mt-2">{planMessage}</div>
                    )}
                    {!subscriptionEnabled && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <span className="text-lg">🚀</span>
                          <span className="font-medium">Coming Soon!</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Vendor subscriptions will be available soon. You'll be notified when you can upgrade your plan and access premium features.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <label className="text-sm font-medium">Change Plan</label>
                    <select
                      className="border rounded px-3 py-2"
                      value={plan}
                      onChange={e => handleUpgradePlan(e.target.value)}
                      disabled={!subscriptionEnabled}
                    >
                      {PLAN_OPTIONS.map(opt => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={!subscriptionEnabled}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      {subscriptionEnabled ? 'Select a plan to upgrade' : 'Plan upgrades will be available soon.'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {!subscriptionEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Plans (Coming Soon)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PLAN_OPTIONS.map((planOption) => (
                      <div key={planOption.value} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <div className="text-lg font-semibold text-gray-700">{planOption.label.split(' (')[0]}</div>
                        <div className="text-2xl font-bold text-blue-600 mt-2">{planOption.price} KES</div>
                        <div className="text-sm text-gray-500 mt-2">
                          {planOption.value === 'premium_weekly' && 'Weekly premium features'}
                          {planOption.value === 'premium_monthly' && 'Monthly premium features'}
                          {planOption.value === 'premium_yearly' && 'Yearly premium features'}
                          {planOption.value === 'pro' && 'Executive features & reduced commissions'}
                        </div>
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span className="text-lg">💡</span>
                      <span className="font-medium">Premium Benefits</span>
                    </div>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• Reduced commission rates (5% vs 15% for free plan)</li>
                      <li>• Priority customer support</li>
                      <li>• Advanced analytics and insights</li>
                      <li>• Marketing promotions and customer notifications</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No payment methods added yet.
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => setCardModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Payment Method
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((card) => (
                      <div key={card.id} className="flex items-center justify-between border rounded p-3">
                        <div className="flex items-center gap-3">
                          <CreditCardIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">**** **** **** {card.card_number.slice(-4)}</div>
                            <div className="text-xs text-gray-500">Exp: {card.expiry} | {card.name}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCard(card)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeactivateCard(card.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => setCardModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Another Card
                      </Button>
                    </div>
                  </div>
                )}
                {/* Card Modal */}
                {cardModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-bold mb-4">{cardForm.id ? 'Edit Card' : 'Add Card'}</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="card_number">Card Number</Label>
                          <Input
                            id="card_number"
                            value={cardForm.card_number}
                            onChange={e => setCardForm(f => ({ ...f, card_number: e.target.value }))}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label htmlFor="expiry">Expiry</Label>
                            <Input
                              id="expiry"
                              value={cardForm.expiry}
                              onChange={e => setCardForm(f => ({ ...f, expiry: e.target.value }))}
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input
                              id="cvc"
                              value={cardForm.cvc}
                              onChange={e => setCardForm(f => ({ ...f, cvc: e.target.value }))}
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="name">Name on Card</Label>
                          <Input
                            id="name"
                            value={cardForm.name}
                            onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Cardholder Name"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => { setCardModalOpen(false); setCardForm({ card_number: '', expiry: '', cvc: '', name: '', id: '' }); }}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddOrUpdateCard}>
                          {cardForm.id ? 'Update Card' : 'Add Card'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Upgrade Modal */}
            {showUpgrade && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">Upgrade Your Plan</h3>
                  {upgradeSuccess ? (
                    <div className="text-center text-green-600 font-semibold py-8">Plan upgraded successfully!</div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="block font-medium mb-2">Select Plan</label>
                        <select className="border rounded px-3 py-2 w-full mb-4" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                          {PLAN_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <label className="block font-medium mb-2">Select Payment Method</label>
                        <select className="border rounded px-3 py-2 w-full mb-4" value={selectedPaymentMethod} onChange={e => setSelectedPaymentMethod(e.target.value)}>
                          <option value="card">Card</option>
                          <option value="mpesa">MPESA</option>
                          <option value="airtel">Airtel Money</option>
                        </select>
                        {/* Payment details fields */}
                        {selectedPaymentMethod === 'card' && (
                          <div className="space-y-2 mb-2">
                            <input className="border rounded px-3 py-2 w-full" placeholder="Card Number" value={cardDetails.card_number} onChange={e => setCardDetails(d => ({ ...d, card_number: e.target.value }))} />
                            <div className="flex gap-2">
                              <input className="border rounded px-3 py-2 w-full" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails(d => ({ ...d, expiry: e.target.value }))} />
                              <input className="border rounded px-3 py-2 w-full" placeholder="CVC" value={cardDetails.cvc} onChange={e => setCardDetails(d => ({ ...d, cvc: e.target.value }))} />
                            </div>
                            <input className="border rounded px-3 py-2 w-full" placeholder="Name on Card" value={cardDetails.name} onChange={e => setCardDetails(d => ({ ...d, name: e.target.value }))} />
                          </div>
                        )}
                        {selectedPaymentMethod === 'mpesa' && (
                          <div className="mb-2">
                            <input className="border rounded px-3 py-2 w-full" placeholder="MPESA Number" value={mpesaNumber} onChange={e => setMpesaNumber(e.target.value)} />
                          </div>
                        )}
                        {selectedPaymentMethod === 'airtel' && (
                          <div className="mb-2">
                            <input className="border rounded px-3 py-2 w-full" placeholder="Airtel Money Number" value={airtelNumber} onChange={e => setAirtelNumber(e.target.value)} />
                          </div>
                        )}
                      </div>
                      <button
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded shadow w-full mb-2 disabled:opacity-60"
                        onClick={handleUpgradePayment}
                        disabled={true}
                      >
                        Coming Soon
                      </button>
                      <button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded shadow w-full"
                        onClick={() => { setShowUpgrade(false); setUpgradeSuccess(false); onCloseUpgradeModal && onCloseUpgradeModal(); }}
                        disabled={upgradeLoading}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorSettings;