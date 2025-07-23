import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Shield,
  Gauge,
  Radio,
  Map,
  BookOpen,
  FileText,
  Lock,
  Upload,
  Eye,
  Download,
  Plus
} from 'lucide-react';

import { UnifiedSettingsProfile } from './unified-settings-profile';
import { EnhancedStorySystem } from './enhanced-story-system';
import { EnhancedRealTimeMessaging } from './enhanced-real-time-messaging';
import { EnhancedConnectivitySystem } from './enhanced-connectivity-system';
import { LiveMeshNetworkMap } from './live-mesh-network-map';
import { EnhancedAuthShowcase } from './enhanced-auth-showcase';
import { EnhancedStoryVaultSystem } from './enhanced-story-vault-system';
import { EnhancedNodeSystem } from './enhanced-node-system';
import { ThemeProvider, FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

type UserType = User;

interface WSState {
  isConnected: boolean;
  connectionQuality: 'offline' | 'poor' | 'fair' | 'good' | 'excellent';
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export function OptimizedMainApp() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'stories' | 'chat' | 'users' | 'network' | 'mesh' | 'vault' | 'node' | 'settings'>('stories');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
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
  const queryClient = useQueryClient();

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

  // Fetch available users with optimized caching
  const { data: availableUsers = [], refetch: refetchUsers } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    enabled: !!currentUser,
    refetchInterval: isOfflineMode ? false : 30000, // Less aggressive refresh
    staleTime: 10000,
    gcTime: 300000
  });

  // Optimized WebSocket connection with better error handling
  useEffect(() => {
    if (!currentUser || isOfflineMode) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5; // Reduced attempts

    const connect = () => {
      try {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          reconnectAttempts = 0;
          setWsState(prev => ({
            ...prev,
            isConnected: true,
            connectionQuality: 'good'
          }));

          // Send initial join message
          ws?.send(JSON.stringify({
            type: 'join-room',
            userId: currentUser.id,
            deviceId: currentUser.deviceId,
            room: 'general'
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Dispatch custom event for components to listen to
            window.dispatchEvent(new CustomEvent('ws-message', { detail: data }));
            
            // Handle ping/pong for connection quality
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

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.reason);
          setWsState(prev => ({
            ...prev,
            isConnected: false,
            connectionQuality: 'offline'
          }));

          // Only auto-reconnect if not manually closed
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000);
            
            reconnectTimeout = setTimeout(() => {
              console.log(`Reconnecting... Attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsState(prev => ({
            ...prev,
            connectionQuality: 'poor'
          }));
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    const reconnect = () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Manual reconnect');
      }
      reconnectAttempts = 0;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      connect();
    };

    setWsState(prev => ({ ...prev, reconnect }));

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [currentUser?.id, isOfflineMode]);

  // Handle user profile updates
  const handleUserUpdate = useCallback((updatedUser: UserType) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('meshbook-user', JSON.stringify(updatedUser));
    refetchUsers(); // Refresh users list
    toast({
      title: "Profile Updated",
      description: "Your profile changes have been saved."
    });
  }, [refetchUsers, toast]);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('meshbook-user');
    localStorage.removeItem('meshbook-settings');
    setCurrentUser(null);
    if (wsState.isConnected) {
      // Send disconnect message before closing
      wsState.sendMessage({ type: 'disconnect', userId: currentUser?.id });
    }
    window.location.reload();
  }, [wsState, currentUser?.id]);

  // Toggle offline mode
  const toggleOfflineMode = useCallback(() => {
    const newOfflineMode = !isOfflineMode;
    setIsOfflineMode(newOfflineMode);
    localStorage.setItem('meshbook-offline-mode', JSON.stringify(newOfflineMode));
    
    toast({
      title: newOfflineMode ? "Offline Mode Enabled" : "Online Mode Enabled",
      description: newOfflineMode 
        ? "You're now working offline. Limited features available."
        : "Reconnecting to the network..."
    });
  }, [isOfflineMode, toast]);

  // Filter real users (exclude current user)
  const realAvailableUsers = availableUsers.filter(user => user.id !== currentUser?.id);

  if (!currentUser) {
    return (
      <ThemeProvider>
        <EnhancedAuthShowcase
          onAuthSuccess={(user: UserType) => {
            setCurrentUser(user);
            // Invalidate users query to refresh the list  
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
          }}
        />
      </ThemeProvider>
    );
  }

  if (showSettings) {
    return (
      <ThemeProvider>
        <AnimatedBackground>
          <UnifiedSettingsProfile
            currentUser={currentUser}
            onUserUpdate={handleUserUpdate}
            onClose={() => setShowSettings(false)}
          />
        </AnimatedBackground>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AnimatedBackground>
        <div className="min-h-screen bg-background">
          {/* Top Header */}
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/20">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <NeonText className="text-2xl font-bold">Meshbook</NeonText>
                <Badge variant={wsState.isConnected ? "default" : "destructive"}>
                  {isOfflineMode ? 'Offline Mode' : wsState.isConnected ? 'Connected' : 'Offline'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleOfflineMode}
                  className="flex items-center gap-2"
                >
                  {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                  {isOfflineMode ? 'Go Online' : 'Go Offline'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>
                      {currentUser.alias.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{currentUser.alias}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-6">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-8 mb-6">
                <TabsTrigger value="stories" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Stories
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="network" className="flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Network
                </TabsTrigger>
                <TabsTrigger value="mesh" className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Mesh Map
                </TabsTrigger>
                <TabsTrigger value="vault" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Vault
                </TabsTrigger>
                <TabsTrigger value="node" className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Node
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stories">
                <EnhancedStoryVaultSystem
                  currentUser={currentUser}
                  availableUsers={realAvailableUsers}
                  isOffline={isOfflineMode}
                />
              </TabsContent>

              <TabsContent value="chat">
                <FuturisticCard className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Secure Messaging
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <FuturisticCard className="p-4 h-96">
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Select a user to start chatting
                        </div>
                      </FuturisticCard>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Available Users</h4>
                      {realAvailableUsers.slice(0, 5).map(user => (
                        <FuturisticCard key={user.id} className="p-3 cursor-pointer hover:scale-105 transition-transform">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-xs">
                                {user.alias.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.alias}</p>
                              <Badge variant={user.isOnline ? "default" : "secondary"} className="text-xs">
                                {user.isOnline ? 'Online' : 'Offline'}
                              </Badge>
                            </div>
                          </div>
                        </FuturisticCard>
                      ))}
                    </div>
                  </div>
                </FuturisticCard>
              </TabsContent>

              <TabsContent value="users">
                <FuturisticCard className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Network Users ({realAvailableUsers.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {realAvailableUsers.map(user => (
                      <FuturisticCard key={user.id} className="p-4 cursor-pointer hover:scale-105 transition-transform">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.alias.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{user.alias}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.profile || 'No bio available'}
                            </p>
                            <Badge variant={user.isOnline ? "default" : "secondary"} className="text-xs">
                              {user.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        </div>
                      </FuturisticCard>
                    ))}
                  </div>
                </FuturisticCard>
              </TabsContent>

              <TabsContent value="network">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <FuturisticCard className="p-6">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Wifi className="w-5 h-5" />
                      Connection Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>WebSocket</span>
                        <Badge variant={wsState.isConnected ? "default" : "destructive"}>
                          {wsState.isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Connection Quality</span>
                        <Badge variant="secondary">{wsState.connectionQuality}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Mode</span>
                        <Badge variant={isOfflineMode ? "secondary" : "default"}>
                          {isOfflineMode ? 'Offline' : 'Online'}
                        </Badge>
                      </div>
                    </div>
                  </FuturisticCard>
                  
                  <FuturisticCard className="p-6">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Network className="w-5 h-5" />
                      Network Stats
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Total Nodes</span>
                        <span className="font-mono">{realAvailableUsers.length + 1}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Online Users</span>
                        <span className="font-mono">{realAvailableUsers.filter(u => u.isOnline).length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Security Level</span>
                        <span className="font-mono">Level {currentUser.securityLevel}</span>
                      </div>
                    </div>
                  </FuturisticCard>
                  
                  <FuturisticCard className="p-6">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Radio className="w-5 h-5" />
                      Mesh Features
                    </h4>
                    <div className="space-y-2">
                      {currentUser.nodeCapabilities.map(capability => (
                        <Badge key={capability} variant="outline" className="mr-2 mb-2">
                          {capability.replace('-', ' ')}
                        </Badge>
                      ))}
                      {currentUser.nodeCapabilities.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          No capabilities configured
                        </p>
                      )}
                    </div>
                  </FuturisticCard>
                </div>
              </TabsContent>

              <TabsContent value="mesh">
                <LiveMeshNetworkMap
                  currentUser={currentUser}
                  availableUsers={realAvailableUsers}
                  onUserSelect={setSelectedUser}
                  isOffline={isOfflineMode}
                />
              </TabsContent>

              <TabsContent value="vault">
                <FuturisticCard className="p-6">
                  <h3 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Cipher Vault
                  </h3>
                  <p className="text-muted-foreground text-center mb-8">
                    Military-grade encrypted storage for your sensitive files and data
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Security Status */}
                    <FuturisticCard className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Security Status
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Encryption:</span>
                          <Badge variant="default">AES-256</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage:</span>
                          <Badge variant="secondary">Local + Mesh</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Files:</span>
                          <span className="font-mono">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Level:</span>
                          <span className="font-mono">{currentUser.securityLevel}</span>
                        </div>
                      </div>
                    </FuturisticCard>

                    {/* Upload Section */}
                    <FuturisticCard className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Files
                      </h4>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Select Files
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Files are encrypted with AES-256 and distributed across the mesh network
                        </p>
                      </div>
                    </FuturisticCard>

                    {/* Quick Actions */}
                    <FuturisticCard className="p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Create Note
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View All
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Export Backup
                        </Button>
                      </div>
                    </FuturisticCard>
                  </div>

                  {/* File Grid */}
                  <FuturisticCard className="p-8">
                    <div className="text-center text-muted-foreground">
                      <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">Your Vault is Empty</h3>
                      <p className="mb-4">Upload files to get started with secure, encrypted storage</p>
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First File
                      </Button>
                    </div>
                  </FuturisticCard>
                </FuturisticCard>
              </TabsContent>

              <TabsContent value="settings">
                <UnifiedSettingsProfile
                  currentUser={currentUser}
                  onUserUpdate={handleUserUpdate}
                />
              </TabsContent>

              <TabsContent value="node">
                <EnhancedNodeSystem
                  currentUser={currentUser}
                  isOffline={isOfflineMode}
                />
              </TabsContent>

              <TabsContent value="settings">
                <UnifiedSettingsProfile
                  currentUser={currentUser}
                  onUserUpdate={handleUserUpdate}
                  onClose={() => setShowSettings(false)}
                />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </AnimatedBackground>
    </ThemeProvider>
  );
}