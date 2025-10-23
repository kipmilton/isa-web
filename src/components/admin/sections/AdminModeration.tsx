import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  User, 
  Calendar, 
  MessageSquare,
  Ban,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ChatModerationService, ModerationLog, UserViolation } from '@/services/chatModerationService';
import { toast } from 'sonner';

const AdminModeration = () => {
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [userViolations, setUserViolations] = useState<UserViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [filter, setFilter] = useState<'all' | 'blocked' | 'masked'>('all');
  const [violationFilter, setViolationFilter] = useState<string>('all');

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    setLoading(true);
    try {
      const [logs, violations] = await Promise.all([
        ChatModerationService.getModerationLogs(100, 0),
        loadAllUserViolations()
      ]);
      setModerationLogs(logs);
      setUserViolations(violations);
    } catch (error) {
      console.error('Error loading moderation data:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUserViolations = async (): Promise<UserViolation[]> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('user_violations')
        .select('*')
        .order('last_violation', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading user violations:', error);
      return [];
    }
  };

  const filteredLogs = moderationLogs.filter(log => {
    if (filter === 'all') return true;
    return log.action_taken === filter;
  });

  const filteredViolations = userViolations.filter(violation => {
    if (violationFilter === 'all') return true;
    return violation.violation_type === violationFilter;
  });

  const getViolationColor = (violationType: string) => {
    switch (violationType) {
      case 'phone_number': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-red-100 text-red-800';
      case 'url': return 'bg-orange-100 text-orange-800';
      case 'social_platform': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'blocked': return <Ban className="w-4 h-4 text-red-500" />;
      case 'masked': return <Eye className="w-4 h-4 text-yellow-500" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'masked': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Chat Moderation</h2>
        </div>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading moderation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Chat Moderation</h2>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Moderation Logs</TabsTrigger>
          <TabsTrigger value="violations">User Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All ({moderationLogs.length})
            </Button>
            <Button
              variant={filter === 'blocked' ? 'default' : 'outline'}
              onClick={() => setFilter('blocked')}
              size="sm"
            >
              Blocked ({moderationLogs.filter(l => l.action_taken === 'blocked').length})
            </Button>
            <Button
              variant={filter === 'masked' ? 'default' : 'outline'}
              onClick={() => setFilter('masked')}
              size="sm"
            >
              Masked ({moderationLogs.filter(l => l.action_taken === 'masked').length})
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredLogs.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No moderation logs found for the selected filter.
                </AlertDescription>
              </Alert>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action_taken)}
                        <Badge className={getActionColor(log.action_taken)}>
                          {log.action_taken.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Original Message:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {log.original_message}
                        </p>
                      </div>
                      {log.action_taken === 'masked' && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Masked Message:</p>
                          <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                            {log.moderated_message}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {log.violations.map((violation) => (
                          <Badge key={violation} className={getViolationColor(violation)}>
                            {violation.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={violationFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setViolationFilter('all')}
              size="sm"
            >
              All ({userViolations.length})
            </Button>
            <Button
              variant={violationFilter === 'phone_number' ? 'default' : 'outline'}
              onClick={() => setViolationFilter('phone_number')}
              size="sm"
            >
              Phone Numbers ({userViolations.filter(v => v.violation_type === 'phone_number').length})
            </Button>
            <Button
              variant={violationFilter === 'email' ? 'default' : 'outline'}
              onClick={() => setViolationFilter('email')}
              size="sm"
            >
              Emails ({userViolations.filter(v => v.violation_type === 'email').length})
            </Button>
            <Button
              variant={violationFilter === 'url' ? 'default' : 'outline'}
              onClick={() => setViolationFilter('url')}
              size="sm"
            >
              URLs ({userViolations.filter(v => v.violation_type === 'url').length})
            </Button>
            <Button
              variant={violationFilter === 'social_platform' ? 'default' : 'outline'}
              onClick={() => setViolationFilter('social_platform')}
              size="sm"
            >
              Social ({userViolations.filter(v => v.violation_type === 'social_platform').length})
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredViolations.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No user violations found for the selected filter.
                </AlertDescription>
              </Alert>
            ) : (
              filteredViolations.map((violation) => (
                <Card key={violation.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <Badge className={getViolationColor(violation.violation_type)}>
                          {violation.violation_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant={violation.is_suspended ? 'destructive' : 'secondary'}>
                          {violation.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(violation.last_violation), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">Violation Count:</span>
                          <Badge variant="outline">{violation.violation_count}</Badge>
                          <span className="font-medium">User ID:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {violation.user_id}
                        </code>
                      </div>
                      <div className="text-sm text-gray-600">
                        First violation: {format(new Date(violation.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getActionIcon(selectedLog.action_taken)}
                Moderation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-700 mb-2">Original Message:</p>
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="text-sm">{selectedLog.original_message}</p>
                </div>
              </div>
              
              {selectedLog.action_taken === 'masked' && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Masked Message:</p>
                  <div className="bg-yellow-50 p-3 rounded border">
                    <p className="text-sm">{selectedLog.moderated_message}</p>
                  </div>
                </div>
              )}
              
              <div>
                <p className="font-medium text-gray-700 mb-2">Violations Detected:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedLog.violations.map((violation) => (
                    <Badge key={violation} className={getViolationColor(violation)}>
                      {violation.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Action Taken:</p>
                  <Badge className={getActionColor(selectedLog.action_taken)}>
                    {selectedLog.action_taken.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Timestamp:</p>
                  <p>{format(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
