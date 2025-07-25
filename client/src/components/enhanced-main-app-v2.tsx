import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

// Import improved components
import { ImprovedMenuBar } from './improved-menu-bar';
import { EnhancedStorySystemV2 } from './enhanced-story-system-v2';
import { FixedConnectivitySystem } from './fixed-connectivity-system';
import { ImprovedNodeSystem } from './improved-node-system';
import { EnhancedAuthRegistration } from './enhanced-auth-registration';
import { EnhancedRadarMeshMap } from './enhanced-radar-mesh-map';
import { EnhancedRealTimeMessaging } from './enhanced-real-time-messaging';
import { CompleteUserProfile } from './complete-user-profile';
import { EnhancedSettingsPanel } from './enhanced-settings-panel';

// Import futuristic systems (keep existing ones)
import { Futuristic3DOrbitalStorySystem } from './futuristic-3d-orbital-story-system';
import { AIShadowCloneSystem } from './ai-shadow-clone-system';
import { Web3BlockchainIntegration } from './web3-blockchain-integration';
import { ARWorldDropSystem } from './ar-world-drop-system';
import { QuantumMeshRoutingSystem } from './quantum-mesh-routing-system';
import { NeuralNetworkVisualization } from './neural-network-visualization';

interface WSState {
  isConnected: boolean;
  connectionQuality: 'offline' | 'poor' | 'fair' | 'good' | 'excellent';
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

export function EnhancedMainAppV2() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('3d-orbital');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

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

  // Persist offline mode setting
  useEffect(() => {
    try {
      localStorage.setItem('meshbook-offline-mode', JSON.stringify(isOfflineMode));
    } catch (error) {
      console.warn('Failed to save offline mode setting:', error);
    }
  }, [isOfflineMode]);

