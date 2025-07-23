import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

import { 
  MessageSquare, 
  Users, 
  Sparkles, 
  UserIcon,
  Network,
  Settings,
  Wifi,
  WifiOff,
  LogOut,
  Eye,
  Edit
} from 'lucide-react';

import { EnhancedStorySystem } from './enhanced-story-system';
import { EnhancedRealTimeMessaging } from './enhanced-real-time-messaging';
import { EnhancedConnectivitySystem } from './enhanced-connectivity-system';
import { EnhancedAuthRegistration } from './enhanced-auth-registration';
import { FacebookMenuBar } from './facebook-menu-bar';
import { CompleteUserProfile } from './complete-user-profile';
import { LiveMeshNetworkMap } from './live-mesh-network-map';
import { EnhancedProfileEditor } from './enhanced-profile-editor';
import { EnhancedSettingsPanel } from './enhanced-settings-panel';

type UserType = User;

interface WSState {
  isConnected: boolean;
  connectionQuality: 'offline' | 'poor' | 'fair' | 'good' | 'excellent';
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export function EnhancedMainApp() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'stories' | 'messages' | 'users' | 'network' | 'mesh' | 'profile' | 'settings'>('stories');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    // Load offline mode state from localStorage with persistence
    try {
      const saved = localStorage.getItem('meshbook-offline-mode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [wsState, setWsState] = useState<WSState>({
    isConnected: false,
    connectionQuality: 'offline',
    sendMessage: () => {},
    reconnect: () => {}
  });

