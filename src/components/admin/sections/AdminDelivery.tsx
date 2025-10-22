import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeliveryPersonnel } from "@/types/delivery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Loader2,
  AlertCircle,
  DollarSign,
  MapPin,
  Settings
} from "lucide-react";
import { toast } from "sonner";


interface County {
  id: string;
  name: string;
  is_hotspot: boolean;
}

interface Constituency {
  id: string;
  name: string;
  county_id: string;
}

interface Ward {
  id: string;
  name: string;
  constituency_id: string;
}

interface DeliveryCost {
  id: string;
  base_cost: number;
  is_active: boolean;
}

interface CountyCost {
  id: string;
  from_county_id: string;
  to_county_id: string;
  cost: number;
  is_active: boolean;
}

const AdminDelivery = () => {
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonnel, setSelectedPersonnel] = useState<DeliveryPersonnel | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Delivery cost management state
  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [baseCost, setBaseCost] = useState<DeliveryCost | null>(null);
  const [countyCosts, setCountyCosts] = useState<CountyCost[]>([]);
  const [selectedFromCounty, setSelectedFromCounty] = useState("");
  const [selectedToCounty, setSelectedToCounty] = useState("");
  const [selectedFromConstituency, setSelectedFromConstituency] = useState("");
  const [selectedToConstituency, setSelectedToConstituency] = useState("");
  const [selectedFromWard, setSelectedFromWard] = useState("");
  const [selectedToWard, setSelectedToWard] = useState("");
  const [costValue, setCostValue] = useState("");
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [costType, setCostType] = useState<"base" | "county" | "constituency" | "ward">("base");

  useEffect(() => {
    fetchDeliveryPersonnel();
    fetchDeliveryCostData();
  }, []);

  const fetchDeliveryCostData = async () => {
    try {
      // Fetch counties
      const { data: countiesData } = await supabase
        .from('counties')
        .select('*')
        .order('name');
      setCounties(countiesData || []);

      // Fetch constituencies
      const { data: constituenciesData } = await supabase
        .from('constituencies')
        .select('*')
        .order('name');
      setConstituencies(constituenciesData || []);

      // Fetch wards
      const { data: wardsData } = await supabase
        .from('wards')
        .select('*')
        .order('name');
      setWards(wardsData || []);

      // Fetch base cost
      const { data: baseCostData } = await supabase
        .from('delivery_base_cost')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      setBaseCost(baseCostData?.[0] || null);

      // Fetch county costs
      const { data: countyCostsData } = await supabase
        .from('delivery_county_costs')
        .select(`
          *,
          from_county:counties!from_county_id(name),
          to_county:counties!to_county_id(name)
        `)
        .eq('is_active', true);
      setCountyCosts(countyCostsData || []);
    } catch (error) {
      console.error('Error fetching delivery cost data:', error);
      toast.error('Failed to fetch delivery cost data');
    }
  };

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

      setDeliveryPersonnel((data || []) as DeliveryPersonnel[]);
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

  // Delivery cost management functions
  const handleUpdateBaseCost = async () => {
    if (!costValue || isNaN(Number(costValue))) {
      toast.error('Please enter a valid cost amount');
      return;
    }

    try {
      setProcessing(true);
      const { error } = await supabase
        .from('delivery_base_cost')
        .update({ is_active: false })
        .eq('is_active', true);

      if (error) throw error;

      const { error: insertError } = await supabase
        .from('delivery_base_cost')
        .insert({ base_cost: Number(costValue) });

      if (insertError) throw insertError;

      toast.success('Base cost updated successfully');
      setCostValue("");
      setIsCostDialogOpen(false);
      fetchDeliveryCostData();
    } catch (error) {
      console.error('Error updating base cost:', error);
      toast.error('Failed to update base cost');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateCountyCost = async () => {
    if (!selectedFromCounty || !selectedToCounty || !costValue || isNaN(Number(costValue))) {
      toast.error('Please select counties and enter a valid cost amount');
      return;
    }

    try {
      setProcessing(true);
      const { error } = await supabase
        .from('delivery_county_costs')
        .upsert({
          from_county_id: selectedFromCounty,
          to_county_id: selectedToCounty,
          cost: Number(costValue),
          is_active: true
        });

      if (error) throw error;

      toast.success('County cost updated successfully');
      setCostValue("");
      setSelectedFromCounty("");
      setSelectedToCounty("");
      setIsCostDialogOpen(false);
      fetchDeliveryCostData();
    } catch (error) {
      console.error('Error updating county cost:', error);
      toast.error('Failed to update county cost');
    } finally {
      setProcessing(false);
    }
  };

  const openCostDialog = (type: "base" | "county" | "constituency" | "ward") => {
    setCostType(type);
    setCostValue("");
    setSelectedFromCounty("");
    setSelectedToCounty("");
    setSelectedFromConstituency("");
    setSelectedToConstituency("");
    setSelectedFromWard("");
    setSelectedToWard("");
    setIsCostDialogOpen(true);
  };

  const getFilteredConstituencies = (countyId: string) => {
    return constituencies.filter(c => c.county_id === countyId);
  };

  const getFilteredWards = (constituencyId: string) => {
    return wards.filter(w => w.constituency_id === constituencyId);
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
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Delivery Costs
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

        <TabsContent value="costs" className="space-y-6">
          <div className="grid gap-6">
            {/* Base Cost Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Base Delivery Cost
                </CardTitle>
                <CardDescription>
                  Set the base cost for all deliveries (currently: Ksh {baseCost?.base_cost || 200})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-green-600">
                    Ksh {baseCost?.base_cost || 200}
                  </div>
                  <Button onClick={() => openCostDialog("base")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Update Base Cost
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* County Cost Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  County-to-County Costs
                </CardTitle>
                <CardDescription>
                  Set delivery costs between different counties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={() => openCostDialog("county")}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Add/Update County Cost
                    </Button>
                  </div>
                  
                  {countyCosts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Current County Costs:</h4>
                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        {countyCosts.map((cost) => (
                          <div key={cost.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {(cost as any).from_county?.name} → {(cost as any).to_county?.name}
                              </span>
                            </div>
                            <div className="text-green-600 font-bold">
                              Ksh {cost.cost}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Constituency Cost Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Constituency-to-Constituency Costs
                </CardTitle>
                <CardDescription>
                  Set delivery costs between constituencies within counties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={() => openCostDialog("constituency")}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Add/Update Constituency Cost
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: Constituency costs are added to county costs for final calculation
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ward Cost Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ward-to-Ward Costs (Hotspot Areas)
                </CardTitle>
                <CardDescription>
                  Set delivery costs between wards in hotspot areas (Nairobi, Kiambu, Machakos, Kajiado)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={() => openCostDialog("ward")}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Add/Update Ward Cost
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: Ward costs are only applicable for hotspot areas and are added to county and constituency costs
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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

      {/* Cost Management Dialog */}
      <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {costType === "base" && "Update Base Cost"}
              {costType === "county" && "Set County Cost"}
              {costType === "constituency" && "Set Constituency Cost"}
              {costType === "ward" && "Set Ward Cost"}
            </DialogTitle>
            <DialogDescription>
              {costType === "base" && "Set the base delivery cost for all deliveries"}
              {costType === "county" && "Set delivery cost between two counties"}
              {costType === "constituency" && "Set delivery cost between two constituencies"}
              {costType === "ward" && "Set delivery cost between two wards"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {costType === "base" && (
              <div>
                <Label htmlFor="base-cost">Base Cost (Ksh)</Label>
                <Input
                  id="base-cost"
                  type="number"
                  placeholder="200"
                  value={costValue}
                  onChange={(e) => setCostValue(e.target.value)}
                />
              </div>
            )}

            {costType === "county" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="from-county">From County</Label>
                  <Select value={selectedFromCounty} onValueChange={setSelectedFromCounty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county.id} value={county.id}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="to-county">To County</Label>
                  <Select value={selectedToCounty} onValueChange={setSelectedToCounty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county.id} value={county.id}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="county-cost">Cost (Ksh)</Label>
                  <Input
                    id="county-cost"
                    type="number"
                    placeholder="50"
                    value={costValue}
                    onChange={(e) => setCostValue(e.target.value)}
                  />
                </div>
              </div>
            )}

            {costType === "constituency" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="from-county-const">From County</Label>
                  <Select value={selectedFromCounty} onValueChange={(value) => {
                    setSelectedFromCounty(value);
                    setSelectedFromConstituency("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county.id} value={county.id}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="from-constituency">From Constituency</Label>
                  <Select 
                    value={selectedFromConstituency} 
                    onValueChange={setSelectedFromConstituency}
                    disabled={!selectedFromCounty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredConstituencies(selectedFromCounty).map((constituency) => (
                        <SelectItem key={constituency.id} value={constituency.id}>
                          {constituency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="to-county-const">To County</Label>
                  <Select value={selectedToCounty} onValueChange={(value) => {
                    setSelectedToCounty(value);
                    setSelectedToConstituency("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county.id} value={county.id}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="to-constituency">To Constituency</Label>
                  <Select 
                    value={selectedToConstituency} 
                    onValueChange={setSelectedToConstituency}
                    disabled={!selectedToCounty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredConstituencies(selectedToCounty).map((constituency) => (
                        <SelectItem key={constituency.id} value={constituency.id}>
                          {constituency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="constituency-cost">Cost (Ksh)</Label>
                  <Input
                    id="constituency-cost"
                    type="number"
                    placeholder="25"
                    value={costValue}
                    onChange={(e) => setCostValue(e.target.value)}
                  />
                </div>
              </div>
            )}

            {costType === "ward" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="from-county-ward">From County</Label>
                  <Select value={selectedFromCounty} onValueChange={(value) => {
                    setSelectedFromCounty(value);
                    setSelectedFromConstituency("");
                    setSelectedFromWard("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.filter(c => c.is_hotspot).map((county) => (
                        <SelectItem key={county.id} value={county.id}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="from-constituency-ward">From Constituency</Label>
                  <Select 
                    value={selectedFromConstituency} 
                    onValueChange={(value) => {
                      setSelectedFromConstituency(value);
                      setSelectedFromWard("");
                    }}
                    disabled={!selectedFromCounty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredConstituencies(selectedFromCounty).map((constituency) => (
                        <SelectItem key={constituency.id} value={constituency.id}>
                          {constituency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="from-ward">From Ward</Label>
                  <Select 
                    value={selectedFromWard} 
                    onValueChange={setSelectedFromWard}
                    disabled={!selectedFromConstituency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredWards(selectedFromConstituency).map((ward) => (
                        <SelectItem key={ward.id} value={ward.id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="to-county-ward">To County</Label>
                  <Select value={selectedToCounty} onValueChange={(value) => {
                    setSelectedToCounty(value);
                    setSelectedToConstituency("");
                    setSelectedToWard("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.filter(c => c.is_hotspot).map((county) => (
                        <SelectItem key={county.id} value={county.id}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="to-constituency-ward">To Constituency</Label>
                  <Select 
                    value={selectedToConstituency} 
                    onValueChange={(value) => {
                      setSelectedToConstituency(value);
                      setSelectedToWard("");
                    }}
                    disabled={!selectedToCounty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select constituency" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredConstituencies(selectedToCounty).map((constituency) => (
                        <SelectItem key={constituency.id} value={constituency.id}>
                          {constituency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="to-ward">To Ward</Label>
                  <Select 
                    value={selectedToWard} 
                    onValueChange={setSelectedToWard}
                    disabled={!selectedToConstituency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredWards(selectedToConstituency).map((ward) => (
                        <SelectItem key={ward.id} value={ward.id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="ward-cost">Cost (Ksh)</Label>
                  <Input
                    id="ward-cost"
                    type="number"
                    placeholder="10"
                    value={costValue}
                    onChange={(e) => setCostValue(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCostDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (costType === "base") handleUpdateBaseCost();
                else if (costType === "county") handleUpdateCountyCost();
                // TODO: Add constituency and ward cost handlers
              }}
              disabled={processing || !costValue}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              {costType === "base" ? "Update Base Cost" : "Set Cost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDelivery; 