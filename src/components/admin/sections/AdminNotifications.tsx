import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { NotificationService } from '@/services/notificationService';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  category: string;
  icon?: string;
}

const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    title: 'Welcome to MyPlug! 🎉',
    body: 'Thank you for joining our community. Start exploring amazing products!',
    category: 'marketing',
    icon: '🎉'
  },
  {
    id: 'flash_sale',
    name: 'Flash Sale Alert',
    title: 'Flash Sale! ⚡',
    body: 'Limited time offer! Get up to 70% off on selected items. Don\'t miss out!',
    category: 'marketing',
    icon: '⚡'
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    title: 'Your Order is on the Way! 📦',
    body: 'Great news! Your order has been shipped and is on its way to you.',
    category: 'order',
    icon: '📦'
  },
  {
    id: 'payment_success',
    name: 'Payment Success',
    title: 'Payment Successful! 💰',
    body: 'Your payment has been processed successfully. Thank you for your purchase!',
    category: 'payment',
    icon: '💰'
  },
  {
    id: 'new_message',
    name: 'New Message',
    title: 'New Message 💬',
    body: 'You have received a new message. Tap to read it now!',
    category: 'chat',
    icon: '💬'
  },
  {
    id: 'system_maintenance',
    name: 'System Maintenance',
    title: 'Scheduled Maintenance 🔧',
    body: 'We\'ll be performing scheduled maintenance. Some features may be temporarily unavailable.',
    category: 'system',
    icon: '🔧'
  }
];

export default function AdminNotifications() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('marketing');
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState({
    userType: 'all',
    location: '',
    lastActive: '7',
    subscriptionType: 'all'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    priority: 'normal',
    requireInteraction: false,
    silent: false,
    includeImage: false,
    imageUrl: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCustomTitle(template.title);
      setCustomBody(template.body);
      setSelectedCategory(template.category);
    }
  };

  const handleSendNotification = async () => {
    if (!customTitle.trim() || !customBody.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and body",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const notification = {
        title: customTitle,
        body: customBody,
        icon: notificationTemplates.find(t => t.id === selectedTemplate)?.icon,
        requireInteraction: notificationSettings.requireInteraction,
        silent: notificationSettings.silent,
        data: {
          category: selectedCategory,
          priority: notificationSettings.priority,
          admin_sent: true
        }
      };

      if (targetUsers.length > 0) {
        // Send to specific users
        await NotificationService.sendBulkNotification(targetUsers, notification);
        toast({
          title: "Success",
          description: `Notification sent to ${targetUsers.length} users`
        });
      } else {
        // Send to all users based on filter
        await NotificationService.sendTargetedNotification(
          {
            userType: userFilter.userType === 'all' ? undefined : userFilter.userType as any,
            location: userFilter.location || undefined,
            lastActive: userFilter.lastActive ? new Date(Date.now() - parseInt(userFilter.lastActive) * 24 * 60 * 60 * 1000) : undefined,
            subscriptionType: userFilter.subscriptionType === 'all' ? undefined : userFilter.subscriptionType
          },
          notification
        );
        toast({
          title: "Success",
          description: "Notification sent to filtered users"
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleNotification = async () => {
    if (!scheduledTime) {
      toast({
        title: "Error",
        description: "Please select a scheduled time",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const notification = {
        title: customTitle,
        body: customBody,
        data: {
          category: selectedCategory,
          priority: notificationSettings.priority,
          admin_sent: true
        }
      };

      const scheduledDate = new Date(scheduledTime);
      
      // For now, we'll just log the scheduled notification
      // In a real implementation, you'd store this in a database
      console.log('Scheduled notification:', {
        notification,
        scheduledTime: scheduledDate,
        targetUsers: targetUsers.length > 0 ? targetUsers : 'filtered'
      });

      toast({
        title: "Success",
        description: `Notification scheduled for ${scheduledDate.toLocaleString()}`
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Error",
        description: "Failed to schedule notification",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Notification Management</h2>
        <Badge variant="secondary">Admin Only</Badge>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compose Notification</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose New Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Notification Title</Label>
                  <Input
                    id="title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter notification title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Notification Body</Label>
                <Textarea
                  id="body"
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Enter notification message..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={notificationSettings.priority} onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireInteraction"
                    checked={notificationSettings.requireInteraction}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, requireInteraction: checked }))}
                  />
                  <Label htmlFor="requireInteraction">Require Interaction</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="silent"
                    checked={notificationSettings.silent}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, silent: checked }))}
                  />
                  <Label htmlFor="silent">Silent</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userType">User Type</Label>
                  <Select value={userFilter.userType} onValueChange={(value) => setUserFilter(prev => ({ ...prev, userType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="customer">Customers Only</SelectItem>
                      <SelectItem value="vendor">Vendors Only</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastActive">Last Active (Days)</Label>
                  <Select value={userFilter.lastActive} onValueChange={(value) => setUserFilter(prev => ({ ...prev, lastActive: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last 24 hours</SelectItem>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specificUsers">Specific User IDs (Optional)</Label>
                <Textarea
                  id="specificUsers"
                  placeholder="Enter user IDs separated by commas..."
                  onChange={(e) => setTargetUsers(e.target.value.split(',').map(id => id.trim()).filter(id => id))}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to send to all users matching the filter criteria above
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={handleSendNotification} 
              disabled={isSending}
              className="flex-1"
            >
              {isSending ? 'Sending...' : 'Send Now'}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="schedule"
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
              />
              <Label htmlFor="schedule">Schedule</Label>
            </div>
          </div>

          {isScheduled && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Notification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleScheduleNotification} 
                  disabled={isSending}
                  variant="outline"
                >
                  {isSending ? 'Scheduling...' : 'Schedule Notification'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notificationTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === template.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No scheduled notifications found. Schedule notifications will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
