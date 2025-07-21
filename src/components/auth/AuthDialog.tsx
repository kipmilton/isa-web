import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useVendor } from "@/contexts/VendorContext";
import { useNavigate } from "react-router-dom";
import LocationSelect from "./LocationSelect";
import { supabase } from "@/integrations/supabase/client";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'customer' | 'vendor';
}

const AuthDialog = ({ open, onOpenChange, type }: AuthDialogProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [location, setLocation] = useState({ county: "", constituency: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { setIsVendor, setVendorStatus } = useVendor();
  const navigate = useNavigate();

  const [vendorData, setVendorData] = useState({
    company: "",
    businessType: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    taxId: "",
    companyWebsite: ""
  });

  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    county: "",
    constituency: "",
    gender: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const handleLocationChange = (county: string, constituency: string) => {
    setLocation({ county, constituency });
    if (type === 'customer') {
      setCustomerData(prev => ({ ...prev, county, constituency }));
    }
  };

  const handleVendorInputChange = (field: string, value: string) => {
    setVendorData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignInInputChange = (field: string, value: string) => {
    setSignInData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        const data = type === 'vendor' ? vendorData : customerData;
        
        // Validate password confirmation
        if (data.password !== data.confirmPassword) {
          toast.error("Passwords don't match!");
          setIsLoading(false);
          return;
        }

        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              phone_number: data.phoneNumber,
              user_type: type,
              ...(type === 'vendor' ? {
                company: vendorData.company,
                business_type: vendorData.businessType,
                tax_id: vendorData.taxId,
                company_website: vendorData.companyWebsite,
                location: `${location.county}, ${location.constituency}`
              } : {
                date_of_birth: customerData.dob,
                gender: customerData.gender,
                location: `${customerData.county}, ${customerData.constituency}`
              })
            }
          }
        });

        if (authError) {
          toast.error(authError.message);
          setIsLoading(false);
          return;
        }

        toast.success("Account created successfully! Please check your email to verify your account.");
        onOpenChange(false);
        
        if (type === 'vendor') {
          navigate('/vendors');
        } else {
          navigate('/chat');
        }
      } else {
        // Sign in flow
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: signInData.email,
          password: signInData.password
        });

        if (authError) {
          toast.error(authError.message);
          setIsLoading(false);
          return;
        }

        // Get user profile to check type and status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, status')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (type === 'vendor') {
          setIsVendor(true);
          setVendorStatus((profile?.status as 'pending' | 'approved' | 'rejected') || 'pending');
          
          toast.success("Signed in successfully!");
          onOpenChange(false);
          
          setTimeout(() => {
            if (profile?.status === 'approved') {
              navigate('/vendor-dashboard');
            } else {
              navigate('/vendor-status');
            }
          }, 1000);
        } else {
          toast.success("Signed in successfully!");
          onOpenChange(false);
          setTimeout(() => {
            navigate('/chat');
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="flex min-h-[600px]">
          {/* Left Side - Form */}
          <div className="flex-1 p-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {type === 'customer' ? 'Customer' : 'Vendor'} {isSignUp ? 'Sign Up' : 'Sign In'}
              </h2>
              <p className="text-gray-600 mb-6">
                {isSignUp 
                  ? `Create your ${type} account to get started` 
                  : `Welcome back! Sign in to your ${type} account`
                }
              </p>

              <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        className="mt-1"
                        value={signInData.email}
                        onChange={(e) => handleSignInInputChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        required 
                        className="mt-1"
                        value={signInData.password}
                        onChange={(e) => handleSignInInputChange('password', e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    
                    {type === 'vendor' ? (
                      <>
                        <div>
                          <Label htmlFor="company">Company Name</Label>
                          <Input 
                            id="company" 
                            required 
                            className="mt-1"
                            value={vendorData.company}
                            onChange={(e) => handleVendorInputChange('company', e.target.value)}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input 
                              id="firstName" 
                              required 
                              className="mt-1"
                              value={vendorData.firstName}
                              onChange={(e) => handleVendorInputChange('firstName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input 
                              id="lastName" 
                              required 
                              className="mt-1"
                              value={vendorData.lastName}
                              onChange={(e) => handleVendorInputChange('lastName', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="businessType">Type of Business/Products</Label>
                          <Input 
                            id="businessType" 
                            required 
                            className="mt-1"
                            value={vendorData.businessType}
                            onChange={(e) => handleVendorInputChange('businessType', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input 
                            id="phoneNumber" 
                            type="tel" 
                            required 
                            className="mt-1"
                            value={vendorData.phoneNumber}
                            onChange={(e) => handleVendorInputChange('phoneNumber', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="taxId">Tax ID</Label>
                          <Input 
                            id="taxId" 
                            required 
                            className="mt-1"
                            value={vendorData.taxId}
                            onChange={(e) => handleVendorInputChange('taxId', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="companyWebsite">Company Website</Label>
                          <Input 
                            id="companyWebsite" 
                            type="url" 
                            required 
                            className="mt-1"
                            value={vendorData.companyWebsite}
                            onChange={(e) => handleVendorInputChange('companyWebsite', e.target.value)}
                          />
                        </div>
                        
                        <LocationSelect onLocationChange={handleLocationChange} required />
                        
                        <div>
                          <Label htmlFor="signupEmail">Email</Label>
                          <Input 
                            id="signupEmail" 
                            type="email" 
                            required 
                            className="mt-1"
                            value={vendorData.email}
                            onChange={(e) => handleVendorInputChange('email', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="signupPassword">Password</Label>
                          <Input 
                            id="signupPassword" 
                            type="password" 
                            required 
                            className="mt-1"
                            value={vendorData.password}
                            onChange={(e) => handleVendorInputChange('password', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password" 
                            required 
                            className="mt-1"
                            value={vendorData.confirmPassword}
                            onChange={(e) => handleVendorInputChange('confirmPassword', e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input 
                              id="firstName" 
                              required 
                              className="mt-1"
                              value={customerData.firstName}
                              onChange={(e) => handleCustomerInputChange('firstName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input 
                              id="lastName" 
                              required 
                              className="mt-1"
                              value={customerData.lastName}
                              onChange={(e) => handleCustomerInputChange('lastName', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="dob">Date of Birth</Label>
                          <Input 
                            id="dob" 
                            type="date" 
                            required 
                            className="mt-1"
                            value={customerData.dob}
                            onChange={(e) => handleCustomerInputChange('dob', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="gender">Gender</Label>
                          <select 
                            id="gender" 
                            className="w-full p-2 border rounded-md mt-1" 
                            required
                            value={customerData.gender}
                            onChange={(e) => handleCustomerInputChange('gender', e.target.value)}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input 
                            id="phoneNumber" 
                            type="tel" 
                            required 
                            className="mt-1"
                            value={customerData.phoneNumber}
                            onChange={(e) => handleCustomerInputChange('phoneNumber', e.target.value)}
                          />
                        </div>
                        
                        <LocationSelect onLocationChange={handleLocationChange} required />
                        
                        <div>
                          <Label htmlFor="signupEmail">Email</Label>
                          <Input 
                            id="signupEmail" 
                            type="email" 
                            required 
                            className="mt-1"
                            value={customerData.email}
                            onChange={(e) => handleCustomerInputChange('email', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="signupPassword">Password</Label>
                          <Input 
                            id="signupPassword" 
                            type="password" 
                            required 
                            className="mt-1"
                            value={customerData.password}
                            onChange={(e) => handleCustomerInputChange('password', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password" 
                            required 
                            className="mt-1"
                            value={customerData.confirmPassword}
                            onChange={(e) => handleCustomerInputChange('confirmPassword', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Side - Branding (Hidden on mobile) */}
          <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-500 to-yellow-500 p-8 flex-col justify-center items-center text-white">
            
            <div className="text-center max-w-sm">
              <img 
                src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" 
                alt="ISA Logo" 
                className="h-20 w-20 mx-auto mb-6 bg-white rounded-full p-3"
              />
              <h3 className="text-3xl font-bold mb-4">Welcome to ISA</h3>
              <p className="text-lg mb-6 opacity-90">
                Your AI-powered shopping companion that understands your style, budget, and preferences.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">Personalized product recommendations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">Access to quality African & global brands</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">ISA can suggest gifts for your loved ones</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">Secure and trusted platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
