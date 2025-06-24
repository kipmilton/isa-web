import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useVendor } from "@/contexts/VendorContext";

const Vendors = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { setIsVendor, setVendorStatus } = useVendor();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setIsVendor(true);
    setVendorStatus('pending');
    toast.success("Application submitted! We'll review and get back within 72 hours.");
    
    // Redirect to vendor status page after 2 seconds
    setTimeout(() => {
      navigate('/vendor-status');
    }, 2000);
  };

  if (formSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Thank you for your interest in partnering with ISA. We review all applications and will get back to you within 72 hours.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your vendor status page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Simple Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">ISA</span>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Join ISA as a Vendor</h1>
            <p className="text-xl text-gray-600 mb-4">
              We're currently onboarding selected brands focused on quality, affordability, and African innovation.
            </p>
            <p className="text-gray-500">
              We review all applications and get back within 72 hours.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Application</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="company">Company/Business Name</Label>
                  <Input id="company" required />
                </div>
                
                <div>
                  <Label htmlFor="businessType">Type of Business/Products</Label>
                  <Input id="businessType" placeholder="e.g., Fashion, Electronics, Home goods" required />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" required />
                </div>
                
                <div>
                  <Label htmlFor="website">Website/Social Media (Optional)</Label>
                  <Input id="website" placeholder="https://..." />
                </div>
                
                <div>
                  <Label htmlFor="description">Brief Description of Your Business</Label>
                  <textarea 
                    id="description" 
                    className="w-full p-3 border border-gray-300 rounded-md h-24 resize-none"
                    placeholder="Tell us about your products, target market, and what makes your business unique..."
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>By applying, you agree to our vendor terms and conditions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vendors;
