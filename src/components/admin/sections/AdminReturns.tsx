import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RotateCcw, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Package,
  User,
  MessageSquare,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface OrderReturn {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  return_type: 'replacement' | 'exchange' | 'refund';
  customer_message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
  responded_at?: string;
  orders?: {
    order_number: string;
    total_amount: number;
    customer_email: string;
    customer_phone?: string;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const AdminReturns = () => {
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<OrderReturn | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('order_returns')
        .select(`
          *,
          orders (
            order_number,
            total_amount,
            customer_email,
            customer_phone
          ),
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns((data as any) || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast({
        title: "Error",
        description: "Failed to load return requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processReturn = async (action: 'approve' | 'reject') => {
    if (!selectedReturn) return;

    try {
      const updates: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes,
        responded_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('order_returns')
        .update(updates)
        .eq('id', selectedReturn.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Return request ${action}d successfully`,
      });

      setShowProcessDialog(false);
      setSelectedReturn(null);
      setAdminNotes('');
      setProcessAction(null);
      fetchReturns();
    } catch (error) {
      console.error('Error processing return:', error);
      toast({
        title: "Error",
        description: "Failed to process return request",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500 text-white"><Package className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReturnTypeBadge = (type: string) => {
    const colors = {
      'replacement': 'bg-blue-100 text-blue-800',
      'exchange': 'bg-purple-100 text-purple-800',
      'refund': 'bg-green-100 text-green-800'
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredReturns = returns.filter(returnItem => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      returnItem.orders?.order_number.toLowerCase().includes(searchLower) ||
      returnItem.profiles?.email?.toLowerCase().includes(searchLower) ||
      returnItem.reason.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Return Management</h1>
        <p className="text-gray-600 mt-2">Manage customer return requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {returns.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {returns.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {returns.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RotateCcw className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by order number, customer email, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <div className="space-y-4">
        {filteredReturns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <RotateCcw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Return Requests</h3>
              <p className="text-gray-600">No return requests match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredReturns.map((returnItem) => (
            <Card key={returnItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Order #{returnItem.orders?.order_number}
                      </h3>
                      {getStatusBadge(returnItem.status)}
                      {getReturnTypeBadge(returnItem.return_type)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {returnItem.profiles?.first_name} {returnItem.profiles?.last_name}
                      </span>
                      <span>{returnItem.profiles?.email}</span>
                      <span>{format(new Date(returnItem.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {returnItem.orders?.total_amount && formatPrice(returnItem.orders.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Reason: </span>
                    <span className="text-gray-900">{returnItem.reason}</span>
                  </div>
                  {returnItem.customer_message && (
                    <div>
                      <span className="font-medium text-gray-700">Customer Message: </span>
                      <span className="text-gray-900">{returnItem.customer_message}</span>
                    </div>
                  )}
                  {returnItem.admin_notes && (
                    <div>
                      <span className="font-medium text-gray-700">Admin Notes: </span>
                      <span className="text-gray-900">{returnItem.admin_notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReturn(returnItem)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  {returnItem.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          setProcessAction('approve');
                          setShowProcessDialog(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(returnItem);
                          setProcessAction('reject');
                          setShowProcessDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Process Return Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === 'approve' ? 'Approve' : 'Reject'} Return Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Admin Notes</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  processAction === 'approve' 
                    ? "Add any notes about the approval (optional)..."
                    : "Explain why this return request is being rejected..."
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProcessDialog(false);
                  setAdminNotes('');
                  setProcessAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => processReturn(processAction!)}
                className={processAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {processAction === 'approve' ? 'Approve Return' : 'Reject Return'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Details Dialog */}
      <Dialog open={!!selectedReturn && !showProcessDialog} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Request Details</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Order Number</Label>
                  <p className="text-lg font-semibold">{selectedReturn.orders?.order_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Return Type</Label>
                  <div className="mt-1">{getReturnTypeBadge(selectedReturn.return_type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReturn.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Order Amount</Label>
                  <p className="text-lg font-semibold">
                    {selectedReturn.orders?.total_amount && formatPrice(selectedReturn.orders.total_amount)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Customer</Label>
                <p className="text-base">
                  {selectedReturn.profiles?.first_name} {selectedReturn.profiles?.last_name}
                </p>
                <p className="text-sm text-gray-600">{selectedReturn.profiles?.email}</p>
                {selectedReturn.orders?.customer_phone && (
                  <p className="text-sm text-gray-600">{selectedReturn.orders.customer_phone}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Return Reason</Label>
                <p className="text-base">{selectedReturn.reason}</p>
              </div>
              
              {selectedReturn.customer_message && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer Message</Label>
                  <p className="text-base">{selectedReturn.customer_message}</p>
                </div>
              )}
              
              {selectedReturn.admin_notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Admin Notes</Label>
                  <p className="text-base">{selectedReturn.admin_notes}</p>
                </div>
              )}
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Requested: {format(new Date(selectedReturn.created_at), 'MMM dd, yyyy HH:mm')}</span>
                {selectedReturn.responded_at && (
                  <span>Responded: {format(new Date(selectedReturn.responded_at), 'MMM dd, yyyy HH:mm')}</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReturns;