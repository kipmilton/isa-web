import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserCheck,
  UserX,
  Shield,
  Plus,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface AdminRole {
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SupportRequest {
  id: string;
  user_id: string;
  phone_number: string;
  message: string;
  status: string;
  created_at: string;
  profiles?: any;
}

const AdminRoles = () => {
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch admin roles without profile data first
      const { data: rolesData, error: rolesError } = await supabase
        .from('admin_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (rolesError) {
        console.error('Admin roles error:', rolesError);
        setAdminRoles([]);
      } else {
        // Fetch profile data for each admin role
        const rolesWithProfiles = await Promise.all(
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
        setAdminRoles(rolesWithProfiles);
      }

      // Fetch support requests without profile data first
      const { data: requestsData, error: requestsError } = await supabase
        .from('support_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Support requests error:', requestsError);
        setSupportRequests([]);
      } else {
        // Fetch profile data for each support request
        const requestsWithProfiles = await Promise.all(
          (requestsData || []).map(async (request) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', request.user_id)
              .single();
            
            return {
              ...request,
              profiles: profileData
            };
          })
        );
        setSupportRequests(requestsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!newAdminEmail || !newAdminRole) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail)
        .single();

      if (userError || !userData) {
        toast({
          title: "Error", 
          description: "User not found with this email",
          variant: "destructive"
        });
        return;
      }

      // Assign the role
      const { error: roleError } = await supabase
        .from('admin_roles')
        .insert({
          user_id: userData.id,
          role: newAdminRole,
          is_active: true
        });

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: `${newAdminRole} role assigned successfully`
      });

      setShowAddAdmin(false);
      setNewAdminEmail("");
      setNewAdminRole("");
      fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive"
      });
    }
  };

  const handleToggleRole = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({ is_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling role:', error);
      toast({
        title: "Error",
        description: "Failed to update role status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSupportRequest = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Support request marked as ${status}`
      });

      fetchData();
    } catch (error) {
      console.error('Error updating support request:', error);
      toast({
        title: "Error",
        description: "Failed to update support request",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'main_admin': return 'bg-red-500';
      case 'vendor_approver': return 'bg-blue-500';
      case 'product_approver': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Admin Role</DialogTitle>
              <DialogDescription>
                Assign a role to a user by entering their email address and selecting the appropriate role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor_approver">Vendor Approver</SelectItem>
                    <SelectItem value="product_approver">Product Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddAdmin(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignRole}>
                  Assign Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">Admin Roles</TabsTrigger>
          <TabsTrigger value="support">Support Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Admin Roles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No admin roles assigned yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminRoles.map((role) => (
                      <TableRow key={role.user_id}>
                        <TableCell>
                          {role.profiles?.first_name || role.profiles?.last_name 
                            ? `${role.profiles.first_name || ''} ${role.profiles.last_name || ''}`.trim()
                            : 'Unknown User'
                          }
                        </TableCell>
                        <TableCell>{role.profiles?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(role.role)} text-white`}>
                          {role.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center space-x-1 text-sm text-gray-600">
                           <Calendar className="w-4 h-4" />
                           <span>{new Date(role.created_at).toLocaleDateString()}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={role.is_active ? "outline" : "default"}
                            onClick={() => handleToggleRole(role.user_id, role.is_active)}
                          >
                            {role.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteRole(role.user_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Support Requests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No support requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    supportRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.profiles?.first_name || request.profiles?.last_name 
                                ? `${request.profiles.first_name || ''} ${request.profiles.last_name || ''}`.trim()
                                : 'Unknown User'
                              }
                            </div>
                            <div className="text-sm text-gray-500">{request.profiles?.email}</div>
                          </div>
                        </TableCell>
                      <TableCell>{request.phone_number}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.message}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'pending' ? "secondary" : "default"}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateSupportRequest(request.id, 'contacted')}
                              >
                                Mark Contacted
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateSupportRequest(request.id, 'resolved')}
                              >
                                Resolve
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRoles;