import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Mail, LogOut, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VendorRejection = () => {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/');
          return;
        }

        // Get user profile to check status
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_type, status, email')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          navigate('/');
          return;
        }

        // If not a vendor or not rejected, redirect
        if (profile.user_type !== 'vendor' || profile.status !== 'rejected') {
          navigate('/');
          return;
        }

        setUserEmail(profile.email || session.user.email || "");
      } catch (error) {
        console.error('Error checking user status:', error);
        navigate('/');
      }
    };

    checkUserStatus();
  }, [navigate]);

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Vendor Application Appeal - ISA Platform");
    const body = encodeURIComponent(
      `Hello ISA Support Team,\n\nI would like to appeal my vendor application rejection.\n\nMy email: ${userEmail}\n\nPlease provide more information about why my application was rejected and what steps I can take to improve my application.\n\nThank you,\n[Your Name]`
    );
    
    window.open(`mailto:support@isa.com?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Error signing out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <XCircle className="h-20 w-20 text-red-500" />
              <AlertTriangle className="h-8 w-8 text-red-600 absolute -top-2 -right-2" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-800">
            Application Rejected
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              We regret to inform you that your vendor application has been rejected as it did not meet our current terms of service and quality standards.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-red-800 mb-3">Common reasons for rejection:</h4>
              <ul className="text-sm text-red-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Incomplete or inaccurate business information
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Product quality standards not met
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Policy compliance issues
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Insufficient business documentation
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Terms of service violations
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleContactSupport}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? "Signing out..." : "Sign Out"}
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>
              If you believe this decision was made in error, please contact our support team with additional information about your business.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorRejection; 