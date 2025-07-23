import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Shield, 
  Bluetooth, 
  Bell, 
  Volume2, 
  VolumeX,
  Moon,
  Sun,
  Monitor,
  Network,
  Database,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface EnhancedSettingsPanelProps {
  isOfflineMode: boolean;
  onOfflineModeChange: (enabled: boolean) => void;
  onLogout: () => void;
}

export function EnhancedSettingsPanel({ 
  isOfflineMode, 
  onOfflineModeChange,
  onLogout 
}: EnhancedSettingsPanelProps) {
  const [settings, setSettings] = useState({
    notifications: true,
    sounds: true,
    darkMode: true,
    autoConnect: true,
    bluetoothEnabled: false,
    showOnlineStatus: true,
    autoDownload: false,
    encryptionLevel: 'high' as 'low' | 'medium' | 'high'
  });
  
  const [connectionStats, setConnectionStats] = useState({
    totalConnections: 0,
    messagesExchanged: 0,
    dataTransferred: '0 MB',
    uptime: '0m'
  });

  const { toast } = useToast();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('meshbook-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('meshbook-settings', JSON.stringify(newSettings));
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleOfflineToggle = (enabled: boolean) => {
    onOfflineModeChange(enabled);
    if (enabled) {
      toast({
        title: "Offline Mode Enabled",
        description: "You can browse cached content and queue messages for later.",
      });
    } else {
      toast({
        title: "Online Mode Enabled",
        description: "Reconnecting to the mesh network...",
      });
    }
  };

  const clearCache = () => {
    localStorage.removeItem('meshbook-cache');
    localStorage.removeItem('meshbook-offline-data');
    toast({
      title: "Cache Cleared",
      description: "All cached data has been removed.",
    });
  };

  const exportData = () => {
    const userData = localStorage.getItem('meshbook-user');
    const settingsData = localStorage.getItem('meshbook-settings');
    const cacheData = localStorage.getItem('meshbook-cache');
    
    const exportData = {
      user: userData ? JSON.parse(userData) : null,
      settings: settingsData ? JSON.parse(settingsData) : null,
      cache: cacheData ? JSON.parse(cacheData) : null,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meshbook-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your data has been downloaded successfully.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Connection Settings */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Network className="w-5 h-5" />
            Network & Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="offline-mode" className="text-white">Offline Mode</Label>
                  <Badge variant={isOfflineMode ? "destructive" : "default"}>
                    {isOfflineMode ? 'Offline' : 'Online'}
                  </Badge>
                </div>
                <Switch
                  id="offline-mode"
                  checked={isOfflineMode}
                  onCheckedChange={handleOfflineToggle}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-connect" className="text-white">Auto-reconnect</Label>
                <Switch
                  id="auto-connect"
                  checked={settings.autoConnect}
                  onCheckedChange={(checked) => handleSettingChange('autoConnect', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="bluetooth" className="text-white">Bluetooth Discovery</Label>
                <Switch
                  id="bluetooth"
                  checked={settings.bluetoothEnabled}
                  onCheckedChange={(checked) => handleSettingChange('bluetoothEnabled', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-cyan-400 mb-3">Connection Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Connections</div>
                    <div className="text-white font-medium">{connectionStats.totalConnections}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Messages</div>
                    <div className="text-white font-medium">{connectionStats.messagesExchanged}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Data</div>
                    <div className="text-white font-medium">{connectionStats.dataTransferred}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Uptime</div>
                    <div className="text-white font-medium">{connectionStats.uptime}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-status" className="text-white">Show Online Status</Label>
                <Switch
                  id="show-status"
                  checked={settings.showOnlineStatus}
                  onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-download" className="text-white">Auto-download Media</Label>
                <Switch
                  id="auto-download"
                  checked={settings.autoDownload}
                  onCheckedChange={(checked) => handleSettingChange('autoDownload', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Encryption Level</Label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={settings.encryptionLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSettingChange('encryptionLevel', level)}
                      className={`capitalize ${
                        settings.encryptionLevel === level 
                          ? 'bg-green-600 hover:bg-green-500' 
                          : 'border-green-500/50 text-green-400'
                      }`}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Appearance */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Bell className="w-5 h-5" />
            Notifications & Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-white">Push Notifications</Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sounds" className="text-white">Sound Effects</Label>
                <Switch
                  id="sounds"
                  checked={settings.sounds}
                  onCheckedChange={(checked) => handleSettingChange('sounds', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="text-white">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={exportData}
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            
            <Button
              variant="outline"
              onClick={clearCache}
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            
            <Button
              variant="destructive"
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}