import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface DeliveryPersonnel {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  county: string;
  constituency: string;
  id_card_url: string;
  drivers_license_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const AdminDelivery = () => {
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonnel, setSelectedPersonnel] = useState<DeliveryPersonnel | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeliveryPersonnel();
  }, []);

  const fetchDeliveryPersonnel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching delivery personnel:', error);
        toast.error('Failed to fetch delivery personnel');
        return;
      }

      setDeliveryPersonnel(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch delivery personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (personnel: DeliveryPersonnel) => {
    try {
      setProcessing(true);
      const { error } = await supabase
        .from('delivery_personnel')
        .update({ 
          status: 'approved',
          admin_notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', personnel.id);

      if (error) {
        console.error('Error approving delivery personnel:', error);
        toast.error('Failed to approve application');
        return;
      }

      toast.success('Application approved successfully');
      fetchDeliveryPersonnel();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPersonnel || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const { error } = await supabase
        .from('delivery_personnel')
        .update({ 
          status: 'rejected',
          admin_notes: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPersonnel.id);

      if (error) {
        console.error('Error rejecting delivery personnel:', error);
        toast.error('Failed to reject application');
        return;
      }

      toast.success('Application rejected successfully');
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedPersonnel(null);
      fetchDeliveryPersonnel();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async (personnel: DeliveryPersonnel) => {
    try {
      setProcessing(true);
      const { error } = await supabase
        .from('delivery_personnel')
        .update({ 
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', personnel.id);

      if (error) {
        console.error('Error suspending delivery personnel:', error);
        toast.error('Failed to suspend delivery personnel');
        return;
      }

      toast.success('Delivery personnel suspended successfully');
      fetchDeliveryPersonnel();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to suspend delivery personnel');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openRejectDialog = (personnel: DeliveryPersonnel) => {
    setSelectedPersonnel(personnel);
    setIsRejectDialogOpen(true);
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingPersonnel = deliveryPersonnel.filter(p => p.status === 'pending');
  const approvedPersonnel = deliveryPersonnel.filter(p => p.status === 'approved');
  const rejectedPersonnel = deliveryPersonnel.filter(p => p.status === 'rejected');
  const suspendedPersonnel = deliveryPersonnel.filter(p => p.status === 'suspended');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manage Delivery Personnel</h2>
        <p className="text-muted-foreground">
          Review and manage delivery personnel applications
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingPersonnel.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedPersonnel.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedPersonnel.length})
          </TabsTrigger>
          <TabsTrigger value="suspended" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Suspended ({suspendedPersonnel.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingPersonnel.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No pending applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingPersonnel.map((personnel) => (
                <Card key={personnel.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {personnel.first_name} {personnel.last_name}
                        </CardTitle>
                        <CardDescription>{personnel.email}</CardDescription>
                      </div>
                      {getStatusBadge(personnel.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Phone:</strong> {personnel.phone_number}
                      </div>
                      <div>
                        <strong>Location:</strong> {personnel.county}, {personnel.constituency}
                      </div>
                      <div>
                        <strong>Applied:</strong> {new Date(personnel.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => downloadFile(personnel.id_card_url, `id_card_${personnel.id}.pdf`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ID Card
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadFile(personnel.drivers_license_url, `license_${personnel.id}.pdf`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Driver's License
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(personnel)}
                        disabled={processing}
                        className="flex-1"
                      >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openRejectDialog(personnel)}
                        disabled={processing}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedPersonnel.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No approved delivery personnel</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedPersonnel.map((personnel) => (
                <Card key={personnel.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {personnel.first_name} {personnel.last_name}
                        </CardTitle>
                        <CardDescription>{personnel.email}</CardDescription>
                      </div>
                      {getStatusBadge(personnel.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Phone:</strong> {personnel.phone_number}
                      </div>
                      <div>
                        <strong>Location:</strong> {personnel.county}, {personnel.constituency}
                      </div>
                      <div>
                        <strong>Approved:</strong> {new Date(personnel.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleSuspend(personnel)}
                      disabled={processing}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedPersonnel.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No rejected applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedPersonnel.map((personnel) => (
                <Card key={personnel.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {personnel.first_name} {personnel.last_name}
                        </CardTitle>
                        <CardDescription>{personnel.email}</CardDescription>
                      </div>
                      {getStatusBadge(personnel.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Phone:</strong> {personnel.phone_number}
                      </div>
                      <div>
                        <strong>Location:</strong> {personnel.county}, {personnel.constituency}
                      </div>
                      <div>
                        <strong>Rejected:</strong> {new Date(personnel.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {personnel.admin_notes && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <strong>Rejection Reason:</strong>
                        <p className="text-sm mt-1">{personnel.admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suspended" className="space-y-4">
          {suspendedPersonnel.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No suspended delivery personnel</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {suspendedPersonnel.map((personnel) => (
                <Card key={personnel.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {personnel.first_name} {personnel.last_name}
                        </CardTitle>
                        <CardDescription>{personnel.email}</CardDescription>
                      </div>
                      {getStatusBadge(personnel.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Phone:</strong> {personnel.phone_number}
                      </div>
                      <div>
                        <strong>Location:</strong> {personnel.county}, {personnel.constituency}
                      </div>
                      <div>
                        <strong>Suspended:</strong> {new Date(personnel.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleApprove(personnel)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reactivate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this delivery personnel application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDelivery; 