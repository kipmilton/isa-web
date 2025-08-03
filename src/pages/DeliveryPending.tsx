import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Home, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DeliveryPending = () => {
  const [user, setUser] = useState<any>(null);
  const [deliveryProfile, setDeliveryProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        navigate('/');
        return;
      }

      // Check if user is a delivery personnel
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile?.user_type !== 'delivery') {
        navigate('/');
        return;
      }

      // Get delivery personnel profile
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (deliveryError) {
        console.error('Error fetching delivery profile:', deliveryError);
        navigate('/');
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email
      });
      setDeliveryProfile(deliveryData);

      // Check if status has changed
      if (deliveryData.status === 'approved') {
        navigate('/delivery-dashboard');
      } else if (deliveryData.status === 'rejected') {
        navigate('/delivery-rejection');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setChecking(true);
    await checkUser();
    setChecking(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !deliveryProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl text-yellow-600">Application Pending</CardTitle>
          <CardDescription>
            Your delivery personnel application is under review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Thank you for your application! Our team is currently reviewing your submission. 
              You'll receive a notification once your application has been processed.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Name:</strong> {deliveryProfile.first_name} {deliveryProfile.last_name}</p>
            <p><strong>Email:</strong> {deliveryProfile.email}</p>
            <p><strong>Phone:</strong> {deliveryProfile.phone_number}</p>
            <p><strong>Location:</strong> {deliveryProfile.county}, {deliveryProfile.constituency}</p>
            <p><strong>Status:</strong> <span className="text-yellow-600 font-medium">Pending Review</span></p>
            <p><strong>Submitted:</strong> {new Date(deliveryProfile.created_at).toLocaleDateString()}</p>
          </div>

          <div className="flex flex-col space-y-2 pt-4">
            <Button onClick={handleRefreshStatus} disabled={checking} className="w-full">
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Status'}
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryPending; 