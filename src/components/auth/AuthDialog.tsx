import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useVendor } from "@/contexts/VendorContext";
import { useNavigate } from "react-router-dom";
import LocationSelect from "./LocationSelect";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // type: 'customer' | 'vendor'; // Removed as per new logic
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [location, setLocation] = useState({ county: "", constituency: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'vendor' | null>(null); // New state for user type
  const { setIsVendor, setVendorStatus } = useVendor();
  const navigate = useNavigate();

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [vendorData, setVendorData] = useState({
    company: "",
    businessType: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
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
  });

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleLocationChange = (county: string, constituency: string) => {
    setLocation({ county, constituency });
    if (userType === 'customer') {
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResetEmailSent(true);
        toast.success("Password reset email sent! Check your inbox.");
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Check if terms are accepted for signup
        if (!acceptedTerms) {
          toast.error("Please accept the terms and conditions to continue");
          setIsLoading(false);
          return;
        }

        // Sign up flow
        const data = userType === 'vendor' ? vendorData : customerData;
        
        // Validate password confirmation
        if (signUpData.password !== signUpData.confirmPassword) {
          toast.error("Passwords don't match!");
          setIsLoading(false);
          return;
        }

        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: signUpData.email,
          password: signUpData.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              phone_number: data.phoneNumber,
              user_type: userType, // Use userType for signup
              ...(userType === 'vendor' ? {
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

        // Create profile for new user
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: signUpData.email,
              first_name: data.firstName,
              last_name: data.lastName,
              phone_number: data.phoneNumber,
              user_type: userType,
              account_setup_completed: true, // Regular signup users have completed setup
              ...(userType === 'vendor' ? {
                company: vendorData.company,
                business_type: vendorData.businessType,
                tax_id: vendorData.taxId,
                company_website: vendorData.companyWebsite,
                location: `${location.county}, ${location.constituency}`,
                status: 'pending'
              } : {
                date_of_birth: customerData.dob,
                gender: customerData.gender,
                location: `${customerData.county}, ${customerData.constituency}`
              })
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast.error('Account created but profile setup failed. Please contact support.');
          }
        }

        toast.success("Account created successfully!");
        onOpenChange(false);
        
        // Redirect based on user type
        if (userType === 'vendor') {
          setIsVendor(true);
          setVendorStatus('pending');
          navigate('/vendor-status');
        } else {
          navigate('/shop');
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
          console.error('Error fetching user profile:', profileError);
        }

        // Redirect based on user type and status
        if (profile?.user_type === 'admin') {
          toast.success("Signed in successfully!");
          onOpenChange(false);
          navigate('/admin');
        } else if (profile?.user_type === 'vendor') {
          setIsVendor(true);
          setVendorStatus((profile?.status as 'pending' | 'approved' | 'rejected') || 'pending');
          toast.success("Signed in successfully!");
          onOpenChange(false);
          if (profile?.status === 'approved') {
            navigate('/vendor-dashboard');
          } else {
            navigate('/vendor-status');
          }
        } else {
          toast.success("Signed in successfully!");
          onOpenChange(false);
          navigate('/shop');
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
        <DialogHeader className="sr-only">
          <DialogTitle>
            {userType === 'customer' ? 'Customer' : 'Vendor'} {isSignUp ? 'Sign Up' : 'Sign In'}
          </DialogTitle>
          <DialogDescription>
            {isSignUp 
              ? `Create your ${userType} account to get started` 
              : `Welcome back! Sign in to your ${userType} account`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-[600px]">
          {/* Left Side - Form */}
          <div className="flex-1 p-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {userType === 'customer' ? 'Customer' : 'Vendor'} {isSignUp ? 'Sign Up' : 'Sign In'}
              </h2>
              <p className="text-gray-600 mb-6">
                {isSignUp 
                  ? `Create your ${userType} account to get started` 
                  : `Welcome back! Sign in to your ${userType} account`
                }
              </p>

              <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  {showPasswordReset ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                      </div>
                      
                      {resetEmailSent ? (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Mail className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-600">Email Sent!</h4>
                            <p className="text-sm text-gray-600">
                              Check your inbox for password reset instructions.
                            </p>
                          </div>
                          <Button 
                            onClick={() => {
                              setShowPasswordReset(false);
                              setResetEmailSent(false);
                              setResetEmail("");
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Back to Sign In
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                          <div>
                            <Label htmlFor="resetEmail">Email Address</Label>
                            <Input 
                              id="resetEmail" 
                              type="email" 
                              required 
                              className="mt-1"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="Enter your email"
                            />
                          </div>
                          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                          </Button>
                          <Button 
                            type="button"
                            onClick={() => setShowPasswordReset(false)}
                            variant="outline"
                            className="w-full"
                          >
                            Back to Sign In
                          </Button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showSignInPassword ? "text" : "password"}
                              required 
                              className="mt-1 pr-10"
                              value={signInData.password}
                              onChange={(e) => handleSignInInputChange('password', e.target.value)}
                            />
                            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowSignInPassword(v => !v)} tabIndex={-1}>
                              {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                          {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                      </form>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                      </div>
                      
                      <Button 
                        type="button"
                        onClick={handleGoogleSignIn}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>
                      
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowPasswordReset(true)}
                          className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    
                    {isSignUp && (
                      <>
                        <div>
                          <Label htmlFor="signupEmail">Email</Label>
                          <Input 
                            id="signupEmail" 
                            type="email" 
                            required 
                            className="mt-1"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="signupPassword">Password</Label>
                          <div className="relative">
                            <Input 
                              id="signupPassword" 
                              type={showPassword ? "text" : "password"}
                              required 
                              className="mt-1 pr-10"
                              value={signUpData.password}
                              onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                            />
                            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Input 
                              id="confirmPassword" 
                              type={showConfirmPassword ? "text" : "password"}
                              required 
                              className="mt-1 pr-10"
                              value={signUpData.confirmPassword}
                              onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}>
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {isSignUp && userType === null && (
                      <div>
                        <Label htmlFor="userType">Account Type</Label>
                        <select 
                          id="userType" 
                          className="w-full p-2 border rounded-md mt-1" 
                          required
                          value={userType || ''}
                          onChange={(e) => setUserType(e.target.value as 'customer' | 'vendor' | null)}
                        >
                          <option value="">Select Account Type</option>
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                        </select>
                      </div>
                    )}

                    {userType === 'vendor' && (
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
                            <Label htmlFor="firstName">Company Rep's First Name</Label>
                            <Input 
                              id="firstName" 
                              required 
                              className="mt-1"
                              value={vendorData.firstName}
                              onChange={(e) => handleVendorInputChange('firstName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Company Rep's Last Name</Label>
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
                          <Label htmlFor="taxId">Tax ID/KRA PIN</Label>
                          <Input 
                            id="taxId" 
                            required 
                            className="mt-1"
                            value={vendorData.taxId}
                            onChange={(e) => handleVendorInputChange('taxId', e.target.value)}
                            placeholder="Enter your Tax ID or KRA PIN"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="companyWebsite">Your Website/Social Media Page Links</Label>
                          <Input 
                            id="companyWebsite" 
                            type="url" 
                            required 
                            className="mt-1"
                            value={vendorData.companyWebsite}
                            onChange={(e) => handleVendorInputChange('companyWebsite', e.target.value)}
                            placeholder="Enter your website or social media links"
                          />
                        </div>
                        
                        <LocationSelect onLocationChange={handleLocationChange} required />
                        
                      </>
                    )}

                    {userType === 'customer' && (
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
                        
                      </>
                    )}
                    
                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={acceptedTerms} 
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      />
                      <div className="text-sm">
                        <label htmlFor="terms" className="text-gray-700">
                          I agree to the{" "}
                          <button 
                            type="button"
                            onClick={() => setShowTermsDialog(true)}
                            className="text-blue-600 hover:underline"
                          >
                            Terms and Conditions
                          </button>
                        </label>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600" 
                      disabled={isLoading || !acceptedTerms}
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button"
                      onClick={handleGoogleSignIn}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
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

      {/* Terms and Conditions Dialog */}
    <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">
            {userType === 'customer' ? 'ISA AI Shopping Assistant - Customer Terms & Conditions' : 'ISA AI Shopping Assistant - Vendor Terms & Conditions'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Terms and conditions for {userType === 'customer' ? 'customers' : 'vendors'} using the ISA AI Shopping Assistant platform.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">

          {userType === 'customer' ? (
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <p><strong>Effective Date:</strong> 7/17/2025</p>
                <p><strong>Version:</strong> 1.0</p>
              </div>

              <p>
                These Terms and Conditions ("Terms") govern your use of the ISA AI Shopping Assistant
                platform ("ISA", "we", "us", or "our"), which provides intelligent shopping assistance via app,
                web, or messaging platforms. By accessing or using ISA, you ("User", "Customer", or "You")
                agree to be bound by these Terms and our Privacy Policy.
                Please read them carefully before using the service.
              </p>

              <h3 className="text-lg font-semibold mt-6">1. OVERVIEW</h3>
              <p>
                ISA is a smart shopping assistant that uses AI to help users discover, compare, and shop from
                a variety of brands and vendors. Through ISA, users can:
              </p>
              <ul className="list-disc ml-6">
                <li>Receive personalized product recommendations</li>
                <li>Compare prices, styles, and features across vendors</li>
                <li>Make purchases directly or be redirected to third-party vendor platforms</li>
                <li>Save favorite items, track orders, and receive promotional deals</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">2. ELIGIBILITY</h3>
              <p><strong>2.1 Minimum Age:</strong> You must be at least 18 years old or have the consent of a parent or legal
                guardian to use the platform.</p>
              <p><strong>2.2 Location:</strong> Some services or offers may only be available in specific countries or regions
                (e.g., Kenya). It is your responsibility to check availability.</p>
              <p><strong>2.3 Account Accuracy:</strong> You agree to provide accurate and current information when creating
                an account or placing orders. ISA reserves the right to suspend or delete accounts with
                fraudulent or misleading information.</p>

              <h3 className="text-lg font-semibold mt-6">3. PLATFORM USE</h3>
              <p><strong>3.1 License:</strong> ISA grants you a limited, non-exclusive, non-transferable license to use the
                platform for personal shopping purposes.</p>
              <p><strong>3.2 Prohibited Use:</strong> You agree not to:</p>
              <ul className="list-disc ml-6">
                <li>Use the platform for illegal or harmful purposes</li>
                <li>Copy, distribute, or modify ISA's technology</li>
                <li>Harass or abuse vendors or other users</li>
                <li>Attempt to reverse-engineer ISA’s AI systems</li>
                <li>Use bots or automated systems to scrape or exploit data</li>
              </ul>
              <p><strong>3.3 Content Ownership:</strong> ISA retains all rights to its technology, content, recommendation
                engines, and interface. You may not use ISA’s content for commercial purposes without prior
                written consent.</p>

              <h3 className="text-lg font-semibold mt-6">4. PRODUCT LISTINGS & PRICING</h3>
              <p><strong>4.1 Vendor Responsibility:</strong> All products listed on ISA are supplied by third-party vendors.
                While ISA aims to curate high-quality, verified listings, the ultimate responsibility for product
                descriptions, pricing, availability, and delivery lies with the vendor.</p>
              <p><strong>4.2 Pricing Errors:</strong> If an item is listed at an incorrect price, ISA reserves the right to cancel the
                transaction. You will be notified and refunded in such cases.</p>
              <p><strong>4.3 Availability:</strong> Product availability is subject to change and may differ from real-time listings
                due to inventory or vendor system delays.</p>

              <h3 className="text-lg font-semibold mt-6">5. ORDERS, PAYMENTS & DELIVERY</h3>
              <p><strong>5.1 Order Process:</strong> You may purchase items directly through ISA or via vendor redirection. You
                will receive confirmation once an order is successfully placed.</p>
              <p><strong>5.2 Payment Methods:</strong> Payments can be made through supported mobile money, debit/credit
                cards, or other approved payment gateways.</p>
              <p><strong>5.3 ISA as Facilitator:</strong> In most cases, ISA acts only as a facilitator, not the seller. The
                transaction contract is between you and the vendor.</p>
              <p><strong>5.4 Delivery:</strong> Delivery times and logistics depend on the vendor or courier service. Estimated
                delivery times are provided for convenience but are not guaranteed.</p>
              <p><strong>5.5 Fees & Charges:</strong> ISA may charge a service fee, convenience fee, or include promotional
                discounts. All charges will be clearly displayed before purchase confirmation.</p>

              <h3 className="text-lg font-semibold mt-6">6. CANCELLATIONS, RETURNS & REFUNDS</h3>
              <p><strong>6.1 Cancellation Policy:</strong> Cancellations may be allowed within a specific timeframe. Please
                check the vendor's terms or contact ISA support for help.</p>
              <p><strong>6.2 Returns & Refunds:</strong> Refunds are handled per the vendor’s policy. If a product is defective,
                incorrect, or undelivered, ISA may assist in dispute resolution but is not liable for compensation
                unless it is a direct seller.</p>
              <p><strong>6.3 Refund Timeline:</strong> Refunds (where approved) may take up to 14 working days depending
                on your payment method.</p>

              <h3 className="text-lg font-semibold mt-6">7. PROMOTIONS, OFFERS & REWARDS</h3>
              <p><strong>7.1 Eligibility:</strong> Some promotions may be limited to specific users, regions, or product
                categories.</p>
              <p><strong>7.2 ISA Discretion:</strong> ISA may cancel or modify offers without prior notice. Abuse or misuse of
                promotions may lead to account suspension.</p>
              <p><strong>7.3 Referral Program:</strong> If ISA runs a referral program, rewards are only granted if terms are
                followed strictly (e.g., minimum spend, first-time user, etc.).</p>

              <h3 className="text-lg font-semibold mt-6">8. DATA PRIVACY & COMMUNICATION</h3>
              <p><strong>8.1 Privacy Policy:</strong> Use of ISA is subject to our [Privacy Policy]. We collect and process your
                data to provide personalized shopping experiences, improve our services, and for operational
                analytics.</p>
              <p><strong>8.2 Marketing Communication:</strong> By using ISA, you may receive promotional emails, SMS, or
                in-app notifications. You can opt-out at any time via your account settings.</p>
              <p><strong>8.3 Third-Party Data:</strong> ISA may share non-personal data with vendors or partners to improve
                product recommendations and service delivery.</p>

              <h3 className="text-lg font-semibold mt-6">9. ACCOUNT SECURITY</h3>
              <p><strong>9.1 Responsibility:</strong> You are responsible for maintaining the confidentiality of your account login
                details. ISA is not liable for unauthorized access resulting from negligence.</p>
              <p><strong>9.2 Termination:</strong> ISA reserves the right to suspend or terminate accounts that violate these
                Terms, post offensive content, engage in fraud, or harm the platform’s reputation.</p>

              <h3 className="text-lg font-semibold mt-6">10. LIMITATION OF LIABILITY</h3>
              <p><strong>10.1 ISA is not liable for:</strong></p>
              <ul className="list-disc ml-6">
                <li>Any direct or indirect damage resulting from vendor errors, failed deliveries, or product
                  defects</li>
                <li>Loss of data, income, or business opportunities</li>
                <li>Platform downtimes, bugs, or technical issues beyond our control</li>
              </ul>
              <p><strong>10.2 ISA’s total liability in any matter shall be limited to the value of the transaction in question
                or KES 5,000.</strong></p>

              <h3 className="text-lg font-semibold mt-6">11. DISPUTES & GOVERNING LAW</h3>
              <p><strong>11.1 Dispute Resolution:</strong> If you are dissatisfied, please first contact isashoppingai@gmail.com
                We aim to resolve issues promptly and fairly.</p>
              <p><strong>11.2 Legal Jurisdiction:</strong> These Terms are governed by the laws of Kenya. Any legal
                proceedings must be brought before courts located in Kenya.</p>

              <h3 className="text-lg font-semibold mt-6">12. MODIFICATIONS</h3>
              <p>ISA reserves the right to update or modify these Terms at any time. Changes will be
                communicated via email or posted on the platform. Continued use after updates indicates
                acceptance of the new Terms.</p>
              <p>By accessing or using ISA, you agree to be bound by these Terms and our Privacy
                Policy.</p>
            </div>
          ) : (
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <p><strong>Effective Date:</strong> 7/17/2025</p>
                <p><strong>Version:</strong> 1.0</p>
              </div>

              <p>
                These Terms and Conditions ("Agreement") govern the participation of vendors ("Vendor", "You", or "Your") on the ISA AI Shopping Assistant platform ("ISA", "we", "us", or "our"), operated by ISA AI Shopping Assistant Ltd., a company registered in Kenya. By listing your products or services on ISA or engaging with the ISA team, you agree to abide by these Terms in full.
              </p>

              <h3 className="text-lg font-semibold mt-6">1. DEFINITIONS</h3>
              <p>
                "ISA Platform" – The AI-powered mobile and web platform, application interface, API systems, databases, and related services used by customers for smart shopping assistance.
              </p>
              <p>
                "Vendor Account" – The registered profile ISA creates or grants access to for managing listings and commercial activity.
              </p>
              <p>
                "Product" – Any goods, services, or offers listed by a Vendor.
              </p>
              <p>
                "Customer" – End-users or shoppers who use ISA to browse, compare, and purchase Products.
              </p>
              <p>
                "Commission" – A percentage fee retained by ISA from sales, unless otherwise negotiated.
              </p>
              <p>
                "Listing" – A product's profile including description, pricing, images, stock info, and delivery options.
              </p>

              <h3 className="text-lg font-semibold mt-6">2. ELIGIBILITY & ONBOARDING</h3>
              <p><strong>2.1 Vendor Approval:</strong> Vendors must complete the ISA onboarding process and be approved by ISA before listing any Products.</p>
              <p><strong>2.2 Accurate Information:</strong> All information provided during onboarding (including business details, contact info, product categories, etc.) must be truthful and regularly updated.</p>
              <p><strong>2.3 Legal Status:</strong> Vendors must be legally registered businesses or individuals eligible to operate and sell products in their respective jurisdiction.</p>

              <h3 className="text-lg font-semibold mt-6">3. PRODUCT LISTINGS & CONTENT</h3>
              <p><strong>3.1 Responsibility:</strong> Vendors are solely responsible for ensuring all listed Products comply with applicable laws, are accurately described, safe, and meet quality standards.</p>
              <p><strong>3.2 Accuracy:</strong> Product names, descriptions, prices, images, shipping timelines, stock levels, and variations must be complete and truthful. Misleading content may result in removal.</p>
              <p><strong>3.3 Intellectual Property:</strong> Vendors must not use copyrighted content, trademarks, or logos without permission. You agree to indemnify ISA against claims related to IP violations.</p>
              <p><strong>3.4 Restricted Items:</strong> Vendors may not list illegal products, counterfeit goods, expired items, or anything ISA deems unsafe or unethical (e.g., weapons, hate merchandise, etc.).</p>

              <h3 className="text-lg font-semibold mt-6">4. ORDER FULFILMENT & CUSTOMER SERVICE</h3>
              <p><strong>4.1 Timeliness:</strong> Vendors must fulfill orders within the agreed timeline. Delays must be communicated to ISA and customers in real time.</p>
              <p><strong>4.2 Delivery:</strong> Where Vendors manage logistics, clear shipping policies and delivery schedules must be defined. Vendors are liable for damaged or undelivered goods if using third-party couriers.</p>
              <p><strong>4.3 Returns & Refunds:</strong> Vendors must adhere to ISA's refund/return policy or provide an equivalent policy approved during onboarding.</p>
              <p><strong>4.4 Customer Complaints:</strong> Vendors are expected to respond to any customer-related complaint or inquiry referred by ISA within 24–48 hours.</p>

              <h3 className="text-lg font-semibold mt-6">5. COMMISSIONS, PAYMENTS & FEES</h3>
              <p><strong>5.1 Commission Structure:</strong> ISA retains a commission on each sale, as agreed upon during onboarding or updated periodically with notice. This may vary by category or volume.</p>
              <p><strong>5.2 Payouts:</strong> Net revenue (after commissions and applicable charges) will be remitted to the Vendor on a [weekly/bi-weekly/monthly] basis, depending on the payout schedule.</p>
              <p><strong>5.3 Deductions:</strong> ISA reserves the right to deduct amounts for:</p>
              <ul className="list-disc ml-6">
                <li>Refunds or chargebacks</li>
                <li>Promotional discounts</li>
                <li>Platform service fees</li>
                <li>Regulatory deductions (e.g., taxes or levies)</li>
              </ul>
              <p><strong>5.4 Taxes:</strong> Vendors are responsible for declaring and remitting their own taxes (e.g., VAT, income tax) to the relevant authorities.</p>

              <h3 className="text-lg font-semibold mt-6">6. PROMOTIONS & MARKETING</h3>
              <p><strong>6.1 Platform Campaigns:</strong> ISA may run promotional campaigns involving Vendor products. Participation may be voluntary or opt-in unless included in partnership agreements.</p>
              <p><strong>6.2 Use of Vendor Content:</strong> Vendors authorize ISA to use their brand name, product images, and offers for platform promotion, newsletters, or AI-generated recommendations.</p>

              <h3 className="text-lg font-semibold mt-6">7. DATA USE & PRIVACY</h3>
              <p><strong>7.1 Confidentiality:</strong> Any commercial terms, internal data, or proprietary insights exchanged between the Vendor and ISA are strictly confidential.</p>
              <p><strong>7.2 Data Ownership:</strong> Customer data (emails, Browse behavior, purchase patterns) collected by ISA remains the property of ISA and may be used in accordance with its Privacy Policy.</p>
              <p><strong>7.3 AI Personalization:</strong> Vendors acknowledge that their product data may be used to train recommendation systems or improve AI user experience.</p>

              <h3 className="text-lg font-semibold mt-6">8. INTELLECTUAL PROPERTY (IP)</h3>
              <p><strong>8.1</strong> Vendors retain ownership of their own IP, including logos, product designs, and branded assets.</p>
              <p><strong>8.2</strong> Any technology, code, AI system, or platform developed by ISA (including interface logic, chatbot systems, or analytics dashboards) remains ISA's exclusive IP.</p>
              <p><strong>8.3</strong> Vendors may not reverse engineer, replicate, or commercialize ISA's platform or proprietary features.</p>

              <h3 className="text-lg font-semibold mt-6">9. SUSPENSION & TERMINATION</h3>
              <p><strong>9.1</strong> ISA reserves the right to suspend or terminate a Vendor account at any time, with or without notice, if the Vendor:</p>
              <ul className="list-disc ml-6">
                <li>Breaches these Terms</li>
                <li>Provides false or harmful listings</li>
                <li>Damages ISA's brand or user trust</li>
                <li>Violates laws or ethical guidelines</li>
              </ul>
              <p><strong>9.2</strong> Upon termination:</p>
              <ul className="list-disc ml-6">
                <li>All listings are removed from the platform;</li>
                <li>Outstanding dues will be settled after accounting for refunds, claims, and disputes.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">10. LIABILITY & INDEMNITY</h3>
              <p><strong>10.1</strong> Vendors agree to indemnify and hold harmless ISA, its officers, and agents from any claims, damages, or liabilities resulting from:</p>
              <ul className="list-disc ml-6">
                <li>Product defects, misinformation, or regulatory violations</li>
                <li>Intellectual property disputes</li>
                <li>Loss or injury related to delivered goods</li>
              </ul>
              <p><strong>10.2</strong> ISA is not liable for:</p>
              <ul className="list-disc ml-6">
                <li>Vendor-side delivery failures</li>
                <li>Third-party payment gateway interruptions</li>
                <li>Technical downtime beyond its control</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">11. RELATIONSHIP</h3>
              <p>These Terms do not create any partnership, joint venture, or employment relationship. Vendors act as independent parties.</p>

              <h3 className="text-lg font-semibold mt-6">12. MODIFICATIONS</h3>
              <p>ISA may update these Terms from time to time. Vendors will be notified of major changes via email or platform notice. Continued use of the platform constitutes acceptance.</p>

              <h3 className="text-lg font-semibold mt-6">13. GOVERNING LAW & DISPUTES</h3>
              <p>These Terms are governed by the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kenya.</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowTermsDialog(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </Dialog>
  );
};

export default AuthDialog;
