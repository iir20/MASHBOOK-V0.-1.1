import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, UpdateUser } from '@shared/schema';

import {
  Settings,
  User as UserIcon,
  Shield,
  Palette,
  Network,
  Bluetooth,
  Wifi,
  Moon,
  Sun,
  Bell,
  Lock,
  Globe,
  Smartphone,
  Eye,
  EyeOff,
  Save,
  Camera,
  Edit3,
  Zap,
  Radio,
  Gauge
} from 'lucide-react';

interface UnifiedSettingsProfileProps {
  currentUser: User;
  onUserUpdate: (user: User) => void;
  onClose?: () => void;
}

export function UnifiedSettingsProfile({ currentUser, onUserUpdate, onClose }: UnifiedSettingsProfileProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    alias: currentUser?.alias || '',
    profile: currentUser?.profile || '',
    avatar: currentUser?.avatar || '',
    securityLevel: currentUser?.securityLevel || 1,
    nodeCapabilities: currentUser?.nodeCapabilities || []
  });

  interface SettingsType {
    theme: string;
    notifications: boolean;
    offlineMode: boolean;
    autoConnect: boolean;
    encryptionEnabled: boolean;
    meshBroadcast: boolean;
    bluetoothDiscovery: boolean;
    wifiDirect: boolean;
    dataCollection: boolean;
    animationsEnabled: boolean;
    autoRefresh: boolean;
    developerMode: boolean;
  }

  const [settings, setSettings] = useState<SettingsType>(() => {
    const saved = localStorage.getItem('meshbook-settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      notifications: true,
      offlineMode: false,
      autoConnect: true,
      encryptionEnabled: true,
      meshBroadcast: true,
      bluetoothDiscovery: true,
      wifiDirect: false,
      dataCollection: false,
      animationsEnabled: true,
      autoRefresh: true,
      developerMode: false
    };
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UpdateUser) => {
      return apiRequest(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: (updatedUser) => {
      onUserUpdate(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('meshbook-settings', JSON.stringify(settings));
    
    // Apply theme
    document.documentElement.className = settings.theme === 'dark' ? 'dark' : '';
    
    // Apply other global settings
    if (settings.offlineMode) {
      localStorage.setItem('meshbook-offline-mode', 'true');
    } else {
      localStorage.removeItem('meshbook-offline-mode');
    }
  }, [settings]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setProfileData((prev: typeof profileData) => ({ ...prev, avatar: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const securityLevels = [
    { value: 1, label: 'Basic', color: 'bg-green-500' },
    { value: 2, label: 'Standard', color: 'bg-blue-500' },
    { value: 3, label: 'Enhanced', color: 'bg-yellow-500' },
    { value: 4, label: 'Military', color: 'bg-orange-500' },
    { value: 5, label: 'Quantum', color: 'bg-red-500' }
  ];

  const capabilities = [
    'mesh-relay', 'file-transfer', 'voice-call', 'video-call', 
    'encryption', 'bluetooth', 'wifi-direct', 'long-range'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Settings & Profile
          </h2>
          <p className="text-muted-foreground">Manage your profile and application preferences</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-2xl">
                      {profileData.alias.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold">{profileData.alias}</h3>
                  <Badge variant="secondary">Device ID: {currentUser.deviceId}</Badge>
                  <Badge 
                    className={`${securityLevels.find(s => s.value === profileData.securityLevel)?.color} text-white`}
                  >
                    Security Level {profileData.securityLevel}: {securityLevels.find(s => s.value === profileData.securityLevel)?.label}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="alias">Username / Alias</Label>
                  <Input
                    id="alias"
                    value={profileData.alias}
                    onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, alias: e.target.value }))}
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <Label htmlFor="profile">Bio / Description</Label>
                  <Textarea
                    id="profile"
                    value={profileData.profile}
                    onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, profile: e.target.value }))}
                    placeholder="Tell others about yourself..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="security-level">Security Clearance Level</Label>
                  <Select
                    value={profileData.securityLevel.toString()}
                    onValueChange={(value) => setProfileData((prev: typeof profileData) => ({ ...prev, securityLevel: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select security level" />
                    </SelectTrigger>
                    <SelectContent>
                      {securityLevels.map(level => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${level.color}`} />
                            Level {level.value}: {level.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Node Capabilities</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {capabilities.map(capability => (
                      <div key={capability} className="flex items-center space-x-2">
                        <Switch
                          checked={profileData.nodeCapabilities.includes(capability)}
                          onCheckedChange={(checked: boolean) => {
                            setProfileData((prev: typeof profileData) => ({
                              ...prev,
                              nodeCapabilities: checked
                                ? [...prev.nodeCapabilities, capability]
                                : prev.nodeCapabilities.filter(c => c !== capability)
                            }));
                          }}
                        />
                        <Label className="text-sm capitalize">
                          {capability.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>End-to-End Encryption</Label>
                  <p className="text-sm text-muted-foreground">Encrypt all messages and files</p>
                </div>
                <Switch
                  checked={settings.encryptionEnabled}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, encryptionEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Collection</Label>
                  <p className="text-sm text-muted-foreground">Allow anonymous analytics</p>
                </div>
                <Switch
                  checked={settings.dataCollection}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, dataCollection: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Developer Mode</Label>
                  <p className="text-sm text-muted-foreground">Show technical information</p>
                </div>
                <Switch
                  checked={settings.developerMode}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, developerMode: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connectivity Tab */}
        <TabsContent value="connectivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Network Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <div>
                    <Label>Offline Mode</Label>
                    <p className="text-sm text-muted-foreground">Work without internet connection</p>
                  </div>
                </div>
                <Switch
                  checked={settings.offlineMode}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, offlineMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <div>
                    <Label>Auto Connect</Label>
                    <p className="text-sm text-muted-foreground">Automatically connect to available networks</p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoConnect}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, autoConnect: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  <div>
                    <Label>Mesh Broadcasting</Label>
                    <p className="text-sm text-muted-foreground">Relay messages for other users</p>
                  </div>
                </div>
                <Switch
                  checked={settings.meshBroadcast}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, meshBroadcast: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bluetooth className="w-4 h-4" />
                  <div>
                    <Label>Bluetooth Discovery</Label>
                    <p className="text-sm text-muted-foreground">Find nearby devices via Bluetooth</p>
                  </div>
                </div>
                <Switch
                  checked={settings.bluetoothDiscovery}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, bluetoothDiscovery: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  <div>
                    <Label>WiFi Direct</Label>
                    <p className="text-sm text-muted-foreground">Direct device-to-device WiFi</p>
                  </div>
                </div>
                <Switch
                  checked={settings.wifiDirect}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, wifiDirect: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme Mode</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable UI animations and transitions</p>
                </div>
                <Switch
                  checked={settings.animationsEnabled}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, animationsEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Refresh</Label>
                  <p className="text-sm text-muted-foreground">Automatically refresh data</p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, autoRefresh: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked: boolean) => setSettings((prev: SettingsType) => ({ ...prev, notifications: checked }))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Device Information</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Device ID:</span>
                    <p className="font-mono">{currentUser.deviceId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mesh Callsign:</span>
                    <p className="font-mono">{currentUser.meshCallsign}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Security Level:</span>
                    <p>{profileData.securityLevel}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Node Type:</span>
                    <p>Mesh Relay Node</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-destructive">Danger Zone</Label>
                <Button variant="destructive" size="sm">
                  Reset All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}