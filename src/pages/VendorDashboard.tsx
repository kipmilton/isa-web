import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useConfetti } from "@/contexts/ConfettiContext";
import VendorDashboardComponent from "@/components/vendor/VendorDashboard";
import { Loader2 } from "lucide-react";

const VendorDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const navigate = useNavigate();
  const { triggerConfetti } = useConfetti();

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

      if (profile.status === 'rejected') {
        navigate('/vendor-rejection');
        return;
      } else if (profile.status !== 'approved') {
        navigate('/vendor-status');
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
      });

      // Check if this is the first time logging in after approval
      if (profile.status === 'approved' && !hasShownWelcome) {
        // Check if they've logged in before by looking at last_login
        const { data: loginData } = await supabase
          .from('profiles')
          .select('last_login')
          .eq('id', session.user.id)
          .single();

        if (!loginData?.last_login) {
          // First time login after approval - trigger celebration
          setTimeout(() => {
            triggerConfetti({
              duration: 6000,
              particleCount: 250,
              colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
            });
          }, 1000); // Small delay to ensure dashboard is loaded
          setHasShownWelcome(true);
        }

        // Update last_login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', session.user.id);
      }
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