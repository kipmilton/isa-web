import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SupportTicket {
  id: string;
  request_type: string;
  phone_number: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface VendorSupportProps {
  vendorId: string;
}

const VendorSupport = ({ vendorId }: VendorSupportProps) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [vendorId]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_requests')
        .select('*')
        .eq('user_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500"><MessageCircle className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tickets...</div>;
  }

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Support Tickets</h3>
            <p className="text-gray-600">You haven't raised any support tickets yet.</p>
          </CardContent>
        </Card>
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {ticket.request_type.replace(/_/g, ' ').toUpperCase()}
                </CardTitle>
                {getStatusBadge(ticket.status)}
              </div>
              <p className="text-sm text-gray-500">
                Created: {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-sm">Phone:</span>
                  <span className="text-sm ml-2">{ticket.phone_number}</span>
                </div>
                <div>
                  <span className="font-medium text-sm">Message:</span>
                  <p className="text-sm text-gray-700 mt-1">{ticket.message}</p>
                </div>
                <div className="text-xs text-gray-500 pt-2">
                  Last updated: {format(new Date(ticket.updated_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default VendorSupport;
