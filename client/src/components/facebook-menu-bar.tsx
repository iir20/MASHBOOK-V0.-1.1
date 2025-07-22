import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Settings, 
  User as UserIcon, 
  MessageSquare, 
  Edit, 
  Bluetooth, 
  Wifi, 
  Signal, 
  Battery, 
  Globe, 
  Shield, 
  Bell, 
  Camera,
  Upload,
  Save,
  X,
  Menu,
  ChevronRight,
  Eye,
  Heart,
  Share2,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, Story } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AppSettings {
  bluetoothEnabled: boolean;
  wifiEnabled: boolean;
  meshEnabled: boolean;
  encryptionEnabled: boolean;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  autoReconnect: boolean;
  signalStrength: number;
}

interface FacebookMenuBarProps {
  currentUser: User | null;
  onUserSelect?: (user: User) => void;
}

export function FacebookMenuBar({ currentUser, onUserSelect }: FacebookMenuBarProps) {
  const queryClient = useQueryClient();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    alias: currentUser?.alias || '',
    profile: currentUser?.profile || '',
    avatar: currentUser?.avatar || ''
  });

  // Load settings from localStorage with proper defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('meshbook-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved settings:', error);
      }
    }
    return {
      bluetoothEnabled: true,
      wifiEnabled: true,
      meshEnabled: true,
      encryptionEnabled: true,
      notificationsEnabled: true,
      offlineMode: false,
      autoReconnect: true,
      signalStrength: 85
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('meshbook-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }, [settings]);

  // Get user stories
  const { data: userStories = [] } = useQuery<Story[]>({
    queryKey: ['/api/stories/user', currentUser?.id],
    enabled: !!currentUser,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { alias: string; profile: string; avatar: string }) => {
      if (!currentUser) throw new Error('No current user');
      return apiRequest(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditingProfile(false);
    }
  });

  const handleSettingChange = (key: keyof AppSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleStartMessaging = () => {
    if (onUserSelect && currentUser) {
      onUserSelect(currentUser);
    }
  };

  const generateAvatar = () => {
    if (editForm.alias) {
      const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(editForm.alias)}`;
      setEditForm(prev => ({ ...prev, avatar: newAvatar }));
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-background border-b border-border">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          MeshBook
        </span>
      </div>

      {/* Menu Items */}
      <div className="flex items-center space-x-4">
        {/* Network Status */}
        <Card className="px-3 py-1">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${settings.meshEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {settings.meshEnabled ? 'Connected' : 'Offline'}
            </span>
            <Badge variant="secondary" className="text-xs">
              {settings.signalStrength}%
            </Badge>
          </div>
        </Card>

        {/* Settings */}
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Settings className="w-5 h-5" />
              {!settings.bluetoothEnabled || !settings.wifiEnabled ? (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>MeshBook Settings</SheetTitle>
              <SheetDescription>
                Configure your connectivity and privacy settings
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
              <div className="space-y-6">
                {/* Connectivity Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Signal className="w-5 h-5 mr-2" />
                    Connectivity
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bluetooth className="w-5 h-5 text-blue-500" />
                        <div>
                          <Label className="font-medium">Bluetooth</Label>
                          <p className="text-sm text-muted-foreground">Device discovery & mesh routing</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.bluetoothEnabled}
                        onCheckedChange={(checked) => handleSettingChange('bluetoothEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Wifi className="w-5 h-5 text-green-500" />
                        <div>
                          <Label className="font-medium">WiFi Direct</Label>
                          <p className="text-sm text-muted-foreground">High-speed peer connections</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.wifiEnabled}
                        onCheckedChange={(checked) => handleSettingChange('wifiEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-purple-500" />
                        <div>
                          <Label className="font-medium">Mesh Network</Label>
                          <p className="text-sm text-muted-foreground">Multi-hop message routing</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.meshEnabled}
                        onCheckedChange={(checked) => handleSettingChange('meshEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Battery className="w-5 h-5 text-orange-500" />
                        <div>
                          <Label className="font-medium">Auto Reconnect</Label>
                          <p className="text-sm text-muted-foreground">Automatic connection recovery</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.autoReconnect}
                        onCheckedChange={(checked) => handleSettingChange('autoReconnect', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Privacy & Security */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Privacy & Security
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-green-600" />
                        <div>
                          <Label className="font-medium">End-to-End Encryption</Label>
                          <p className="text-sm text-muted-foreground">Secure all communications</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.encryptionEnabled}
                        onCheckedChange={(checked) => handleSettingChange('encryptionEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-yellow-500" />
                        <div>
                          <Label className="font-medium">Notifications</Label>
                          <p className="text-sm text-muted-foreground">Message & connection alerts</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.notificationsEnabled}
                        onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Eye className="w-5 h-5 text-gray-500" />
                        <div>
                          <Label className="font-medium">Offline Mode</Label>
                          <p className="text-sm text-muted-foreground">Hide online status</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.offlineMode}
                        onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Network Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Network Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Signal Strength</span>
                      <span className="text-sm font-medium">{settings.signalStrength}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Connections</span>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Mesh Hops</span>
                      <span className="text-sm font-medium">3</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Profile Menu */}
        <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 p-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback>
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96">
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>
                    <UserIcon className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="text-lg font-bold">{currentUser?.alias}</h3>
                  <p className="text-sm text-muted-foreground">{currentUser?.profile}</p>
                </div>
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleStartMessaging} 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Messaging
                  </Button>
                  
                  <Button 
                    onClick={() => setIsEditingProfile(true)} 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <Separator />

                {/* My Stories */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    My Stories ({userStories.length})
                  </h3>
                  
                  {userStories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {userStories.slice(0, 6).map((story: Story) => (
                        <Card key={story.id} className="overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                          <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                            {story.mediaUrl ? (
                              <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-white text-xs text-center p-2">{story.content}</span>
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 text-xs text-white bg-black/50 rounded px-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(story.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No stories shared yet</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Profile Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Profile Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{Array.isArray(userStories) ? userStories.length : 0}</p>
                      <p className="text-sm text-muted-foreground">Stories</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Messages</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Connections</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Profile Edit Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and avatar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={editForm.avatar} />
                <AvatarFallback>
                  <UserIcon className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <Button onClick={generateAvatar} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Generate Avatar
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="alias">Username</Label>
                <Input
                  id="alias"
                  value={editForm.alias}
                  onChange={(e) => setEditForm(prev => ({ ...prev, alias: e.target.value }))}
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <Label htmlFor="profile">Bio</Label>
                <Textarea
                  id="profile"
                  value={editForm.profile}
                  onChange={(e) => setEditForm(prev => ({ ...prev, profile: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleProfileUpdate} 
                disabled={updateProfileMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                onClick={() => setIsEditingProfile(false)} 
                variant="outline"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}