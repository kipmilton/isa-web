import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, UserCheck, UserX, Trash2, Shield, Copy } from "lucide-react";

interface AdminUser {
  user_id: string;
  role: string;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  last_login: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AdminManagement = ({ currentUserId }: { currentUserId: string }) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<string>("");
  const [defaultPassword] = useState("Recipe@2025");
  const { toast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data: rolesData, error } = await supabase
        .from('admin_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithProfiles = await Promise.all(
        (rolesData || []).map(async (role) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', role.user_id)
            .single();
          
          return {
            ...role,
            profiles: profileData
          };
        })
      );
      
      setAdminUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminRole) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // First create the user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: defaultPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/earth`,
          data: {
            user_type: 'admin',
            role: newAdminRole
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create admin role
        const { error: roleError } = await supabase
          .from('admin_roles')
          .insert({
            user_id: authData.user.id,
            role: newAdminRole,
            created_by: currentUserId,
            must_reset_password: true
          });

        if (roleError) throw roleError;

        toast({
          title: "Success",
          description: `Admin user created. Default password: ${defaultPassword}`,
        });

        setShowAddAdmin(false);
        setNewAdminEmail("");
        setNewAdminRole("");
        fetchAdmins();
      }
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive"
      });
    }
  };

  const handleToggleSuspension = async (userId: string, currentlySuspended: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_admin_suspension', {
        _user_id: userId,
        _suspend: !currentlySuspended,
        _suspended_by: currentUserId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Admin ${!currentlySuspended ? 'suspended' : 'unsuspended'} successfully`
      });

      fetchAdmins();
    } catch (error: any) {
      console.error('Error toggling suspension:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update admin status",
        variant: "destructive"
      });
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(defaultPassword);
    toast({
      title: "Copied",
      description: "Default password copied to clipboard"
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'main_admin': return 'bg-red-500 text-white';
      case 'vendor_admin': return 'bg-blue-500 text-white';
      case 'customer_service_admin': return 'bg-green-500 text-white';
      case 'order_admin': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'main_admin': 'Main Admin',
      'vendor_admin': 'Vendor Admin',
      'customer_service_admin': 'Customer Service',
      'order_admin': 'Order Admin'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Management</h1>
        <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Admin Role</Label>
                <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor_admin">Vendor Admin</SelectItem>
                    <SelectItem value="customer_service_admin">Customer Service Admin</SelectItem>
                    <SelectItem value="order_admin">Order Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <Label className="text-sm">Default Password</Label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm font-mono">{defaultPassword}</code>
                  <Button size="sm" variant="ghost" onClick={copyPassword}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Admin will be prompted to reset on first login</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddAdmin(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAdmin}>
                  Create Admin
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Admin Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((admin) => (
                <TableRow key={admin.user_id}>
                  <TableCell>
                    {admin.profiles?.first_name || admin.profiles?.last_name 
                      ? `${admin.profiles.first_name || ''} ${admin.profiles.last_name || ''}`.trim()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{admin.profiles?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(admin.role)}>
                      {getRoleDisplay(admin.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.is_suspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : admin.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.last_login 
                      ? new Date(admin.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {admin.role !== 'main_admin' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={admin.is_suspended ? "default" : "outline"}
                          onClick={() => handleToggleSuspension(admin.user_id, admin.is_suspended)}
                        >
                          {admin.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManagement;
