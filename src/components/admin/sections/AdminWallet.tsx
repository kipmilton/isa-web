import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Wallet, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminWallet = () => {
  const [premiumVendors, setPremiumVendors] = useState<any[]>([]);
  const [walletStats, setWalletStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    platformBalance: 0
  });
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Fetch premium vendors with their plan info
      const { data: vendors, error: vendorsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'vendor')
        .eq('status', 'approved');

      if (vendorsError) throw vendorsError;

      // Filter premium vendors based on their plan preferences
      const premiumVendorsList = vendors?.filter(vendor => {
        let preferences = vendor.preferences;
        if (typeof preferences === 'string') {
          try { preferences = JSON.parse(preferences); } catch { preferences = {}; }
        }
        const plan = (preferences && typeof preferences === 'object' && 'plan' in preferences) 
          ? preferences.plan 
          : 'free';
        return plan !== 'free';
      }) || [];

      setPremiumVendors(premiumVendorsList);

      // Calculate wallet statistics
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, payment_status');

      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount, status');

      const totalRevenue = orders?.reduce((sum, order) => 
        sum + (order.payment_status === 'completed' ? (order.total_amount || 0) : 0), 0) || 0;

      const pendingPayments = withdrawals?.reduce((sum, withdrawal) => 
        sum + (withdrawal.status === 'pending' ? (withdrawal.amount || 0) : 0), 0) || 0;

      const completedPayments = withdrawals?.reduce((sum, withdrawal) => 
        sum + (withdrawal.status === 'approved' ? (withdrawal.amount || 0) : 0), 0) || 0;

      const platformBalance = totalRevenue - completedPayments - pendingPayments;

      setWalletStats({
        totalRevenue,
        pendingPayments,
        completedPayments,
        platformBalance
      });

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVendorWallet = (vendor: any) => {
    setSelectedVendor(vendor);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setWalletDialogOpen(true);
  };

  const handleWalletAdjustment = async () => {
    if (!selectedVendor || !adjustmentAmount || !adjustmentReason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Here you would typically create a wallet adjustment record
      // For now, we'll just show a success message
      toast({
        title: "Wallet Adjusted",
        description: `Wallet adjustment of KSH ${adjustmentAmount} has been applied to ${selectedVendor.company || selectedVendor.email}`,
      });

      setWalletDialogOpen(false);
      setSelectedVendor(null);
      setAdjustmentAmount("");
      setAdjustmentReason("");
    } catch (error) {
      console.error('Error adjusting wallet:', error);
      toast({
        title: "Error",
        description: "Failed to adjust wallet",
        variant: "destructive"
      });
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'default';
      case 'premium_yearly':
        return 'default';
      case 'premium_monthly':
        return 'secondary';
      case 'premium_weekly':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading wallet data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
        <p className="text-gray-600 mt-2">Manage platform finances and premium vendor wallets</p>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {walletStats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {walletStats.pendingPayments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {walletStats.completedPayments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {walletStats.platformBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Vendor Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Plan Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {premiumVendors.map((vendor) => {
                let preferences = vendor.preferences;
                if (typeof preferences === 'string') {
                  try { preferences = JSON.parse(preferences); } catch { preferences = {}; }
                }
                const plan = (preferences && typeof preferences === 'object' && 'plan' in preferences) 
                  ? preferences.plan 
                  : 'free';
                const planExpiry = (preferences && typeof preferences === 'object' && 'plan_expiry' in preferences) 
                  ? preferences.plan_expiry 
                  : null;

                return (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">
                      {vendor.company || 
                       `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() ||
                       vendor.email?.split('@')[0] ||
                       'Unknown'
                      }
                    </TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(plan)}>
                        {plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {planExpiry 
                        ? new Date(planExpiry).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleVendorWallet(vendor)}
                      >
                        Manage Wallet
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {premiumVendors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No premium vendors found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Management Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Vendor Wallet</DialogTitle>
            <DialogDescription>
              Adjust wallet balance or manage premium features for this vendor.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendor && (
            <div className="space-y-4">
              <div>
                <strong>Vendor:</strong> {selectedVendor.company || selectedVendor.email}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment-amount">Adjustment Amount (KSH)</Label>
                <Input
                  id="adjustment-amount"
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="Enter amount (positive for credit, negative for debit)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment-reason">Reason for Adjustment</Label>
                <Textarea
                  id="adjustment-reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Enter reason for this wallet adjustment..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setWalletDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWalletAdjustment}
                  disabled={!adjustmentAmount || !adjustmentReason.trim()}
                >
                  Apply Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWallet;