import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminVendors = () => {
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<any[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVendorApplications();
  }, []);

  const fetchVendorApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch pending applications
      const { data: pending, error: pendingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'vendor')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Fetch approved vendors
      const { data: approved, error: approvedError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'vendor')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (approvedError) throw approvedError;

      // Fetch rejected applications
      const { data: rejected, error: rejectedError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'vendor')
        .eq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (rejectedError) throw rejectedError;

      setPendingApplications(pending || []);
      setApprovedVendors(approved || []);
      setRejectedApplications(rejected || []);
    } catch (error) {
      console.error('Error fetching vendor applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendor applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setViewDialogOpen(true);
    setActionType(null);
    setActionMessage("");
  };

  const handleVendorAction = async (action: 'approve' | 'reject') => {
    if (!selectedVendor) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: actionMessage
        })
        .eq('id', selectedVendor.id);

      if (error) throw error;

      // If approving, also call the RPC function to assign vendor role
      if (action === 'approve') {
        const { error: roleError } = await supabase.rpc('approve_vendor_application', {
          application_id: selectedVendor.id,
          admin_notes: actionMessage
        });
        
        if (roleError) {
          console.error('Error assigning vendor role:', roleError);
          // Don't throw here as the status was already updated
        }
      }

      toast({
        title: action === 'approve' ? 'Vendor Approved' : 'Vendor Rejected',
        description: `Vendor application has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      fetchVendorApplications();
      setViewDialogOpen(false);
      setSelectedVendor(null);
      setActionMessage("");
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive"
      });
    }
  };

  const VendorTable = ({ vendors, showActions = false }: { vendors: any[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company Name</TableHead>
          <TableHead>Representative</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Business Type</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Applied Date</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell className="font-medium">{vendor.company || 'N/A'}</TableCell>
            <TableCell>
              {vendor.first_name && vendor.last_name 
                ? `${vendor.first_name} ${vendor.last_name}`
                : vendor.email?.split('@')[0] || 'N/A'
              }
            </TableCell>
            <TableCell>{vendor.email || 'N/A'}</TableCell>
            <TableCell>{vendor.business_type || 'N/A'}</TableCell>
            <TableCell>{vendor.location || 'N/A'}</TableCell>
            <TableCell>
              {vendor.created_at 
                ? new Date(vendor.created_at).toLocaleDateString() 
                : 'N/A'
              }
            </TableCell>
            <TableCell>
              <Badge variant={
                vendor.status === 'approved' ? 'default' : 
                vendor.status === 'rejected' ? 'destructive' : 
                'secondary'
              }>
                {vendor.status}
              </Badge>
            </TableCell>
            {showActions && (
              <TableCell>
                <Button size="sm" onClick={() => handleViewVendor(vendor)}>
                  View
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading vendor applications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
        <p className="text-gray-600 mt-2">Review and manage vendor applications</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedVendors.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Vendor Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending applications
                </div>
              ) : (
                <VendorTable vendors={pendingApplications} showActions />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedVendors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No approved vendors
                </div>
              ) : (
                <VendorTable vendors={approvedVendors} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {rejectedApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No rejected applications
                </div>
              ) : (
                <VendorTable vendors={rejectedApplications} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vendor Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor Application Details</DialogTitle>
            <DialogDescription>
              Review vendor information and take action on the application.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Company:</strong> {selectedVendor.company || 'N/A'}
                </div>
                <div>
                  <strong>Business Type:</strong> {selectedVendor.business_type || 'N/A'}
                </div>
                <div>
                  <strong>Name:</strong> {selectedVendor.first_name} {selectedVendor.last_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedVendor.email}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedVendor.phone_number || 'N/A'}
                </div>
                <div>
                  <strong>Location:</strong> {selectedVendor.location || 'N/A'}
                </div>
                <div>
                  <strong>Tax ID/KRA PIN:</strong> {selectedVendor.tax_id || 'N/A'}
                </div>
                <div>
                  <strong>Website/Social Media Links:</strong> {selectedVendor.company_website || 'N/A'}
                </div>
              </div>
              
              <div>
                <strong>Application Date:</strong>{' '}
                {selectedVendor.created_at 
                  ? new Date(selectedVendor.created_at).toLocaleDateString() 
                  : 'N/A'
                }
              </div>

              {selectedVendor.admin_notes && (
                <div>
                  <strong>Admin Notes:</strong>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{selectedVendor.admin_notes}</p>
                </div>
              )}

              {/* Action Section for Pending Applications */}
              {selectedVendor.status === 'pending' && (
                <div className="border-t pt-4">
                  {actionType ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">
                          {actionType === 'approve' ? 'Approval' : 'Rejection'} Message:
                        </label>
                        <Textarea
                          value={actionMessage}
                          onChange={(e) => setActionMessage(e.target.value)}
                          placeholder={`Enter ${actionType === 'approve' ? 'approval' : 'rejection'} message...`}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVendorAction(actionType)}
                          variant={actionType === 'approve' ? 'default' : 'destructive'}
                        >
                          Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActionType(null);
                            setActionMessage("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setActionType('approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => setActionType('reject')}
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendors;