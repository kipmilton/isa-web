import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, DollarSign, Calendar, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminPayments = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    filterWithdrawals();
  }, [withdrawals, searchTerm, statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles!withdrawals_vendor_id_fkey (
            first_name,
            last_name,
            company,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = [...withdrawals];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(withdrawal =>
        withdrawal.profiles?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.mpesa_number?.includes(searchTerm) ||
        withdrawal.amount?.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(withdrawal => withdrawal.status === statusFilter);
    }

    setFilteredWithdrawals(filtered);
  };

  const handleWithdrawalAction = (withdrawal: any, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setActionNotes("");
    setActionDialogOpen(true);
  };

  const confirmWithdrawalAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    try {
      const updateData: any = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (actionNotes.trim()) {
        updateData.admin_notes = actionNotes.trim();
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updateData)
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      toast({
        title: actionType === 'approve' ? 'Payment Approved' : 'Payment Rejected',
        description: `Withdrawal request has been ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      setActionDialogOpen(false);
      setSelectedWithdrawal(null);
      setActionType(null);
      setActionNotes("");
      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal request",
        variant: "destructive"
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0).replace('KSh', 'Ksh');
  };

  const getPaymentStats = () => {
    const pending = withdrawals.filter(w => w.status === 'pending').length;
    const approved = withdrawals.filter(w => w.status === 'approved').length;
    const rejected = withdrawals.filter(w => w.status === 'rejected').length;
    const totalAmount = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    return { pending, approved, rejected, totalAmount };
  };

  const stats = getPaymentStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading payment requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-2">Review and process vendor payment requests</p>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withdrawals.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vendor Withdrawal Requests ({filteredWithdrawals.length} of {withdrawals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>M-Pesa Number</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-medium">
                        {withdrawal.profiles?.company || 
                         `${withdrawal.profiles?.first_name || ''} ${withdrawal.profiles?.last_name || ''}`.trim() ||
                         withdrawal.profiles?.email?.split('@')[0] ||
                         'Unknown Vendor'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {withdrawal.profiles?.email || 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{formatCurrency(withdrawal.amount)}</span>
                  </TableCell>
                  <TableCell>
                    {withdrawal.mpesa_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {withdrawal.created_at 
                      ? new Date(withdrawal.created_at).toLocaleDateString() 
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(withdrawal.status)}>
                      {withdrawal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {withdrawal.processed_at 
                      ? new Date(withdrawal.processed_at).toLocaleDateString() 
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleWithdrawalAction(withdrawal, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleWithdrawalAction(withdrawal, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {withdrawal.status !== 'pending' && (
                      <div className="text-xs text-gray-500">
                        {withdrawal.admin_notes && (
                          <p className="max-w-32 truncate" title={withdrawal.admin_notes}>
                            {withdrawal.admin_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {withdrawals.length === 0 ? "No payment requests found" : "No payments match your filters"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Payment Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'Confirm approval of this withdrawal request.'
                : 'Provide a reason for rejecting this withdrawal request.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Vendor:</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedWithdrawal.profiles?.company || 
                     `${selectedWithdrawal.profiles?.first_name || ''} ${selectedWithdrawal.profiles?.last_name || ''}`.trim() ||
                     'Unknown'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Amount:</span>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">M-Pesa Number:</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedWithdrawal.mpesa_number || 'N/A'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Request Date:</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedWithdrawal.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  {actionType === 'approve' ? 'Approval Notes (Optional):' : 'Rejection Reason:'}
                </label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? 'Enter any notes about this approval...' 
                    : 'Enter reason for rejection...'
                  }
                  rows={3}
                  required={actionType === 'reject'}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setActionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmWithdrawalAction}
                  variant={actionType === 'approve' ? 'default' : 'destructive'}
                  disabled={actionType === 'reject' && !actionNotes.trim()}
                >
                  {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;