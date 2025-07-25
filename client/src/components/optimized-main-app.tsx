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
  User as UserIcon,
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
  Plus,
  Edit
} from 'lucide-react';

import { UnifiedSettingsSystem } from './unified-settings-system';
import { EnhancedStorySystem } from './enhanced-story-system';
import { EnhancedMessagingSystem } from './enhanced-messaging-system';
import { EnhancedVaultSystem } from './enhanced-vault-system';
import { EnhancedMeshMap } from './enhanced-mesh-map';
import { EnhancedAuthShowcase } from './enhanced-auth-showcase';
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
  const [activeTab, setActiveTab] = useState<'stories' | 'messages' | 'vault' | 'mesh' | 'node' | 'profile' | 'settings'>('stories');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [appSettings, setAppSettings] = useState<any>({});
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

  // Removed old settings modal - now integrated into tabs

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
                  onClick={() => setActiveTab('settings')}
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
              <TabsList className="grid w-full grid-cols-7 mb-6">
                <TabsTrigger value="stories" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Stories
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="vault" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Vault
                </TabsTrigger>
                <TabsTrigger value="mesh" className="flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Mesh
                </TabsTrigger>
                <TabsTrigger value="node" className="flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Node
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stories">
                <EnhancedStorySystem
                  currentUser={currentUser}
                  availableUsers={realAvailableUsers}
                  isOffline={isOfflineMode}
                />
              </TabsContent>

              <TabsContent value="messages">
                <EnhancedMessagingSystem
                  currentUser={currentUser}
                  availableUsers={realAvailableUsers}
                  selectedUser={selectedUser}
                  onUserSelect={setSelectedUser}
                  isOffline={isOfflineMode}
                  wsState={wsState}
                />
              </TabsContent>

              {/* Removed old users and network tabs - content integrated into other components */}

              <TabsContent value="vault">
                <EnhancedVaultSystem
                  currentUser={currentUser}
                  isOffline={isOfflineMode}
                />
              </TabsContent>

              <TabsContent value="mesh">
                <EnhancedMeshMap
                  currentUser={currentUser}
                  availableUsers={realAvailableUsers}
                  onUserSelect={setSelectedUser}
                  isOffline={isOfflineMode}
                  wsState={wsState}
                />
              </TabsContent>

              <TabsContent value="node">
                <EnhancedNodeSystem
                  currentUser={currentUser}
                  isOffline={isOfflineMode}
                />
              </TabsContent>

              <TabsContent value="profile">
                <FuturisticCard className="p-6">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    User Profile
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="text-center space-y-4">
                        <Avatar className="w-32 h-32 mx-auto">
                          <AvatarImage src={currentUser.avatar} />
                          <AvatarFallback className="text-2xl">
                            {currentUser.alias.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="text-xl font-bold">{currentUser.alias}</h4>
                          <p className="text-muted-foreground">{currentUser.meshCallsign}</p>
                        </div>
                        
                        <div className="flex justify-center space-x-2">
                          <Badge variant="default">Level {currentUser.securityLevel}</Badge>
                          <Badge variant={currentUser.isOnline ? "default" : "secondary"}>
                            {currentUser.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h5 className="font-semibold mb-3">Profile Information</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-muted-foreground">Bio</label>
                            <p className="mt-1">{currentUser.profile || 'No bio available'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Device ID</label>
                            <p className="mt-1 font-mono text-xs">{currentUser.deviceId}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Last Seen</label>
                            <p className="mt-1">{currentUser.lastSeen?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-3">Node Capabilities</h5>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.nodeCapabilities.map(capability => (
                            <Badge key={capability} variant="outline">
                              {capability.replace('-', ' ')}
                            </Badge>
                          ))}
                          {currentUser.nodeCapabilities.length === 0 && (
                            <p className="text-muted-foreground text-sm">No capabilities configured</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-3">Network Statistics</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-primary">0</p>
                            <p className="text-sm text-muted-foreground">Messages Sent</p>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-primary">{realAvailableUsers.length}</p>
                            <p className="text-sm text-muted-foreground">Connections</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <GlowButton onClick={() => setShowProfile(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </GlowButton>
                        <Button variant="outline" onClick={() => setActiveTab('settings')}>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </FuturisticCard>
              </TabsContent>

              <TabsContent value="settings">
                <UnifiedSettingsSystem
                  currentUser={currentUser}
                  onUserUpdate={handleUserUpdate}
                  settings={appSettings}
                  onSettingsChange={setAppSettings}
                  isOffline={isOfflineMode}
                />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </AnimatedBackground>
    </ThemeProvider>
  );
}