  const { toast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('meshbook-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load saved user:', error);
        localStorage.removeItem('meshbook-user');
      }
    }
  }, []);

  // Fetch available users
  const { data: availableUsers = [] } = useQuery<UserType[]>({
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

  const handleUserAuthenticated = (user: UserType) => {
    setCurrentUser(user);
    localStorage.setItem('meshbook-user', JSON.stringify(user));
    toast({
      title: "Welcome to Meshbook!",
      description: `Connected as ${user.alias}`,
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

  const handleSelectUser = (user: UserType) => {
    setSelectedUser(user);
    setActiveTab('messages');
  };

  const handleViewProfile = (user: UserType) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
    // Ensure persistence with error handling
    try {
      localStorage.setItem('meshbook-offline-mode', JSON.stringify(enabled));
      localStorage.setItem('meshbook-offline-timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to save offline mode preference:', error);
    }
    
    if (enabled) {
      toast({
        title: "Offline Mode Enabled",
        description: "You can browse cached content and queue messages for later",
      });
    } else {
      toast({
        title: "Online Mode Enabled", 
        description: "Reconnecting to the mesh network...",
      });
    }
  };

  const handleUserUpdate = (updatedUser: UserType) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('meshbook-user', JSON.stringify(updatedUser));
  };

  // Show auth/registration if no user
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <EnhancedAuthRegistration 
          onUserAuthenticated={handleUserAuthenticated}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      </div>
    );
  }

  const filteredUsers = Array.isArray(availableUsers) 
    ? availableUsers.filter((user: UserType) => user.id !== currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Menu Bar */}
      <FacebookMenuBar 
        currentUser={currentUser}
        onUserSelect={handleViewProfile}
      />

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          {/* Enhanced Tab Navigation */}
          <div className="border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <TabsList className="w-full justify-start bg-transparent h-14 px-4">
              <TabsTrigger value="stories" className="flex items-center gap-2 px-6 py-3">
                <Sparkles className="w-4 h-4" />
                <span>Stories</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2 px-6 py-3">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 px-6 py-3">
                <Users className="w-4 h-4" />
                <span>Network</span>
              </TabsTrigger>
              <TabsTrigger value="mesh" className="flex items-center gap-2 px-6 py-3">
                <Network className="w-4 h-4" />
                <span>Mesh</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 px-6 py-3">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2 px-6 py-3">
                <Wifi className="w-4 h-4" />
                <span>Connectivity</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2 px-6 py-3">
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="stories" className="h-full m-0">
              <EnhancedStorySystem
                currentUser={currentUser}
                availableUsers={filteredUsers}
                onMessageUser={handleSelectUser}
                onUserProfile={handleViewProfile}
                isOffline={isOfflineMode}
              />
            </TabsContent>

            <TabsContent value="messages" className="h-full m-0">
              <EnhancedRealTimeMessaging
                currentUser={currentUser}
                availableUsers={filteredUsers}
                wsState={wsState}
                onUserProfile={handleViewProfile}
                isOffline={isOfflineMode}
              />
            </TabsContent>

            <TabsContent value="users" className="h-full m-0 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredUsers.map((user: UserType) => (
                  <Card 
                    key={user.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => handleViewProfile(user)}
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
                              handleSelectUser(user);
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
                              handleViewProfile(user);
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

            <TabsContent value="mesh" className="h-full m-0">
              <LiveMeshNetworkMap
                currentUser={currentUser}
                availableUsers={filteredUsers}
                onUserSelect={handleViewProfile}
                isOffline={isOfflineMode}
              />
            </TabsContent>

            <TabsContent value="network" className="h-full m-0">
              <EnhancedConnectivitySystem
                currentUser={currentUser}
                availableUsers={filteredUsers}
                wsState={wsState}
                onOfflineMode={handleOfflineMode}
              />
            </TabsContent>

            <TabsContent value="profile" className="h-full m-0 p-6">
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                      <Avatar className="w-32 h-32 mx-auto md:mx-0">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback className="text-4xl">
                          {currentUser.alias.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-3">{currentUser.alias}</h1>
                        <p className="text-xl text-muted-foreground mb-6">{currentUser.profile}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                            <p className="font-mono text-sm mt-1 p-2 bg-muted rounded">{currentUser.deviceId}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Mesh Callsign</label>
                            <p className="font-mono text-lg mt-1">{currentUser.meshCallsign}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Security Level</label>
                            <Badge variant="default" className="mt-1">Level {currentUser.securityLevel}</Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Node Capabilities</label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {currentUser.nodeCapabilities.map((cap) => (
                                <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            size="lg"
                            onClick={() => setShowProfileEditor(true)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => setActiveTab('settings')}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => {
                              handleSelectUser(currentUser);
                              setActiveTab('messages');
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Start Messaging
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="h-full m-0">
              <EnhancedSettingsPanel
                isOfflineMode={isOfflineMode}
                onOfflineModeChange={handleOfflineMode}
                onLogout={handleLogout}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Complete User Profile Modal */}
      {selectedUser && (
        <CompleteUserProfile
          user={selectedUser}
          currentUser={currentUser}
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          onMessage={(user) => {
            handleSelectUser(user);
            setActiveTab('messages');
            setShowUserProfile(false);
          }}
        />
      )}

      {/* Enhanced Profile Editor Modal */}
      {showProfileEditor && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <EnhancedProfileEditor
              user={currentUser}
              onUserUpdate={handleUserUpdate}
              onClose={() => setShowProfileEditor(false)}
            />
          </div>
        </div>
      )}

      {/* Footer Status */}
      <div className="border-t p-3 bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${wsState.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{wsState.isConnected ? 'Connected' : 'Offline'}</span>
            </div>
            <span>Quality: {wsState.connectionQuality}</span>
            <span>{filteredUsers.length + 1} users online</span>
            <Badge variant="outline" className="text-xs">
              Meshbook v2.0
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOfflineMode(!isOfflineMode)}
              className="h-8 px-3 text-xs"
            >
              {isOfflineMode ? <WifiOff className="w-3 h-3 mr-1" /> : <Wifi className="w-3 h-3 mr-1" />}
              {isOfflineMode ? 'Go Online' : 'Offline Mode'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-3 text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}