import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Download
} from "lucide-react";

interface VendorApplicationData {
  accountType: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  otherBusinessType?: string;
  description: string;
  location: {
    county: string;
    constituency: string;
  };
  documents: {
    idCard?: string;
    businessCert?: string;
    pinCert?: string;
    bankDetails: string;
  };
}

interface TrainingProgress {
  module_id: string;
  is_completed: boolean;
  completed_at?: string;
  training_modules?: {
    title: string;
    module_order: number;
  };
}

const AdminVendors = () => {
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<any[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorApplicationData, setVendorApplicationData] = useState<VendorApplicationData | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
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
      
      // Fetch pending applications with application steps data
      const { data: pending, error: pendingError } = await supabase
        .from('profiles')
        .select(`
          *,
          vendor_application_steps (
            step_name,
            step_data,
            is_completed,
            completed_at
          )
        `)
        .eq('user_type', 'vendor')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      // Fetch approved vendors
      const { data: approved, error: approvedError } = await supabase
        .from('profiles')
        .select(`
          *,
          vendor_application_steps (
            step_name,
            step_data,
            is_completed,
            completed_at
          )
        `)
        .eq('user_type', 'vendor')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (approvedError) throw approvedError;

      // Fetch rejected applications
      const { data: rejected, error: rejectedError } = await supabase
        .from('profiles')
        .select(`
          *,
          vendor_application_steps (
            step_name,
            step_data,
            is_completed,
            completed_at
          )
        `)
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

  const handleViewVendor = async (vendor: any) => {
    setSelectedVendor(vendor);
    setViewDialogOpen(true);
    setActionType(null);
    setActionMessage("");

    try {
      // Fetch vendor application form data
      const { data: applicationData } = await supabase
        .from('vendor_application_steps')
        .select('step_data')
        .eq('user_id', vendor.id)
        .eq('step_name', 'application_form')
        .single();

      if (applicationData?.step_data) {
        setVendorApplicationData(applicationData.step_data as unknown as VendorApplicationData);
      }

      // Fetch training progress
      const { data: trainingData } = await supabase
        .from('user_training_progress')
        .select(`
          *,
          training_modules (
            title,
            module_order
          )
        `)
        .eq('user_id', vendor.id)
        .order('created_at', { ascending: true });

      setTrainingProgress(trainingData || []);
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    }
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

  const getOnboardingProgress = (vendor: any) => {
    const applicationCompleted = vendor.vendor_application_steps?.some(
      (step: any) => step.step_name === 'application_form' && step.is_completed
    );
    const trainingCompleted = vendor.vendor_application_steps?.some(
      (step: any) => step.step_name === 'training_completed' && step.is_completed
    );

    if (applicationCompleted && trainingCompleted) return 100;
    if (applicationCompleted) return 50;
    return 0;
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
          <TableHead>Onboarding Progress</TableHead>
          <TableHead>Applied Date</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => {
          // Get application data from vendor's application steps
          const applicationStep = vendor.vendor_application_steps?.find(
            (step: any) => step.step_name === 'application_form'
          );
          const applicationData = applicationStep?.step_data;
          
          return (
            <TableRow key={vendor.id}>
              <TableCell className="font-medium">
                {vendor.company || applicationData?.businessName || 'N/A'}
              </TableCell>
              <TableCell>
                {vendor.first_name && vendor.last_name 
                  ? `${vendor.first_name} ${vendor.last_name}`
                  : applicationData?.contactPerson || vendor.email?.split('@')[0] || 'N/A'
                }
              </TableCell>
              <TableCell>{vendor.email || 'N/A'}</TableCell>
              <TableCell>
                {vendor.business_type || applicationData?.businessType || 'N/A'}
                {applicationData?.otherBusinessType && (
                  <div className="text-xs text-gray-500">
                    ({applicationData.otherBusinessType})
                  </div>
                )}
              </TableCell>
              <TableCell>
                {vendor.location || 
                 (applicationData?.location ? 
                  `${applicationData.location.county}, ${applicationData.location.constituency}` : 
                  'N/A')}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Progress value={getOnboardingProgress(vendor)} className="w-16" />
                  <span className="text-xs">{getOnboardingProgress(vendor)}%</span>
                </div>
              </TableCell>
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
                    View Details
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
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
        <p className="text-gray-600 mt-2">Review and manage vendor applications with comprehensive onboarding data</p>
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

      {/* Enhanced Vendor Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Application Details</DialogTitle>
            <DialogDescription>
              Comprehensive review of vendor application, onboarding progress, and supporting documents.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendor && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="application">Application Form</TabsTrigger>
                <TabsTrigger value="training">Training Progress</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <strong>Company:</strong> {selectedVendor.company || vendorApplicationData?.businessName || 'N/A'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <strong>Representative:</strong> {selectedVendor.first_name} {selectedVendor.last_name}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <strong>Email:</strong> {selectedVendor.email}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <strong>Phone:</strong> {selectedVendor.phone_number || vendorApplicationData?.phone || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <strong>Business Type:</strong> {selectedVendor.business_type || vendorApplicationData?.businessType || 'N/A'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <strong>Location:</strong> {selectedVendor.location || 
                        (vendorApplicationData?.location ? 
                          `${vendorApplicationData.location.county}, ${vendorApplicationData.location.constituency}` : 
                          'N/A')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <strong>Applied:</strong> {selectedVendor.created_at 
                        ? new Date(selectedVendor.created_at).toLocaleDateString() 
                        : 'N/A'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <strong>Status:</strong> 
                      <Badge variant={
                        selectedVendor.status === 'approved' ? 'default' : 
                        selectedVendor.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }>
                        {selectedVendor.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedVendor.admin_notes && (
                  <div className="border-t pt-4">
                    <strong>Admin Notes:</strong>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{selectedVendor.admin_notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="application" className="space-y-4">
                {vendorApplicationData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Account Type:</strong>
                        <p className="text-sm text-gray-600 capitalize">{vendorApplicationData.accountType}</p>
                      </div>
                      <div>
                        <strong>Business Name:</strong>
                        <p className="text-sm text-gray-600">{vendorApplicationData.businessName}</p>
                      </div>
                      <div>
                        <strong>Contact Person:</strong>
                        <p className="text-sm text-gray-600">{vendorApplicationData.contactPerson}</p>
                      </div>
                      <div>
                        <strong>Email:</strong>
                        <p className="text-sm text-gray-600">{vendorApplicationData.email}</p>
                      </div>
                      <div>
                        <strong>Phone:</strong>
                        <p className="text-sm text-gray-600">{vendorApplicationData.phone}</p>
                      </div>
                      <div>
                        <strong>Business Type:</strong>
                        <p className="text-sm text-gray-600">
                          {vendorApplicationData.businessType}
                          {vendorApplicationData.otherBusinessType && (
                            <span className="text-xs text-gray-500 block">
                              ({vendorApplicationData.otherBusinessType})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <strong>Location:</strong>
                        <p className="text-sm text-gray-600">
                          {vendorApplicationData.location.county}, {vendorApplicationData.location.constituency}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <strong>Business Description:</strong>
                      <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {vendorApplicationData.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Application form data not available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="training" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Training Progress</h3>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={trainingProgress.filter(t => t.is_completed).length / Math.max(trainingProgress.length, 1) * 100} 
                        className="w-32" 
                      />
                      <span className="text-sm">
                        {trainingProgress.filter(t => t.is_completed).length} of {trainingProgress.length} modules
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {trainingProgress.map((progress) => (
                      <div key={progress.module_id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          {progress.is_completed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            Module {progress.training_modules?.module_order}: {progress.training_modules?.title}
                          </span>
                        </div>
                        <Badge variant={progress.is_completed ? "default" : "secondary"}>
                          {progress.is_completed ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {vendorApplicationData?.documents ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {vendorApplicationData.documents.idCard && (
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>National ID / Passport</span>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={vendorApplicationData.documents.idCard} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {vendorApplicationData.documents.businessCert && (
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>Certificate of Incorporation</span>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={vendorApplicationData.documents.businessCert} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {vendorApplicationData.documents.pinCert && (
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>PIN/VAT Certificate</span>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={vendorApplicationData.documents.pinCert} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      <div className="p-3 border rounded">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <strong>Bank Account Details</strong>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {vendorApplicationData.documents.bankDetails}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Document information not available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Action Section for Pending Applications */}
          {selectedVendor && selectedVendor.status === 'pending' && (
            <div className="border-t pt-4 mt-4">
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendors;