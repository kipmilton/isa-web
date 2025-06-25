import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useVendor } from "@/contexts/VendorContext";
import { useNavigate } from "react-router-dom";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'customer' | 'vendor';
}

const AuthDialog = ({ open, onOpenChange, type }: AuthDialogProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { setIsVendor, setVendorStatus } = useVendor();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'vendor') {
      setIsVendor(true);
      
      if (isSignUp) {
        // New vendor signup - redirect to application
        toast.success("Account created! Please complete your vendor application.");
        onOpenChange(false);
        setTimeout(() => {
          navigate('/vendors');
        }, 1000);
      } else {
        // Existing vendor signin - simulate different statuses
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
      }
    } else {
      // Customer flow - redirect to chat (Ask ISA)
      setIsVendor(false);
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
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
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
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" required className="mt-1" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="company">Company</Label>
                          <Input id="company" required className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="businessType">Type of Business/Products</Label>
                          <Input id="businessType" required className="mt-1" />
                        </div>
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

          {/* Right Side - Branding */}
          <div className="flex-1 bg-gradient-to-br from-orange-500 to-yellow-500 p-8 flex flex-col justify-center items-center text-white">
            
            <div className="text-center max-w-sm">
              <img 
                src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" 
                alt="ISA Logo" 
                className="h-20 w-20 mx-auto mb-6 bg-white rounded-full p-3"
              />
              <h3 className="text-3xl font-bold mb-4">Welcome to ISA</h3>
              <p className="text-lg mb-6 opacity-90">
                {type === 'customer' 
                  ? "Your AI-powered shopping companion that understands your style, budget, and preferences."
                  : "Join our vendor community and grow your business with AI-powered recommendations."
                }
              </p>
              <div className="space-y-3 text-left">
                {type === 'customer' ? (
                  <>
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
                      <span className="text-sm">WhatsApp-style shopping experience</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-sm">Secure and trusted platform</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-sm">Reach thousands of potential customers</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-sm">AI-powered product recommendations</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-sm">Easy product management tools</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-sm">Secure payment processing</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
