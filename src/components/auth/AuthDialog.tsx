import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'customer' | 'vendor';
}

const AuthDialog = ({ open, onOpenChange, type }: AuthDialogProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [location, setLocation] = useState({ county: "", constituency: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
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
        // Check if terms are accepted for signup
        if (!acceptedTerms) {
          toast.error("Please accept the terms and conditions to continue");
          setIsLoading(false);
          return;
        }

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
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              {type === 'customer' ? 'Terms and Conditions' : 'ISA AI Shopping Assistant - Vendor Terms & Conditions'}
            </h2>
            
            {type === 'customer' ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">Coming Soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  Customer terms and conditions are being finalized and will be available soon.
                </p>
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
                <p><strong>7.2 Data Ownership:</strong> Customer data (emails, browsing behavior, purchase patterns) collected by ISA remains the property of ISA and may be used in accordance with its Privacy Policy.</p>
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
