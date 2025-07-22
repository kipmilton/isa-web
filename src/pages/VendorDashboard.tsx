import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VendorDashboardComponent from "@/components/vendor/VendorDashboard";
import { Loader2 } from "lucide-react";

const VendorDashboard = () => {
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

      // Check if user is a vendor
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.user_type !== 'vendor') {
        navigate('/');
        return;
      }

      if (profile.status !== 'approved') {
        navigate('/vendor-status');
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

  return <VendorDashboardComponent user={user} onLogout={handleLogout} />;
};

export default VendorDashboard;