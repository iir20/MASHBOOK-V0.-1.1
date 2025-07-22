import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { 
  MessageSquare, 
  Users, 
  Sparkles, 
  User,
  Network,
  Settings,
  Wifi,
  WifiOff,
  LogOut,
  Eye,
  Edit
} from 'lucide-react';

import { FacebookStyleStories } from './facebook-style-stories';
import { EnhancedRealTimeMessaging } from './enhanced-real-time-messaging';
import { EnhancedConnectivitySystem } from './enhanced-connectivity-system';
import { EnhancedAuthRegistration } from './enhanced-auth-registration';

import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType } from '@shared/schema';

interface WSState {
  isConnected: boolean;
  connectionQuality: string;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export function EnhancedMainApp() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'stories' | 'messages' | 'users' | 'network'>('stories');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [wsState, setWsState] = useState<WSState>({
    isConnected: false,
    connectionQuality: 'offline',
    sendMessage: () => {},
    reconnect: () => {}
  });

  const { toast } = useToast();

  // Check for existing user session
  useEffect(() => {
    const savedUser = localStorage.getItem('meshbook-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('meshbook-user');
      }
    }
  }, []);

  // Fetch available users
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!currentUser,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    const connect = () => {
      try {
        const wsUrl = `ws://${window.location.host}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          setWsState(prev => ({
            ...prev,
            isConnected: true,
            connectionQuality: 'good'
          }));

          // Join room
          ws?.send(JSON.stringify({
            type: 'join-room',
            userId: currentUser.id,
            room: 'general'
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Dispatch custom event for components to listen to
            window.dispatchEvent(new CustomEvent('ws-message', { detail: data }));
            
            if (data.type === 'pong') {
              const latency = Date.now() - data.timestamp;
              setWsState(prev => ({
                ...prev,
                connectionQuality: latency < 100 ? 'excellent' : latency < 300 ? 'good' : 'fair'
              }));
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsState(prev => ({
            ...prev,
            isConnected: false,
            connectionQuality: 'offline'
          }));

          // Auto-reconnect
          if (reconnectAttempts < maxReconnectAttempts && !isOfflineMode) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            
            reconnectTimeout = setTimeout(() => {
              console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    const reconnect = () => {
      if (ws) {
        ws.close();
      }
      reconnectAttempts = 0;
      connect();
    };

    const sendMessage = (message: any) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    };

    setWsState(prev => ({
      ...prev,
      reconnect,
      sendMessage
    }));

    if (!isOfflineMode) {
      connect();
    }

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [currentUser, isOfflineMode]);

  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
    toast({
      title: "Welcome to Meshbook!",
      description: `Logged in as ${user.alias}`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('meshbook-user');
    setCurrentUser(null);
    setWsState(prev => ({ ...prev, isConnected: false }));
    toast({
      title: "Logged Out",
      description: "You have been logged out of Meshbook",
    });
  };

  const handleMessageUser = (user: UserType) => {
    setSelectedUser(user);
    setActiveTab('messages');
  };

  const handleUserProfile = (user: UserType) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
    if (enabled) {
      toast({
        title: "Offline Mode Enabled",
        description: "You can still browse content and queue messages",
      });
    }
  };

  // Show auth/registration if no user
  if (!currentUser) {
    return (
      <EnhancedAuthRegistration 
        onLogin={handleLogin}
        currentUser={currentUser}
      />
    );
  }

  const filteredUsers = Array.isArray(availableUsers) 
    ? availableUsers.filter((user: UserType) => user.id !== currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Meshbook</h1>
            <Badge 
              variant={wsState.isConnected ? "default" : "destructive"}
              className={wsState.isConnected ? "bg-green-600" : ""}
            >
              {wsState.isConnected ? 'Connected' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.alias.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium hidden sm:inline">{currentUser.alias}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUserProfile(currentUser)}
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-border bg-card/20">
            <TabsList className="w-full justify-start bg-transparent h-12 px-4">
              <TabsTrigger value="stories" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Stories</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                <span className="hidden sm:inline">Network</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="stories" className="h-full m-0">
              <FacebookStyleStories
                currentUser={currentUser}
                availableUsers={filteredUsers}
                onMessageUser={handleMessageUser}
                onUserProfile={handleUserProfile}
              />
            </TabsContent>

            <TabsContent value="messages" className="h-full m-0">
              <EnhancedRealTimeMessaging
                currentUser={currentUser}
                availableUsers={filteredUsers}
                wsState={wsState}
                onUserProfile={handleUserProfile}
                isOffline={isOfflineMode}
              />
            </TabsContent>

            <TabsContent value="users" className="h-full m-0 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredUsers.map((user: UserType) => (
                  <Card 
                    key={user.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleUserProfile(user)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="relative">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-lg">
                              {user.alias.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{user.alias}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {user.profile}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageUser(user);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserProfile(user);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="network" className="h-full m-0">
              <EnhancedConnectivitySystem
                currentUser={currentUser}
                availableUsers={filteredUsers}
                wsState={wsState}
                onOfflineMode={handleOfflineMode}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* User Profile Modal */}
      <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="text-2xl">
                    {selectedUser.alias.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedUser.alias}</h2>
                  <p className="text-muted-foreground mt-1">{selectedUser.profile}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Device ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {selectedUser.deviceId}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Mesh Callsign:</span>
                  <Badge variant="outline">{selectedUser.meshCallsign}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Security Level:</span>
                  <Badge variant="secondary">Level {selectedUser.securityLevel}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    Online
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleMessageUser(selectedUser);
                    setShowUserProfile(false);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                {selectedUser.id === currentUser.id && (
                  <Button variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Offline Mode Indicator */}
      {isOfflineMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardContent className="p-3 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Offline Mode
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}