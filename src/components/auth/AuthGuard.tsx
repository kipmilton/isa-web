import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedUserTypes?: ('customer' | 'vendor' | 'admin' | 'delivery')[];
  allowedVendorStatuses?: ('pending' | 'approved' | 'rejected')[];
}

const AuthGuard = ({ 
  children, 
  requireAuth = false, 
  allowedUserTypes = [], 
  allowedVendorStatuses = [] 
}: AuthGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (requireAuth) {
            navigate('/');
            return;
          }
          setLoading(false);
          return;
        }

        if (!session?.user) {
          if (requireAuth) {
            navigate('/');
            return;
          }
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error getting profile:', profileError);
          if (requireAuth) {
            navigate('/');
            return;
          }
          setLoading(false);
          return;
        }

        setUserProfile(profile);

        // Check if user is a rejected vendor
        if (profile.user_type === 'vendor' && profile.status === 'rejected') {
          navigate('/vendor-rejection');
          return;
        }

        // Check if user is a delivery personnel and check their status
        if (profile.user_type === 'delivery') {
          const { data: deliveryProfile, error: deliveryError } = await supabase
            .from('delivery_personnel')
            .select('status')
            .eq('user_id', session.user.id)
            .single();

          if (!deliveryError && deliveryProfile) {
            if (deliveryProfile.status === 'rejected') {
              navigate('/delivery-rejection');
              return;
            } else if (deliveryProfile.status === 'pending') {
              navigate('/delivery-pending');
              return;
            }
          }
        }

        // Check user type restrictions
        if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(profile.user_type)) {
          navigate('/');
          return;
        }

        // Check vendor status restrictions
        if (profile.user_type === 'vendor' && allowedVendorStatuses.length > 0) {
          if (!allowedVendorStatuses.includes(profile.status)) {
            navigate('/');
            return;
          }
        }

      } catch (error) {
        console.error('Error in auth guard:', error);
        if (requireAuth) {
          navigate('/');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, requireAuth, allowedUserTypes, allowedVendorStatuses]);

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

  return <>{children}</>;
};

export default AuthGuard; 