import { useState, useEffect } from 'react';
import { AuthSystem } from '@/components/auth-system';
import { RealCipherProfile } from '@/components/real-cipher-profile';
import { RealStoriesManager } from '@/components/real-stories-manager';
import { EnhancedSecureVault } from '@/components/enhanced-secure-vault';
import { EnhancedModernChat } from '@/components/enhanced-modern-chat';
import { AboutMeshBook } from '@/components/about-meshbook';
import { useStableWebSocket, ConnectionStatus } from '@/components/stable-websocket';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  MessageSquare, 
  Shield, 
  Users, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff,
  Activity,
  BookOpen
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType } from '@shared/schema';

export default function PhantomHome() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize stable WebSocket connection
  const wsState = useStableWebSocket({
    userId: currentUser?.id.toString() || 'guest'
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('phantomUser');
    const savedDeviceId = localStorage.getItem('phantomDeviceId');
    
    if (savedUser && savedDeviceId) {
      try {
        const user = JSON.parse(savedUser) as UserType;
        setCurrentUser(user);
        setDeviceId(savedDeviceId);
      } catch (error) {
        console.error('Failed to load saved user:', error);
        localStorage.removeItem('phantomUser');
        localStorage.removeItem('phantomDeviceId');
      }
    }
  }, []);

  // Get all real users from database
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!currentUser
  });

  const handleUserAuthenticated = (user: UserType, userDeviceId: string) => {
    setCurrentUser(user);
    setDeviceId(userDeviceId);
    
    // Save to localStorage for persistence
    localStorage.setItem('phantomUser', JSON.stringify(user));
    localStorage.setItem('phantomDeviceId', userDeviceId);
    
    // Update online status
    fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnline: true })
    });

    toast({
      title: "Connected to Phantom Network",
      description: `Welcome back, ${user.alias}`,
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      // Update offline status
      fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: false })
      });
    }
    
    setCurrentUser(null);
    setDeviceId('');
    localStorage.removeItem('phantomUser');
    localStorage.removeItem('phantomDeviceId');
    queryClient.clear();
    
    toast({
      title: "Disconnected",
      description: "You have been safely logged out.",
    });
  };

  const handleProfileUpdate = (updatedUser: UserType) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('phantomUser', JSON.stringify(updatedUser));
  };

  // Show authentication if no user is logged in (except for About page)
  if (!currentUser && activeTab !== 'about') {
    return <AuthSystem onUserAuthenticated={handleUserAuthenticated} />;
  }

  // If no user and accessing About, show About page with option to get started
  if (!currentUser && activeTab === 'about') {
    return <AboutMeshBook onGetStarted={() => setActiveTab('profile')} />;
  }

  // Filter real users (exclude demo/fake users)
  const realUsers = allUsers.filter((user: UserType) => 
    user.id && user.deviceId && user.alias && user.meshCallsign
  );

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <RealCipherProfile 
            user={currentUser}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      case 'stories':
        return (
          <RealStoriesManager 
            userId={currentUser.id}
            currentUser={currentUser}
          />
        );
      case 'vault':
        return (
          <EnhancedSecureVault 
            userId={currentUser.id}
            currentUser={currentUser}
          />
        );
      case 'chat':
        return (
          <EnhancedModernChat 
            currentUser={currentUser}
            availableUsers={realUsers}
            wsState={wsState}
          />
        );
      case 'users':
        return (
          <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-emerald-400">Network Users</h2>
              <Badge variant="secondary" className="bg-emerald-900/30 text-emerald-300">
                {realUsers.length} Active
              </Badge>
            </div>
            
            {isLoadingUsers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : realUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {realUsers.map((user: UserType) => (
                  <Card key={user.id} className="bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
                          {user.alias.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{user.alias}</h3>
                          <p className="text-sm text-gray-400">{user.meshCallsign}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Security Level:</span>
                          <Badge variant="outline" className="text-xs">
                            Level {user.securityLevel}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={user.isOnline ? 'text-green-400' : 'text-gray-400'}>
                            {user.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        {user.profile && (
                          <p className="text-gray-300 text-xs line-clamp-2">{user.profile}</p>
                        )}
                      </div>
                      
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab('chat')}
                          className="flex-1 border-gray-600 text-emerald-400 hover:bg-emerald-900/30"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No other users found on the network</p>
                <p className="text-sm mt-2">Users will appear here when they join</p>
              </div>
            )}
          </div>
        );
      case 'about':
        return (
          <AboutMeshBook 
            onGetStarted={() => setActiveTab('profile')}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Select a tab to get started</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <div className="border-b border-gray-700 bg-black/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-900" />
              </div>
              <h1 className="text-lg font-bold text-emerald-400">Phantom Network</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-2">
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-300">
                {currentUser.alias}
              </Badge>
              <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                {currentUser.meshCallsign}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ConnectionStatus 
              isConnected={wsState.isConnected}
              connectionQuality={wsState.connectionQuality}
              reconnectAttempts={wsState.reconnectAttempts}
              onReconnect={wsState.reconnect}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700 bg-gray-900/50">
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full bg-transparent border-0 h-auto p-0">
              <TabsTrigger 
                value="profile" 
                className="flex items-center space-x-2 px-4 py-3 data-[state=active]:bg-emerald-900/30 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none border-b-2 border-transparent"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stories" 
                className="flex items-center space-x-2 px-4 py-3 data-[state=active]:bg-emerald-900/30 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none border-b-2 border-transparent"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Stories</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vault" 
                className="flex items-center space-x-2 px-4 py-3 data-[state=active]:bg-emerald-900/30 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none border-b-2 border-transparent"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Vault</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="flex items-center space-x-2 px-4 py-3 data-[state=active]:bg-emerald-900/30 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none border-b-2 border-transparent"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center space-x-2 px-4 py-3 data-[state=active]:bg-emerald-900/30 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none border-b-2 border-transparent"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="about" 
                className="flex items-center space-x-2 px-4 py-3 data-[state=active]:bg-emerald-900/30 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none border-b-2 border-transparent"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {renderActiveContent()}
      </div>
    </div>
  );
}