  // Fetch available users
  const { data: availableUsers = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!currentUser && !isOfflineMode,
    refetchInterval: 10000,
    retry: 3
  });

  // Handle users fetch error
  useEffect(() => {
    if (usersError) {
      console.error('Failed to fetch users:', usersError);
    }
  }, [usersError]);

  // WebSocket connection management
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (isOfflineMode) return;

    try {
      console.log('App: Attempting WebSocket connection...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('App: WebSocket connected successfully');
        reconnectAttemptsRef.current = 0;
        setWsState(prev => ({
          ...prev,
          isConnected: true,
          connectionQuality: 'excellent'
        }));

        if (currentUser) {
          wsRef.current?.send(JSON.stringify({
            type: 'user_connected',
            userId: currentUser.id,
            alias: currentUser.alias
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('App: WebSocket message received:', data);
          
          // Handle different message types
          switch (data.type) {
            case 'user_joined':
              toast({
                title: "User Joined",
                description: `${data.alias} joined the mesh network`,
              });
              break;
            case 'user_left':
              toast({
                title: "User Left",
                description: `${data.alias} left the mesh network`,
              });
              break;
            case 'message':
              // Handle real-time messages
              break;
          }
        } catch (error) {
          console.error('App: Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('App: WebSocket connection closed:', event.code, event.reason);
        setWsState(prev => ({
          ...prev,
          isConnected: false,
          connectionQuality: 'offline'
        }));

        // Auto-reconnect logic
        if (!isOfflineMode && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`App: Reconnecting WebSocket (attempt ${reconnectAttemptsRef.current})`);
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('App: WebSocket error:', error);
        setWsState(prev => ({
          ...prev,
          connectionQuality: 'poor'
        }));
      };

    } catch (error) {
      console.error('App: Failed to create WebSocket connection:', error);
      setWsState(prev => ({
        ...prev,
        isConnected: false,
        connectionQuality: 'offline'
      }));
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (currentUser && !isOfflineMode) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser, isOfflineMode]);

  // WebSocket state functions
  useEffect(() => {
    setWsState(prev => ({
      ...prev,
      sendMessage: (message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(message));
        } else {
          console.warn('App: WebSocket not connected, message not sent');
        }
      },
      reconnect: () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
        reconnectAttemptsRef.current = 0;
        connectWebSocket();
      }
    }));
  }, []);

  // Handle user logout
  const handleUserLogout = () => {
    localStorage.removeItem('meshbook-user');
    setCurrentUser(null);
    setActiveTab('auth');
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  // Handle user update
  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('meshbook-user', JSON.stringify(updatedUser));
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  // Handle successful authentication
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('meshbook-user', JSON.stringify(user));
    setActiveTab('3d-orbital');
    
    toast({
      title: "Welcome!",
      description: `Hello ${user.alias}, you're now connected to the mesh network`,
    });
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  // Handle offline mode toggle
  const handleOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
    
    if (enabled) {
      if (wsRef.current) {
        wsRef.current.close();
      }
    } else if (currentUser) {
      connectWebSocket();
    }
  };

  // Render authentication if no user
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
        <EnhancedAuthRegistration onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </div>
    );
  }

  // Main application interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* Improved Menu Bar */}
      <ImprovedMenuBar
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUserlogout={handleUserLogout}
      />

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* 3D Orbital Stories */}
        {activeTab === '3d-orbital' && (
          <Futuristic3DOrbitalStorySystem
            currentUser={currentUser}
            availableUsers={availableUsers}
            isOffline={isOfflineMode}
          />
        )}

        {/* Enhanced Stories V2 */}
        {activeTab === 'stories' && (
          <EnhancedStorySystemV2
            currentUser={currentUser}
            availableUsers={availableUsers}
            isOffline={isOfflineMode}
          />
        )}

        {/* AI Shadow Clone */}
        {activeTab === 'ai-clone' && (
          <AIShadowCloneSystem
            currentUser={currentUser}
            onUserUpdate={handleUserUpdate}
            isOffline={isOfflineMode}
          />
        )}

        {/* Web3 Integration */}
        {activeTab === 'web3' && (
          <Web3BlockchainIntegration
            currentUser={currentUser}
            onUserUpdate={handleUserUpdate}
            isOffline={isOfflineMode}
          />
        )}

        {/* AR World Drops */}
        {activeTab === 'ar-world' && (
          <ARWorldDropSystem
            currentUser={currentUser}
            availableUsers={availableUsers as User[]}
            isOffline={isOfflineMode}
          />
        )}

        {/* Real-time Messaging */}
        {activeTab === 'messages' && (
          <EnhancedRealTimeMessaging
            currentUser={currentUser}
            availableUsers={availableUsers as User[]}
            wsState={wsState}
            onUserProfile={handleUserSelect}
            isOffline={isOfflineMode}
          />
        )}

        {/* Users List */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableUsers.map((user) => (
              <div key={user.id} 
                   className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                   onClick={() => handleUserSelect(user)}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    {user.alias.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{user.alias}</h3>
                    <p className="text-gray-300 text-sm">{user.profile}</p>
                    <p className="text-xs text-green-400">{user.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mesh Radar Map */}
        {activeTab === 'mesh' && (
          <EnhancedRadarMeshMap
            currentUser={currentUser}
            availableUsers={availableUsers as User[]}
            isOffline={isOfflineMode}
          />
        )}

        {/* Network Status */}
        {activeTab === 'network' && (
          <FixedConnectivitySystem
            currentUser={currentUser}
            availableUsers={availableUsers as User[]}
            wsState={wsState}
            onOfflineMode={handleOfflineMode}
          />
        )}

        {/* Quantum Mesh Routing */}
        {activeTab === 'quantum' && (
          <QuantumMeshRoutingSystem
            currentUser={currentUser}
            availableUsers={availableUsers as any[]}
            isOffline={isOfflineMode}
          />
        )}

        {/* Neural Network Visualization */}
        {activeTab === 'neural' && (
          <NeuralNetworkVisualization
            currentUser={currentUser}
            isOffline={isOfflineMode}
          />
        )}

        {/* Node Control System */}
        {activeTab === 'node' && (
          <ImprovedNodeSystem
            currentUser={currentUser}
            availableUsers={availableUsers as User[]}
            isOffline={isOfflineMode}
          />
        )}

        {/* Profile Management */}
        {activeTab === 'profile' && currentUser && (
          <CompleteUserProfile
            user={currentUser}
            currentUser={currentUser}
            isOpen={true}
            onClose={() => setActiveTab('3d-orbital')}
          />
        )}

        {/* Settings Panel */}
        {activeTab === 'settings' && (
          <EnhancedSettingsPanel
            isOfflineMode={isOfflineMode}
            onOfflineModeChange={handleOfflineMode}
            onLogout={handleUserLogout}
          />
        )}
      </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <CompleteUserProfile
          user={selectedUser}
          currentUser={currentUser}
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      )}

      <Toaster />
    </div>
  );
}