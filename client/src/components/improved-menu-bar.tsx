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
  Clock,
  Home,
  Users,
  Network,
  Zap,
  Radio
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, Story } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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

interface ImprovedMenuBarProps {
  currentUser: User | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUserlogout?: () => void;
}

export function ImprovedMenuBar({ currentUser, activeTab, onTabChange, onUserlogout }: ImprovedMenuBarProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
      });
    }
  });

  const handleSettingChange = (key: keyof AppSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(editForm);
  };

  // Main navigation tabs - improved and organized
  const mainTabs = [
    { id: '3d-orbital', label: 'Stories', icon: Heart, description: 'Orbital Stories' },
    { id: 'messages', label: 'Chat', icon: MessageSquare, description: 'Real-time Messaging' },
    { id: 'users', label: 'Users', icon: Users, description: 'Connected Users' },
    { id: 'mesh', label: 'Radar', icon: Radio, description: 'Mesh Network Map' },
    { id: 'network', label: 'Network', icon: Network, description: 'Network Status' },
    { id: 'node', label: 'Node Control', icon: Zap, description: 'Node Management' },
  ];

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <div className="hidden md:flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-md border-b border-purple-500/20">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Meshbook
            </h1>
            <p className="text-xs text-gray-400">Decentralized Network</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2">
          {mainTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                  : 'hover:bg-purple-500/20 text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-1">
              <Signal className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-400">{settings.signalStrength}%</span>
            </div>
          </div>

          {/* Settings */}
          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>Configure your Meshbook preferences</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Connectivity Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Connectivity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bluetooth">Bluetooth</Label>
                      <Switch
                        id="bluetooth"
                        checked={settings.bluetoothEnabled}
                        onCheckedChange={(checked) => handleSettingChange('bluetoothEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="wifi">WiFi Discovery</Label>
                      <Switch
                        id="wifi"
                        checked={settings.wifiEnabled}
                        onCheckedChange={(checked) => handleSettingChange('wifiEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mesh">Mesh Network</Label>
                      <Switch
                        id="mesh"
                        checked={settings.meshEnabled}
                        onCheckedChange={(checked) => handleSettingChange('meshEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="encryption">End-to-End Encryption</Label>
                      <Switch
                        id="encryption"
                        checked={settings.encryptionEnabled}
                        onCheckedChange={(checked) => handleSettingChange('encryptionEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* App Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Application</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Notifications</Label>
                      <Switch
                        id="notifications"
                        checked={settings.notificationsEnabled}
                        onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="offline">Offline Mode</Label>
                      <Switch
                        id="offline"
                        checked={settings.offlineMode}
                        onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-reconnect">Auto Reconnect</Label>
                      <Switch
                        id="auto-reconnect"
                        checked={settings.autoReconnect}
                        onCheckedChange={(checked) => handleSettingChange('autoReconnect', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* User Profile */}
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser?.avatar || ''} />
                  <AvatarFallback>
                    {currentUser?.alias?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-white">{currentUser?.alias || 'User'}</p>
                  <p className="text-xs text-gray-400">Online</p>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
                <DialogDescription>
                  {isEditingProfile ? 'Edit your profile' : 'View your profile details'}
                </DialogDescription>
              </DialogHeader>
              
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={currentUser?.avatar || ''} />
                      <AvatarFallback className="text-lg">
                        {currentUser?.alias?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{currentUser?.alias || 'User'}</h3>
                      <p className="text-sm text-gray-500">Mesh Network Member</p>
                    </div>
                  </div>
                  
                  {currentUser?.profile && (
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <p className="text-sm text-gray-600 mt-1">{currentUser.profile}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button onClick={() => setIsEditingProfile(true)} className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    {onUserlogout && (
                      <Button variant="outline" onClick={onUserlogout}>
                        Logout
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="alias">Username</Label>
                    <Input
                      id="alias"
                      value={editForm.alias}
                      onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile">Bio</Label>
                    <Textarea
                      id="profile"
                      value={editForm.profile}
                      onChange={(e) => setEditForm({ ...editForm, profile: e.target.value })}
                      placeholder="Tell others about yourself"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleProfileUpdate} 
                      disabled={updateProfileMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile Navigation - Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/80 via-blue-900/60 to-transparent backdrop-blur-lg border-t border-purple-500/20 z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {mainTabs.slice(0, 4).map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-purple-400 bg-purple-500/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          ))}
          
          {/* More Menu for Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 px-3 py-2 text-gray-400">
                <Menu className="w-5 h-5" />
                <span className="text-xs">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[300px]">
              <SheetHeader>
                <SheetTitle>More Options</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {mainTabs.slice(4).map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    onClick={() => onTabChange(tab.id)}
                    className="flex items-center space-x-2 justify-start h-12"
                  >
                    <tab.icon className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{tab.label}</div>
                      <div className="text-xs opacity-60">{tab.description}</div>
                    </div>
                  </Button>
                ))}
                
                <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="flex items-center space-x-2 justify-start h-12">
                  <Settings className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Settings</div>
                    <div className="text-xs opacity-60">App Config</div>
                  </div>
                </Button>
                
                <Button variant="outline" onClick={() => setIsProfileOpen(true)} className="flex items-center space-x-2 justify-start h-12">
                  <UserIcon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Profile</div>
                    <div className="text-xs opacity-60">Your Info</div>
                  </div>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}