import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, UserCheck, UserX, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [usersByCounty, setUsersByCounty] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchUsersByCounty();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, countyFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'customer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByCounty = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location')
        .eq('user_type', 'customer');

      if (error) throw error;

      const countyCounts: Record<string, number> = {};
      data?.forEach((profile) => {
        const county = profile.location || 'Unknown';
        countyCounts[county] = (countyCounts[county] || 0) + 1;
      });

      const countyData = Object.entries(countyCounts)
        .map(([county, count]) => ({ county, count }))
        .sort((a, b) => b.count - a.count);

      setUsersByCounty(countyData);
    } catch (error) {
      console.error('Error fetching users by county:', error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone_number?.includes(searchTerm) ||
        user.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // County filter
    if (countyFilter !== "all") {
      filtered = filtered.filter(user => (user.location || 'Unknown') === countyFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Status Updated",
        description: `User status has been updated to ${newStatus}.`
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const getUniqueCounties = () => {
    const counties = users.map(user => user.location).filter(Boolean);
    return [...new Set(counties)];
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage platform users and view statistics by county</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countyFilter} onValueChange={setCountyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="County" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {getUniqueCounties().map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCountyFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users by County Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Users by County</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {usersByCounty.map((item) => (
              <div
                key={item.county}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setCountyFilter(item.county)}
              >
                <div className="font-semibold text-lg">{item.county}</div>
                <div className="text-2xl font-bold text-blue-600">{item.count} users</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Users ({filteredUsers.length} of {users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.email?.split('@')[0] || 'N/A'
                    }
                  </TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.location || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.phone_number || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status || 'approved')}>
                      {user.status || 'approved'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString() 
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserDetailsOpen(true);
                        }}
                      >
                        View
                      </Button>
                      {user.status === 'approved' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUserStatusChange(user.id, 'suspended')}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUserStatusChange(user.id, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {users.length === 0 ? "No users found" : "No users match your filters"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Name:</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedUser.first_name && selectedUser.last_name 
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : 'Not provided'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Email:</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedUser.email || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Phone:</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedUser.phone_number || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Location:</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedUser.location || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Joined:</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedUser.created_at 
                      ? new Date(selectedUser.created_at).toLocaleDateString() 
                      : 'Unknown'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={getStatusBadgeVariant(selectedUser.status || 'approved')}>
                    {selectedUser.status || 'approved'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setUserDetailsOpen(false)}
                >
                  Close
                </Button>
                {selectedUser.status === 'approved' ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleUserStatusChange(selectedUser.id, 'suspended');
                      setUserDetailsOpen(false);
                    }}
                  >
                    Suspend User
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      handleUserStatusChange(selectedUser.id, 'approved');
                      setUserDetailsOpen(false);
                    }}
                  >
                    Approve User
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;