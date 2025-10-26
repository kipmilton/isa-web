
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Loader2 } from "lucide-react";

const Admin = () => {
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

      // Check admin_roles table for admin access - query all then filter client-side to avoid RLS issues
      const { data: adminRoles, error: adminError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', session.user.id);

      console.log('Admin roles query result:', { adminRoles, adminError });

      // Filter results client-side to avoid RLS policy issues
      const adminRole = adminRoles?.find(role => 
        role.is_active === true && 
        role.is_suspended === false
      );

      if (adminError || !adminRole) {
        // Fallback: check profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();

        if (profile?.user_type !== 'admin') {
          navigate('/');
          return;
        }
      }

      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.email?.split('@')[0] || 'Admin',
        adminRole: adminRole || { role: 'main_admin' }
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

  return (
    <AdminDashboard 
      user={user} 
      onLogout={handleLogout}
      adminRole={user.adminRole}
      mustResetPassword={user.adminRole?.must_reset_password}
    />
  );
};

export default Admin;
