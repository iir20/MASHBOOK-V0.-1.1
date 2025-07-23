import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageSquare,
  Users,
  Network,
  Settings,
  Camera,
  Bell,
  Share,
  Heart,
  Send,
  Plus,
  Search,
  Menu,
  X,
  Edit,
  Eye,
  Wifi,
  WifiOff,
  User as UserIcon,
  LogOut,
  Shield,
  Radio,
  Activity
} from 'lucide-react';
import type { User, Story, Message, UpdateUser } from '@shared/schema';
import { FacebookStyleStories } from './facebook-style-stories';
import { EnhancedRealTimeMessaging } from './enhanced-real-time-messaging';
import { EnhancedProfileEditor } from './enhanced-profile-editor';
import { EnhancedSettingsPanel } from './enhanced-settings-panel';
import { EnhancedConnectivitySystem } from './enhanced-connectivity-system';

type UserType = User;

interface ImprovedMobileMainAppProps {
  currentUser: UserType;
  onLogout: () => void;
}

export function ImprovedMobileMainApp({ currentUser: initialCurrentUser, onLogout }: ImprovedMobileMainAppProps) {
  const [currentUser, setCurrentUser] = useState<UserType>(initialCurrentUser);
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'users' | 'network' | 'profile'>('home');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    const saved = localStorage.getItem('meshbook-offline-mode');
    return saved ? JSON.parse(saved) : false;
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users data
  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    refetchInterval: 10000,
  });

  // Fetch stories data
  const { data: allStories = [] } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    refetchInterval: 5000,
  });

  const filteredUsers = allUsers.filter(user => user.id !== currentUser.id);

  const handleOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
    localStorage.setItem('meshbook-offline-mode', JSON.stringify(enabled));
    
    if (enabled) {
      toast({
        title: "Offline Mode Active",
        description: "You can browse cached content and queue messages",
      });
    } else {
      toast({
        title: "Back Online",
        description: "Reconnecting to mesh network...",
      });
    }
  };

  const handleUserUpdate = (updatedUser: UserType) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('meshbook-user', JSON.stringify(updatedUser));
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  };

  const handleSelectUser = (user: UserType) => {
    setSelectedUser(user);
    setActiveTab('messages');
  };

  const MobileTabBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-3">
        <TabsTrigger
          value="home"
          className="flex flex-col items-center gap-1 flex-1 data-[state=active]:bg-primary/20"
          onClick={() => setActiveTab('home')}
        >
          <Camera className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </TabsTrigger>
        <TabsTrigger
          value="messages"
          className="flex flex-col items-center gap-1 flex-1 data-[state=active]:bg-primary/20"
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs">Chat</span>
        </TabsTrigger>
        <TabsTrigger
          value="users"
          className="flex flex-col items-center gap-1 flex-1 data-[state=active]:bg-primary/20"
          onClick={() => setActiveTab('users')}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Users</span>
        </TabsTrigger>
        <TabsTrigger
          value="network"
          className="flex flex-col items-center gap-1 flex-1 data-[state=active]:bg-primary/20"
          onClick={() => setActiveTab('network')}
        >
          <Network className="w-5 h-5" />
          <span className="text-xs">Network</span>
        </TabsTrigger>
        <TabsTrigger
          value="profile"
          className="flex flex-col items-center gap-1 flex-1 data-[state=active]:bg-primary/20"
          onClick={() => setActiveTab('profile')}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-xs">Profile</span>
        </TabsTrigger>
      </div>
    </div>
  );

  const MobileHeader = () => (
    <div className="sticky top-0 bg-card border-b border-border z-30 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Meshbook
          </h1>
          <Badge variant={isOfflineMode ? "destructive" : "default"} className="text-xs">
            {isOfflineMode ? (
              <><WifiOff className="w-3 h-3 mr-1" />Offline</>
            ) : (
              <><Wifi className="w-3 h-3 mr-1" />Online</>
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOfflineMode(!isOfflineMode)}
          >
            {isOfflineMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const MobileMenu = () => (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed right-0 top-0 h-full w-80 bg-card border-l border-border transform transition-transform ${showMobileMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setShowProfileEditor(true);
                setShowMobileMenu(false);
              }}
            >
              <Edit className="w-4 h-4 mr-3" />
              Edit Profile
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleOfflineMode(!isOfflineMode)}
            >
              {isOfflineMode ? (
                <><Wifi className="w-4 h-4 mr-3" />Go Online</>
              ) : (
                <><WifiOff className="w-4 h-4 mr-3" />Go Offline</>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start text-red-400 border-red-400 hover:bg-red-400/20"
              onClick={() => {
                onLogout();
                setShowMobileMenu(false);
              }}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <Tabs value={activeTab} onValueChange={setActiveTab as any} className="h-screen flex flex-col">
        <MobileHeader />
        
        <div className="flex-1 overflow-hidden pb-20">
          <TabsContent value="home" className="h-full m-0">
            <div className="h-full overflow-auto">
              <FacebookStyleStories
                currentUser={currentUser}
                allUsers={allUsers}
                allStories={allStories}
                onUserProfile={(user) => {
                  setSelectedUser(user);
                  // Show user details in a modal instead of changing tabs
                }}
                isOffline={isOfflineMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="h-full m-0">
            <div className="h-full">
              <EnhancedRealTimeMessaging
                currentUser={currentUser}
                selectedUser={selectedUser}
                allUsers={filteredUsers}
                onSelectUser={setSelectedUser}
                onUserProfile={(user) => setSelectedUser(user)}
                isOffline={isOfflineMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="users" className="h-full m-0 p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 bg-card border-border"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map((user: UserType) => (
                  <Card key={user.id} className="bg-card/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                              {user.alias.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{user.alias}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.profile}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              L{user.securityLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectUser(user)}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="border-cyan-500/50 text-cyan-400"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="network" className="h-full m-0">
            <div className="h-full overflow-auto">
              <EnhancedConnectivitySystem
                currentUser={currentUser}
                availableUsers={filteredUsers}
                wsState={{
                  isConnected: !isOfflineMode,
                  connectionQuality: isOfflineMode ? 'Poor' : 'Good',
                  lastMessage: null,
                  sendMessage: () => {},
                  reconnect: () => {}
                }}
                onOfflineMode={handleOfflineMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="h-full m-0">
            <div className="h-full overflow-auto p-4">
              <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="text-center space-y-6">
                    <div className="relative mx-auto w-32 h-32">
                      <Avatar className="w-32 h-32 border-4 border-cyan-500/50">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                          {currentUser.alias.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">{currentUser.alias}</h1>
                      <p className="text-muted-foreground mb-4">{currentUser.profile}</p>
                      
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <Badge variant="outline" className="text-cyan-300 border-cyan-500/50 bg-cyan-500/10">
                          <Radio className="w-3 h-3 mr-1" />
                          {currentUser.meshCallsign}
                        </Badge>
                        <Badge variant="outline" className="text-green-300 border-green-500/50 bg-green-500/10">
                          <Shield className="w-3 h-3 mr-1" />
                          Level {currentUser.securityLevel}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                        onClick={() => setShowProfileEditor(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                        onClick={() => handleOfflineMode(!isOfflineMode)}
                      >
                        {isOfflineMode ? (
                          <><Wifi className="w-4 h-4 mr-2" />Go Online</>
                        ) : (
                          <><WifiOff className="w-4 h-4 mr-2" />Go Offline</>
                        )}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={onLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>

        <MobileTabBar />
      </Tabs>

      <MobileMenu />

      {/* Enhanced Profile Editor Modal */}
      {showProfileEditor && (
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
    </div>
  );
}