import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User, CreditCard, Settings as SettingsIcon, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VendorSettingsProps {
  vendorId: string;
}

const VendorSettings = ({ vendorId }: VendorSettingsProps) => {
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

  useEffect(() => {
    fetchProfile();
    fetchPayoutSettings();
  }, [vendorId]);

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
    // In a real app, this would fetch from a payout_settings table
    // For now, using mock data
    setPayoutSettings({
      mpesa_number: '254712345678',
      mpesa_name: 'John Doe',
      bank_account: '',
      bank_name: ''
    });
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
      // In a real app, this would update payout settings in the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="payout" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Payout</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed here. Contact support if needed.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone_number}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="business_type">Business Type</Label>
                  <Input
                    id="business_type"
                    value={profile.business_type}
                    onChange={(e) => setProfile(prev => ({ ...prev, business_type: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button onClick={updateProfile} disabled={loading}>
                {loading ? "Updating..." : "Update Profile"}
              </Button>
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
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Free Plan</h3>
                    <p className="text-gray-600">Basic vendor features</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="mt-4">
                  <Button variant="outline" disabled>
                    Upgrade Plan (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  No payment methods added yet.
                  <div className="mt-4">
                    <Button variant="outline" disabled>
                      Add Payment Method (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorSettings;