import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';

import {
  Settings,
  User as UserIcon,
  Shield,
  Bell,
  Lock,
  Wifi,
  Palette,
  Network,
  Save,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Bluetooth,
  Radio,
  Database,
  Key,
  Fingerprint,
  Volume2,
  VolumeX,
  Globe,
  MapPin,
  Camera,
  Mic,
  Upload
} from 'lucide-react';

interface UnifiedSettingsProps {
  currentUser: User | null;
  onUserUpdate: (user: User) => void;
  isOffline: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    messages: boolean;
    stories: boolean;
    connections: boolean;
    sound: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowStoryViewing: boolean;
    shareLocation: boolean;
    autoAcceptConnections: boolean;
  };
  security: {
    requirePinForVault: boolean;
    enableBiometrics: boolean;
    autoLockTimeout: number;
    encryptionLevel: 'standard' | 'high' | 'military';
  };
  connectivity: {
    enableBluetooth: boolean;
    enableWebRTC: boolean;
    enableWiFiDirect: boolean;
    meshRelay: boolean;
    maxConnections: number;
  };
  vault: {
    autoBackup: boolean;
    compressionLevel: number;
    retentionDays: number;
  };
  node: {
    isPublic: boolean;
    relayCapacity: number;
    pointsEarning: boolean;
    badgeDisplay: boolean;
  };
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  notifications: {
    messages: true,
    stories: true,
    connections: true,
    sound: true,
  },
  privacy: {
    showOnlineStatus: true,
    allowStoryViewing: true,
    shareLocation: false,
    autoAcceptConnections: false,
  },
  security: {
    requirePinForVault: true,
    enableBiometrics: false,
    autoLockTimeout: 15,
    encryptionLevel: 'high',
  },
  connectivity: {
    enableBluetooth: true,
    enableWebRTC: true,
    enableWiFiDirect: false,
    meshRelay: true,
    maxConnections: 50,
  },
  vault: {
    autoBackup: true,
    compressionLevel: 5,
    retentionDays: 30,
  },
  node: {
    isPublic: true,
    relayCapacity: 100,
    pointsEarning: true,
    badgeDisplay: true,
  },
};

export function UnifiedSettingsSystem({ currentUser, onUserUpdate, isOffline }: UnifiedSettingsProps) {
  const [activeSection, setActiveSection] = useState<'account' | 'privacy' | 'security' | 'notifications' | 'vault' | 'node' | 'theme' | 'connectivity'>('account');
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('meshbook-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  
  const [editedUser, setEditedUser] = useState<Partial<User>>(currentUser || {});
  const [isDirty, setIsDirty] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save settings to localStorage
  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('meshbook-settings', JSON.stringify(newSettings));
    setIsDirty(false);
    
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });

    // Apply theme immediately
    if (newSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Update user profile mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      if (!currentUser?.id) throw new Error('No user ID');
      return apiRequest(`/api/users/${currentUser.id}`, 'PATCH', userData);
    },
    onSuccess: (updatedUser) => {
      onUserUpdate(updatedUser);
      localStorage.setItem('meshbook-user', JSON.stringify(updatedUser));
      setIsDirty(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      console.error('Failed to update user:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsDirty(true);
  };

  const handleNestedSettingChange = (section: keyof AppSettings, key: string, value: any) => {
    const currentSection = settings[section] as any;
    const newSettings = {
      ...settings,
      [section]: { ...currentSection, [key]: value }
    };
    setSettings(newSettings);
    setIsDirty(true);
  };

  const handleUserChange = (key: keyof User, value: any) => {
    setEditedUser(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    // Save both settings and user profile
    saveSettings(settings);
    
    if (currentUser && Object.keys(editedUser).length > 0) {
      updateUserMutation.mutate(editedUser);
    }
  };

  const sectionItems = [
    { key: 'account', label: 'Account', icon: UserIcon },
    { key: 'privacy', label: 'Privacy', icon: Eye },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'vault', label: 'Vault', icon: Lock },
    { key: 'node', label: 'Node', icon: Network },
    { key: 'theme', label: 'Theme', icon: Palette },
    { key: 'connectivity', label: 'Connectivity', icon: Wifi },
  ];

  const renderAccountSection = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={currentUser?.avatar} />
          <AvatarFallback>{currentUser?.alias?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Input
            placeholder="Display Name"
            value={editedUser.alias || currentUser?.alias || ''}
            onChange={(e) => handleUserChange('alias', e.target.value)}
            className="text-lg font-medium"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Profile Description</label>
          <Textarea
            placeholder="Tell others about yourself..."
            value={editedUser.profile || currentUser?.profile || ''}
            onChange={(e) => handleUserChange('profile', e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Avatar URL</label>
          <Input
            placeholder="https://example.com/avatar.jpg"
            value={editedUser.avatar || currentUser?.avatar || ''}
            onChange={(e) => handleUserChange('avatar', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Security Level</label>
          <Select 
            value={String(editedUser.securityLevel || currentUser?.securityLevel || 1)}
            onValueChange={(value) => handleUserChange('securityLevel', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Level 1 - Basic</SelectItem>
              <SelectItem value="2">Level 2 - Standard</SelectItem>
              <SelectItem value="3">Level 3 - Enhanced</SelectItem>
              <SelectItem value="4">Level 4 - High</SelectItem>
              <SelectItem value="5">Level 5 - Maximum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">Mesh Callsign</p>
            <p className="text-sm text-muted-foreground">{currentUser?.meshCallsign}</p>
          </div>
          <Badge variant="secondary">{currentUser?.nodeCapabilities?.length || 0} Capabilities</Badge>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Show Online Status</p>
            <p className="text-sm text-muted-foreground">Let others see when you're online</p>
          </div>
          <Switch
            checked={settings.privacy.showOnlineStatus}
            onCheckedChange={(checked) => handleNestedSettingChange('privacy', 'showOnlineStatus', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Allow Story Viewing</p>
            <p className="text-sm text-muted-foreground">Let others view your stories</p>
          </div>
          <Switch
            checked={settings.privacy.allowStoryViewing}
            onCheckedChange={(checked) => handleNestedSettingChange('privacy', 'allowStoryViewing', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Share Location</p>
            <p className="text-sm text-muted-foreground">Share approximate location with mesh</p>
          </div>
          <Switch
            checked={settings.privacy.shareLocation}
            onCheckedChange={(checked) => handleNestedSettingChange('privacy', 'shareLocation', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Auto-Accept Connections</p>
            <p className="text-sm text-muted-foreground">Automatically accept mesh connections</p>
          </div>
          <Switch
            checked={settings.privacy.autoAcceptConnections}
            onCheckedChange={(checked) => handleNestedSettingChange('privacy', 'autoAcceptConnections', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Require PIN for Vault</p>
            <p className="text-sm text-muted-foreground">Secure vault access with PIN</p>
          </div>
          <Switch
            checked={settings.security.requirePinForVault}
            onCheckedChange={(checked) => handleNestedSettingChange('security', 'requirePinForVault', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Biometrics</p>
            <p className="text-sm text-muted-foreground">Use fingerprint/face unlock</p>
          </div>
          <Switch
            checked={settings.security.enableBiometrics}
            onCheckedChange={(checked) => handleNestedSettingChange('security', 'enableBiometrics', checked)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Auto-Lock Timeout (minutes)</label>
          <Select 
            value={String(settings.security.autoLockTimeout)}
            onValueChange={(value) => handleNestedSettingChange('security', 'autoLockTimeout', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="0">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Encryption Level</label>
          <Select 
            value={settings.security.encryptionLevel}
            onValueChange={(value: 'standard' | 'high' | 'military') => handleNestedSettingChange('security', 'encryptionLevel', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard (AES-256)</SelectItem>
              <SelectItem value="high">High (AES-256 + RSA-4096)</SelectItem>
              <SelectItem value="military">Military (AES-256 + Post-Quantum)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Message Notifications</p>
            <p className="text-sm text-muted-foreground">Get notified of new messages</p>
          </div>
          <Switch
            checked={settings.notifications.messages}
            onCheckedChange={(checked) => handleNestedSettingChange('notifications', 'messages', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Story Notifications</p>
            <p className="text-sm text-muted-foreground">Get notified of new stories</p>
          </div>
          <Switch
            checked={settings.notifications.stories}
            onCheckedChange={(checked) => handleNestedSettingChange('notifications', 'stories', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Connection Notifications</p>
            <p className="text-sm text-muted-foreground">Get notified of new connections</p>
          </div>
          <Switch
            checked={settings.notifications.connections}
            onCheckedChange={(checked) => handleNestedSettingChange('notifications', 'connections', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sound Notifications</p>
            <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
          </div>
          <Switch
            checked={settings.notifications.sound}
            onCheckedChange={(checked) => handleNestedSettingChange('notifications', 'sound', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderThemeSection = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Theme</label>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Button
            variant={settings.theme === 'light' ? 'default' : 'outline'}
            onClick={() => handleSettingChange('theme', 'light')}
            className="flex items-center gap-2"
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={settings.theme === 'dark' ? 'default' : 'outline'}
            onClick={() => handleSettingChange('theme', 'dark')}
            className="flex items-center gap-2"
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={settings.theme === 'system' ? 'default' : 'outline'}
            onClick={() => handleSettingChange('theme', 'system')}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            System
          </Button>
        </div>
      </div>
    </div>
  );

  const renderConnectivitySection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Bluetooth</p>
            <p className="text-sm text-muted-foreground">Use Bluetooth for mesh connections</p>
          </div>
          <Switch
            checked={settings.connectivity.enableBluetooth}
            onCheckedChange={(checked) => handleNestedSettingChange('connectivity', 'enableBluetooth', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable WebRTC</p>
            <p className="text-sm text-muted-foreground">Use WebRTC for peer connections</p>
          </div>
          <Switch
            checked={settings.connectivity.enableWebRTC}
            onCheckedChange={(checked) => handleNestedSettingChange('connectivity', 'enableWebRTC', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Mesh Relay</p>
            <p className="text-sm text-muted-foreground">Relay messages for others</p>
          </div>
          <Switch
            checked={settings.connectivity.meshRelay}
            onCheckedChange={(checked) => handleNestedSettingChange('connectivity', 'meshRelay', checked)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Max Connections: {settings.connectivity.maxConnections}</label>
          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={settings.connectivity.maxConnections}
            onChange={(e) => handleNestedSettingChange('connectivity', 'maxConnections', parseInt(e.target.value))}
            className="w-full mt-2"
          />
        </div>
      </div>
    </div>
  );

  const renderVaultSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Auto Backup</p>
            <p className="text-sm text-muted-foreground">Automatically backup vault data</p>
          </div>
          <Switch
            checked={settings.vault.autoBackup}
            onCheckedChange={(checked) => handleNestedSettingChange('vault', 'autoBackup', checked)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Compression Level: {settings.vault.compressionLevel}</label>
          <input
            type="range"
            min="1"
            max="9"
            value={settings.vault.compressionLevel}
            onChange={(e) => handleNestedSettingChange('vault', 'compressionLevel', parseInt(e.target.value))}
            className="w-full mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Retention Days</label>
          <Select 
            value={String(settings.vault.retentionDays)}
            onValueChange={(value) => handleNestedSettingChange('vault', 'retentionDays', parseInt(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
              <SelectItem value="0">Forever</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderNodeSection = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Public Node</p>
            <p className="text-sm text-muted-foreground">Make node discoverable by others</p>
          </div>
          <Switch
            checked={settings.node.isPublic}
            onCheckedChange={(checked) => handleNestedSettingChange('node', 'isPublic', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Points Earning</p>
            <p className="text-sm text-muted-foreground">Earn points for network participation</p>
          </div>
          <Switch
            checked={settings.node.pointsEarning}
            onCheckedChange={(checked) => handleNestedSettingChange('node', 'pointsEarning', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Badge Display</p>
            <p className="text-sm text-muted-foreground">Show achievement badges</p>
          </div>
          <Switch
            checked={settings.node.badgeDisplay}
            onCheckedChange={(checked) => handleNestedSettingChange('node', 'badgeDisplay', checked)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Relay Capacity: {settings.node.relayCapacity}</label>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={settings.node.relayCapacity}
            onChange={(e) => handleNestedSettingChange('node', 'relayCapacity', parseInt(e.target.value))}
            className="w-full mt-2"
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'account': return renderAccountSection();
      case 'privacy': return renderPrivacySection();
      case 'security': return renderSecuritySection();
      case 'notifications': return renderNotificationsSection();
      case 'vault': return renderVaultSection();
      case 'node': return renderNodeSection();
      case 'theme': return renderThemeSection();
      case 'connectivity': return renderConnectivitySection();
      default: return renderAccountSection();
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background/50 backdrop-blur-sm">
        <div className="p-4">
          <NeonText className="text-lg font-bold">Settings</NeonText>
        </div>
        <div className="space-y-1 p-2">
          {sectionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                variant={activeSection === item.key ? 'default' : 'ghost'}
                onClick={() => setActiveSection(item.key as any)}
                className="w-full justify-start"
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <FuturisticCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(sectionItems.find(s => s.key === activeSection)?.icon || Settings, { className: "h-5 w-5" })}
              {sectionItems.find(s => s.key === activeSection)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCurrentSection()}
            
            {isDirty && (
              <div className="mt-6 pt-6 border-t flex gap-3">
                <GlowButton 
                  onClick={handleSave} 
                  disabled={updateUserMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </GlowButton>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSettings(defaultSettings);
                    setEditedUser(currentUser || {});
                    setIsDirty(false);
                  }}
                >
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </FuturisticCard>
      </div>
    </div>
  );
}