import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  Shield, 
  Users, 
  MessageSquare, 
  Download, 
  Upload,
  Trash2,
  Settings,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'message' | 'system' | 'security' | 'network' | 'file' | 'user';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

interface NotificationSystemProps {
  className?: string;
}

export function NotificationSystem({ className }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'message' | 'system' | 'security'>('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { toast } = useToast();

  // Generate sample notifications for demonstration
  useEffect(() => {
    const generateNotifications = () => {
      const newNotification: Notification = {
        id: `notification_${Date.now()}`,
        type: Math.random() > 0.5 ? 'message' : 'system',
        title: Math.random() > 0.5 ? 'New Message' : 'System Alert',
        message: Math.random() > 0.5 ? 'You have a new message from CyberNode_Alpha' : 'Network topology updated',
        timestamp: new Date(),
        isRead: false,
        priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        source: `Node_${Math.floor(Math.random() * 100)}`,
        actions: [
          {
            label: 'View',
            action: () => console.log('View action'),
            variant: 'default'
          },
          {
            label: 'Dismiss',
            action: () => console.log('Dismiss action'),
            variant: 'outline'
          }
        ]
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    };

    // Create initial notifications
    const initialNotifications: Notification[] = [
      {
        id: 'notif_1',
        type: 'message',
        title: 'New Message',
        message: 'CyberNode_Alpha sent you a message: "Ready for secure data exchange"',
        timestamp: new Date(Date.now() - 300000),
        isRead: false,
        priority: 'high',
        source: 'CyberNode_Alpha',
        actions: [
          {
            label: 'Reply',
            action: () => toast({ title: 'Opening chat...' }),
            variant: 'default'
          },
          {
            label: 'Mark Read',
            action: () => markAsRead('notif_1'),
            variant: 'outline'
          }
        ]
      },
      {
        id: 'notif_2',
        type: 'system',
        title: 'Network Update',
        message: 'New node SecureNode_Beta joined the mesh network',
        timestamp: new Date(Date.now() - 600000),
        isRead: true,
        priority: 'medium',
        source: 'MeshRouter',
        actions: [
          {
            label: 'View Network',
            action: () => toast({ title: 'Opening network view...' }),
            variant: 'default'
          }
        ]
      },
      {
        id: 'notif_3',
        type: 'security',
        title: 'Security Alert',
        message: 'Suspicious connection attempt detected and blocked',
        timestamp: new Date(Date.now() - 900000),
        isRead: false,
        priority: 'urgent',
        source: 'SecurityMonitor',
        actions: [
          {
            label: 'Investigate',
            action: () => toast({ title: 'Opening security logs...' }),
            variant: 'destructive'
          }
        ]
      },
      {
        id: 'notif_4',
        type: 'file',
        title: 'File Transfer Complete',
        message: 'mesh_protocol.pdf (2.5MB) downloaded successfully',
        timestamp: new Date(Date.now() - 1200000),
        isRead: true,
        priority: 'low',
        source: 'FileTransfer',
        actions: [
          {
            label: 'Open File',
            action: () => toast({ title: 'Opening file...' }),
            variant: 'default'
          }
        ]
      },
      {
        id: 'notif_5',
        type: 'network',
        title: 'Connection Quality',
        message: 'Connection to DataNode_Gamma degraded to poor quality',
        timestamp: new Date(Date.now() - 1800000),
        isRead: false,
        priority: 'medium',
        source: 'ConnectionManager'
      }
    ];

    setNotifications(initialNotifications);

    // Simulate periodic notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        generateNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    toast({
      title: "All notifications marked as read",
      description: "Your notification list has been cleared",
    });
  }, [toast]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    toast({
      title: "All notifications cleared",
      description: "Your notification history has been cleared",
    });
  }, [toast]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'system': return Info;
      case 'security': return Shield;
      case 'network': return Users;
      case 'file': return Download;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-[var(--cyber-cyan)]';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={cn("w-full max-w-4xl mx-auto p-4 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-[var(--cyber-cyan)]" />
          <div>
            <h2 className="text-2xl font-bold text-[var(--cyber-cyan)]">Notifications</h2>
            <p className="text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={cn(
              "h-8 w-8 p-0",
              notificationsEnabled ? "text-[var(--cyber-green)]" : "text-gray-400"
            )}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="text-red-500 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="message">Messages</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <Card className="glass-morphism">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No notifications</p>
                    <p className="text-sm mt-2">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--cyber-cyan)]/10">
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 hover:bg-[var(--cyber-cyan)]/5 transition-colors",
                            !notification.isRead && "bg-[var(--cyber-cyan)]/5 border-l-4 border-[var(--cyber-cyan)]"
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-full",
                              notification.priority === 'urgent' ? "bg-red-500/20" :
                              notification.priority === 'high' ? "bg-orange-500/20" :
                              notification.priority === 'medium' ? "bg-[var(--cyber-cyan)]/20" :
                              "bg-gray-500/20"
                            )}>
                              <Icon className={cn("w-5 h-5", getPriorityColor(notification.priority))} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium text-white">{notification.title}</h3>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      notification.priority === 'urgent' ? "border-red-500 text-red-500" :
                                      notification.priority === 'high' ? "border-orange-500 text-orange-500" :
                                      notification.priority === 'medium' ? "border-[var(--cyber-cyan)] text-[var(--cyber-cyan)]" :
                                      "border-gray-500 text-gray-500"
                                    )}
                                  >
                                    {notification.priority}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-400">
                                    {notification.timestamp.toLocaleTimeString()}
                                  </span>
                                  
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeNotification(notification.id)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                              
                              {notification.source && (
                                <p className="text-xs text-gray-500 mt-2">
                                  From: {notification.source}
                                </p>
                              )}
                              
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="flex items-center space-x-2 mt-3">
                                  {notification.actions.map((action, index) => (
                                    <Button
                                      key={index}
                                      variant={action.variant || 'default'}
                                      size="sm"
                                      onClick={action.action}
                                      className="h-7 text-xs"
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-[var(--cyber-cyan)]" />
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-xl font-bold text-white">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-400">Unread</p>
                <p className="text-xl font-bold text-white">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-400">Security</p>
                <p className="text-xl font-bold text-white">
                  {notifications.filter(n => n.type === 'security').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[var(--cyber-yellow)]" />
              <div>
                <p className="text-sm text-gray-400">Urgent</p>
                <p className="text-xl font-bold text-white">
                  {notifications.filter(n => n.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}