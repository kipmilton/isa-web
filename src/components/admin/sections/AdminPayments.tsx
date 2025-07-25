import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminPayments = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

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

      <Card>
        <CardHeader>
          <CardTitle>Vendor Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount (KSH)</TableHead>
                <TableHead>M-Pesa Number</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="font-medium">
                    {withdrawal.profiles?.company || 
                     `${withdrawal.profiles?.first_name || ''} ${withdrawal.profiles?.last_name || ''}`.trim() ||
                     withdrawal.profiles?.email?.split('@')[0] ||
                     'Unknown Vendor'
                    }
                  </TableCell>
                  <TableCell>
                    {withdrawal.amount?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell>
                    {withdrawal.mpesa_number}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {withdrawals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payment requests found
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Vendor:</strong> {selectedWithdrawal.profiles?.company || 
                   `${selectedWithdrawal.profiles?.first_name || ''} ${selectedWithdrawal.profiles?.last_name || ''}`.trim() ||
                   'Unknown'
                  }
                </div>
                <div>
                  <strong>Amount:</strong> KSH {selectedWithdrawal.amount?.toLocaleString()}
                </div>
                <div>
                  <strong>M-Pesa Number:</strong> {selectedWithdrawal.mpesa_number}
                </div>
                <div>
                  <strong>Request Date:</strong> {new Date(selectedWithdrawal.created_at).toLocaleDateString()}
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