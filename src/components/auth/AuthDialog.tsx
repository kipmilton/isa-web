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

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'customer' | 'vendor';
}

const AuthDialog = ({ open, onOpenChange, type }: AuthDialogProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [location, setLocation] = useState({ county: "", constituency: "" });
  const { setIsVendor, setVendorStatus } = useVendor();
  const navigate = useNavigate();

  const handleLocationChange = (county: string, constituency: string) => {
    setLocation({ county, constituency });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && type === 'vendor') {
      // Vendor sign up - redirect to vendor application
      toast.success("Account created! Redirecting to vendor application...");
      onOpenChange(false);
      setTimeout(() => {
        navigate('/vendors');
      }, 1000);
    } else if (!isSignUp && type === 'vendor') {
      // Vendor sign in - check status and redirect accordingly
      setIsVendor(true);
      // Simulate different vendor statuses for demo
      const statuses = ['pending', 'approved', 'rejected'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as any;
      setVendorStatus(randomStatus);
      
      toast.success("Signed in successfully!");
      onOpenChange(false);
      setTimeout(() => {
        if (randomStatus === 'approved') {
          navigate('/vendor-dashboard');
        } else {
          navigate('/vendor-status');
        }
      }, 1000);
    } else {
      // Customer flow - redirect to chat
      toast.success(isSignUp ? "Account created successfully!" : "Signed in successfully!");
      onOpenChange(false);
      setTimeout(() => {
        navigate('/chat');
      }, 1000);
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
                      <Input id="email" type="email" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" required className="mt-1" />
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                      Sign In
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    
                    {type === 'vendor' && (
                      <div>
                        <Label htmlFor="company">Company Name</Label>
                        <Input id="company" required className="mt-1" />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName">
                          {type === 'vendor' ? 'Designated Company Rep 1st Name' : 'First Name'}
                        </Label>
                        <Input id="firstName" required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">
                          {type === 'vendor' ? 'Designated Company Rep 2nd Name' : 'Last Name'}
                        </Label>
                        <Input id="lastName" required className="mt-1" />
                      </div>
                    </div>
                    
                    {type === 'customer' ? (
                      <>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" type="tel" required className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="dob">Date of Birth</Label>
                          <Input id="dob" type="date" required className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender</Label>
                          <select id="gender" className="w-full p-2 border rounded-md mt-1" required>
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <LocationSelect onLocationChange={handleLocationChange} required />
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="businessType">Type of Business/Products</Label>
                          <Input id="businessType" required className="mt-1" />
                        </div>
                        <LocationSelect onLocationChange={handleLocationChange} required />
                      </>
                    )}
                    
                    <div>
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input id="signupEmail" type="email" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input id="signupPassword" type="password" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" required className="mt-1" />
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                      Create Account
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
