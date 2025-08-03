import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DeliveryDashboardComponent from "@/components/delivery/DeliveryDashboard";
import { Loader2 } from "lucide-react";

const DeliveryDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.user_type !== 'delivery') {
        navigate('/');
        return;
      }

      // Check delivery personnel status
      const { data: deliveryPersonnel, error: deliveryError } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (deliveryError || !deliveryPersonnel) {
        navigate('/');
        return;
      }

      if (deliveryPersonnel.status === 'rejected') {
        // Redirect to rejection page
        navigate('/delivery-rejection');
        return;
      } else if (deliveryPersonnel.status === 'pending') {
        // Show pending status page
        navigate('/delivery-pending');
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
      });
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <DeliveryDashboardComponent user={user} onLogout={handleLogout} />;
};

export default DeliveryDashboard; 