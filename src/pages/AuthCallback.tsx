import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';
import { toast } from 'sonner';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setIsVendor, setVendorStatus } = useVendor();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed');
          navigate('/');
          return;
        }

        if (session?.user) {
          // Check if this is a new user (Google OAuth signup)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // New user - create profile with customer role
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                first_name: session.user.user_metadata?.full_name?.split(' ')[0] || '',
                last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                user_type: 'customer',
                avatar_url: session.user.user_metadata?.avatar_url || null,
                account_setup_completed: false // Flag for account setup completion
              });

            if (insertError) {
              console.error('Error creating profile:', insertError);
              toast.error('Failed to create user profile');
              navigate('/');
              return;
            }

            toast.success('Account created successfully! Please complete your profile setup.');
            navigate('/shop');
          } else if (profile) {
            // Existing user - redirect based on user type and status
            if (profile.user_type === 'admin') {
              navigate('/admin');
            } else if (profile.user_type === 'vendor') {
              setIsVendor(true);
              setVendorStatus((profile.status as 'pending' | 'approved' | 'rejected') || 'pending');
              if (profile.status === 'approved') {
                navigate('/vendor-dashboard');
              } else {
                navigate('/vendor-status');
              }
            } else if (profile.user_type === 'delivery') {
              // Check delivery personnel status
              const { data: deliveryProfile, error: deliveryError } = await supabase
                .from('delivery_personnel')
                .select('status')
                .eq('user_id', session.user.id)
                .single();

              if (!deliveryError && deliveryProfile) {
                if (deliveryProfile.status === 'approved') {
                  navigate('/delivery-dashboard');
                } else if (deliveryProfile.status === 'rejected') {
                  navigate('/delivery-rejection');
                } else {
                  navigate('/delivery-pending');
                }
              } else {
                // Fallback to pending if delivery profile not found
                navigate('/delivery-pending');
              }
            } else {
              // Customer - check if account setup is completed
              if (!(profile as any).account_setup_completed) {
                toast.success('Welcome back! Please complete your profile setup for better recommendations.');
              }
              navigate('/shop');
            }
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback exception:', error);
        toast.error('Authentication failed');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, setIsVendor, setVendorStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 