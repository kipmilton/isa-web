import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, Filter } from "lucide-react";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const AdminTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [responding, setResponding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data as SupportTicket[] || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !responseText.trim()) return;

    setResponding(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          response: responseText,
          status: 'resolved',
          responded_by: (await supabase.auth.getUser()).data.user?.id,
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Response sent!",
        description: "The user will be notified of your response."
      });

      setResponseText("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Error responding to ticket:', error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive"
      });
    } finally {
      setResponding(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Ticket status changed to ${status}`
      });

      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="text-center py-8">Loading tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">Manage customer support requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <Label>Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Label>Priority:</Label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{ticket.title}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>From: {ticket.profiles?.first_name} {ticket.profiles?.last_name} ({ticket.profiles?.email})</span>
                    <span>•</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                  <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{ticket.description}</p>
              
              {ticket.response && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Response</span>
                    <span className="text-xs text-green-600">
                      {ticket.responded_at && new Date(ticket.responded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-green-800">{ticket.response}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">{ticket.category}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {ticket.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Mark In Progress
                    </Button>
                  )}
                  
                  {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Respond
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Respond to Ticket</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Original Issue:</Label>
                            <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          </div>
                          <div>
                            <Label htmlFor="response">Your Response *</Label>
                            <Textarea
                              id="response"
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Write your response to help the user..."
                              className="min-h-[100px]"
                              required
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setSelectedTicket(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleRespond} disabled={responding || !responseText.trim()}>
                              {responding ? "Sending..." : "Send Response & Resolve"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {ticket.status === 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTicketStatus(ticket.id, 'closed')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {statusFilter !== "all" || priorityFilter !== "all" 
                ? "Try adjusting your filters" 
                : "No support tickets have been created yet"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;