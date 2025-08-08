import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Settings, 
  Truck, 
  LogOut, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Wallet,
  Star,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import UserWallet from "@/components/loyalty/UserWallet";
import StyleQuiz from "@/components/loyalty/StyleQuiz";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/');
          return;
        }
        setUser(session.user);
        
        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    getSession();
  }, [navigate, toast]);

  const handleProfileUpdate = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          gender: profile.gender,
          location: profile.location,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setEditing(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update profile', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

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

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Password updated successfully!' });
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update password', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: 'Signed out', description: 'You have been logged out.' });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getPlanBadge = () => {
    if (!profile) return null;
    
    const userType = profile.user_type;
    if (userType === 'vendor') {
      const status = profile.vendor_status;
      if (status === 'approved') {
        return <Badge className="bg-green-100 text-green-800">Approved Vendor</Badge>;
      } else if (status === 'pending') {
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      } else if (status === 'rejected') {
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      }
    } else if (userType === 'delivery') {
      const status = profile.delivery_status;
      if (status === 'approved') {
        return <Badge className="bg-green-100 text-green-800">Approved Delivery</Badge>;
      } else if (status === 'pending') {
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      } else if (status === 'rejected') {
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      }
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Customer</Badge>;
    }
    return null;
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                {getPlanBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20 border-4 border-orange-200">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                    {profile.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : user?.email?.split('@')[0] || 'User'
                    }
                  </h2>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">First Name</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {profile.first_name || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {profile.last_name || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{profile.phone_number || 'Not set'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Gender</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{profile.location || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'wallet':
        return <UserWallet user={user} />;

      case 'quiz':
        return <StyleQuiz user={user} />;

      case 'subscription':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Subscription Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <CreditCard className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Manage Your Subscription</h2>
                <p className="text-gray-600 mb-6">
                  Access your subscription management from the shop dashboard for a better experience.
                </p>
                <Button 
                  onClick={() => navigate('/shop')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Go to Shop Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.first_name || ''}
                          onChange={(e) => handleProfileChange('first_name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.last_name || ''}
                          onChange={(e) => handleProfileChange('last_name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profile.phone_number || ''}
                          onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <select
                          id="gender"
                          value={profile.gender || ''}
                          onChange={(e) => handleProfileChange('gender', e.target.value)}
                          className="w-full p-2 border rounded-md mt-1"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile.location || ''}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleProfileUpdate}
                        disabled={saving}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditing(false)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">First Name</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {profile.first_name || 'Not set'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {profile.last_name || 'Not set'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{profile.phone_number || 'Not set'}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Gender</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Location</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{profile.location || 'Not set'}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setEditing(true)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {showPasswordForm ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={saving}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Updating...' : 'Update Password'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: ""
                          });
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{user?.email}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowPasswordForm(true)}
                      variant="outline"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Select a tab to view different sections.</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/shop">
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" 
                  alt="ISA Logo" 
                  className="w-8 h-8 rounded-full shadow-md"
                />
                <div>
                  <h1 className="text-xl font-bold text-orange-600">Profile</h1>
                  <p className="text-sm text-gray-500">Manage your account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Hidden TabsList - users can't switch tabs directly */}
          {/* <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Style Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList> */}
          
          <TabsContent value="profile">
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="wallet">
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="quiz">
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="subscription">
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="settings">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile; 