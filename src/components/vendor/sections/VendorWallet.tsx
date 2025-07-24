import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, DollarSign, Clock, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  mpesa_number: string;
  created_at: string;
  processed_at?: string;
}

interface VendorWalletProps {
  vendorId: string;
}

const VendorWallet = ({ vendorId }: VendorWalletProps) => {
  const [balance, setBalance] = useState({ available: 5420.50, pending: 1250.00 });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletData();
    fetchWithdrawals();
  }, [vendorId]);

  const fetchWalletData = async () => {
    // In a real app, this would fetch from your backend
    // For now, using mock data
    setBalance({ available: 5420.50, pending: 1250.00 });
  };

  const fetchWithdrawals = async () => {
    // Mock withdrawal data
    const mockWithdrawals: Withdrawal[] = [
      {
        id: '1',
        amount: 2500.00,
        status: 'completed',
        mpesa_number: '254712345678',
        created_at: '2024-01-15T10:30:00Z',
        processed_at: '2024-01-15T11:45:00Z'
      },
      {
        id: '2',
        amount: 1800.00,
        status: 'pending',
        mpesa_number: '254712345678',
        created_at: '2024-01-20T14:20:00Z'
      }
    ];
    setWithdrawals(mockWithdrawals);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive"
      });
      return;
    }

    if (amount > balance.available) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough available balance for this withdrawal.",
        variant: "destructive"
      });
      return;
    }

    if (!mpesaNumber || mpesaNumber.length < 10) {
      toast({
        title: "Invalid M-Pesa Number",
        description: "Please enter a valid M-Pesa number.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would call your backend API
    const newWithdrawal: Withdrawal = {
      id: Date.now().toString(),
      amount,
      status: 'pending',
      mpesa_number: mpesaNumber,
      created_at: new Date().toISOString()
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);
    setBalance(prev => ({
      ...prev,
      available: prev.available - amount,
      pending: prev.pending + amount
    }));

    setWithdrawAmount("");
    setIsWithdrawDialogOpen(false);

    toast({
      title: "Withdrawal Initiated",
      description: `Your withdrawal of KES ${amount.toLocaleString()} has been submitted for processing.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
      
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {balance.available.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for withdrawal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              KES {balance.pending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Processing withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Withdrawal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Available for withdrawal: <span className="font-medium">KES {balance.available.toLocaleString()}</span>
              </p>
              <p className="text-xs text-gray-500">
                Withdrawals are processed within 24 hours during business days.
              </p>
            </div>
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2" disabled={balance.available <= 0}>
                  <Download className="h-4 w-4" />
                  <span>Withdraw Funds</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      max={balance.available}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesa">M-Pesa Number</Label>
                    <Input
                      id="mpesa"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="254712345678"
                    />
                  </div>
                  <Button onClick={handleWithdraw} className="w-full">
                    Initiate Withdrawal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No withdrawals yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>M-Pesa Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">
                      KES {withdrawal.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{withdrawal.mpesa_number}</TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>
                      {format(new Date(withdrawal.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {withdrawal.processed_at 
                        ? format(new Date(withdrawal.processed_at), 'MMM dd, yyyy HH:mm')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorWallet;