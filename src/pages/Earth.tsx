import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Earth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<any>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [mustResetPassword, setMustResetPassword] = useState(false);
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

      // Check admin roles with suspension check
      const { data: roleData, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (roleError || !roleData) {
        navigate('/');
        return;
      }

      // Check if suspended
      if (roleData.is_suspended) {
        setIsSuspended(true);
        setLoading(false);
        return;
      }

      // Check if must reset password
      if (roleData.must_reset_password) {
        setMustResetPassword(true);
      }

      // Update last login
      await supabase
        .from('admin_roles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', session.user.id);

      setAdminRole(roleData);
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.email?.split('@')[0] || 'Admin',
        role: roleData.role
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

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Suspended</AlertTitle>
          <AlertDescription>
            Your access has been temporarily limited. Please contact the admin for assistance.
          </AlertDescription>
        </Alert>
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
      mustResetPassword={mustResetPassword}
      adminRole={adminRole}
    />
  );
};

export default Earth;
