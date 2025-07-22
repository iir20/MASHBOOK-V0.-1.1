import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Bluetooth, 
  Radio, 
  Globe, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Network,
  Router,
  Smartphone,
  Signal
} from 'lucide-react';

interface ConnectivityManagerProps {
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    lastConnected?: Date;
    reconnectAttempts: number;
  };
  onReconnect: () => void;
}

export function ConnectivityManager({ wsState, onReconnect }: ConnectivityManagerProps) {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    webrtc: false,
    bluetooth: false,
    meshNodes: 0,
    signalStrength: 75
  });
  
  const [connectivityOptions, setConnectivityOptions] = useState({
    autoReconnect: true,
    bluetoothEnabled: false,
    meshRouting: true,
    offlineMode: false
  });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setNetworkStatus(prev => ({ ...prev, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check WebRTC support
  useEffect(() => {
    const checkWebRTC = () => {
      const hasRTC = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
      setNetworkStatus(prev => ({ ...prev, webrtc: hasRTC }));
    };
    
    checkWebRTC();
  }, []);

  // Check Bluetooth support
  useEffect(() => {
    const checkBluetooth = async () => {
      if ('bluetooth' in navigator) {
        try {
          const available = await (navigator.bluetooth as any).getAvailability();
          setNetworkStatus(prev => ({ ...prev, bluetooth: available }));
        } catch (error) {
          setNetworkStatus(prev => ({ ...prev, bluetooth: false }));
        }
      }
    };
    
    checkBluetooth();
  }, []);

  // Simulate mesh network discovery
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsState.isConnected) {
        setNetworkStatus(prev => ({
          ...prev,
          meshNodes: Math.floor(Math.random() * 8) + 1,
          signalStrength: Math.floor(Math.random() * 40) + 60
        }));
      } else {
        setNetworkStatus(prev => ({
          ...prev,
          meshNodes: 0,
          signalStrength: Math.floor(Math.random() * 30) + 20
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [wsState.isConnected]);

  const getConnectionStatusColor = () => {
    if (wsState.isConnected) return 'text-green-400';
    if (wsState.reconnectAttempts > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConnectionStatusIcon = () => {
    if (wsState.isConnected) return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (wsState.reconnectAttempts > 0) return <Activity className="h-5 w-5 text-yellow-400 animate-pulse" />;
    return <AlertTriangle className="h-5 w-5 text-red-400" />;
  };

  const handleBluetoothToggle = async (enabled: boolean) => {
    if (enabled && 'bluetooth' in navigator) {
      try {
        await (navigator.bluetooth as any).requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service']
        });
        setConnectivityOptions(prev => ({ ...prev, bluetoothEnabled: true }));
      } catch (error) {
        console.error('Bluetooth request failed:', error);
        setConnectivityOptions(prev => ({ ...prev, bluetoothEnabled: false }));
      }
    } else {
      setConnectivityOptions(prev => ({ ...prev, bluetoothEnabled: enabled }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Connection Status Overview */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-emerald-400 flex items-center">
            <Network className="h-5 w-5 mr-2" />
            Network Status
          </CardTitle>
          <CardDescription>
            Real-time connectivity and mesh network status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Internet Connection */}
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              {networkStatus.online ? (
                <Globe className="h-6 w-6 text-green-400" />
              ) : (
                <Globe className="h-6 w-6 text-red-400" />
              )}
              <div>
                <p className="font-medium text-white">Internet</p>
                <p className={`text-sm ${networkStatus.online ? 'text-green-400' : 'text-red-400'}`}>
                  {networkStatus.online ? 'Connected' : 'Offline'}
                </p>
              </div>
            </div>

            {/* WebSocket Connection */}
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              {getConnectionStatusIcon()}
              <div>
                <p className="font-medium text-white">WebSocket</p>
                <p className={`text-sm ${getConnectionStatusColor()}`}>
                  {wsState.isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            {/* Mesh Network */}
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <Router className="h-6 w-6 text-cyan-400" />
              <div>
                <p className="font-medium text-white">Mesh Nodes</p>
                <p className="text-sm text-cyan-400">{networkStatus.meshNodes} peers</p>
              </div>
            </div>

            {/* Signal Strength */}
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <Signal className="h-6 w-6 text-blue-400" />
              <div>
                <p className="font-medium text-white">Signal</p>
                <p className="text-sm text-blue-400">{networkStatus.signalStrength}%</p>
                <Progress value={networkStatus.signalStrength} className="mt-1 h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connectivity Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Settings */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Connection Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Auto Reconnect</p>
                <p className="text-sm text-gray-400">Automatically reconnect when connection drops</p>
              </div>
              <Switch
                checked={connectivityOptions.autoReconnect}
                onCheckedChange={(checked) => 
                  setConnectivityOptions(prev => ({ ...prev, autoReconnect: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Bluetooth Mesh</p>
                <p className="text-sm text-gray-400">Enable Bluetooth device discovery</p>
              </div>
              <Switch
                checked={connectivityOptions.bluetoothEnabled}
                onCheckedChange={handleBluetoothToggle}
                disabled={!networkStatus.bluetooth}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Mesh Routing</p>
                <p className="text-sm text-gray-400">Allow messages to route through this device</p>
              </div>
              <Switch
                checked={connectivityOptions.meshRouting}
                onCheckedChange={(checked) => 
                  setConnectivityOptions(prev => ({ ...prev, meshRouting: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Offline Mode</p>
                <p className="text-sm text-gray-400">Prioritize local mesh over internet</p>
              </div>
              <Switch
                checked={connectivityOptions.offlineMode}
                onCheckedChange={(checked) => 
                  setConnectivityOptions(prev => ({ ...prev, offlineMode: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Connection Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!wsState.isConnected && (
              <Alert className="border-red-500/50 bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  WebSocket connection lost. Messages will queue until reconnected.
                </AlertDescription>
              </Alert>
            )}

            {!networkStatus.online && (
              <Alert className="border-yellow-500/50 bg-yellow-900/20">
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="text-yellow-200">
                  No internet connection. Using mesh network only.
                </AlertDescription>
              </Alert>
            )}

            {!networkStatus.webrtc && (
              <Alert className="border-orange-500/50 bg-orange-900/20">
                <Radio className="h-4 w-4" />
                <AlertDescription className="text-orange-200">
                  WebRTC not supported. Peer-to-peer features disabled.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button 
                onClick={onReconnect}
                disabled={wsState.isConnected}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Force Reconnect
              </Button>
              
              <div className="text-xs text-gray-400 text-center">
                Last connected: {wsState.lastConnected ? 
                  wsState.lastConnected.toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technology Status */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Technology Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-blue-400" />
                <span className="text-white">WebRTC</span>
              </div>
              <Badge variant={networkStatus.webrtc ? "default" : "destructive"}>
                {networkStatus.webrtc ? 'Supported' : 'Not Available'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bluetooth className="h-5 w-5 text-blue-400" />
                <span className="text-white">Bluetooth</span>
              </div>
              <Badge variant={networkStatus.bluetooth ? "default" : "destructive"}>
                {networkStatus.bluetooth ? 'Available' : 'Not Available'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Network className="h-5 w-5 text-green-400" />
                <span className="text-white">Mesh Network</span>
              </div>
              <Badge variant={connectivityOptions.meshRouting ? "default" : "secondary"}>
                {connectivityOptions.meshRouting ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}