import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  Wifi,
  WifiOff,
  Bluetooth,
  Radio,
  Signal,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Globe,
  Smartphone,
  Laptop,
  Monitor,
  Router,
  Zap,
  Eye,
  Users,
  MessageSquare,
  CloudOff,
  Cloud,
  Activity,
  Gauge,
  Settings
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

interface ConnectivityState {
  isOnline: boolean;
  websocketConnected: boolean;
  bluetoothAvailable: boolean;
  webrtcSupported: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  signalStrength: number;
  latency: number;
  reconnectAttempts: number;
  lastReconnect: Date | null;
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'mobile' | 'laptop' | 'desktop' | 'router';
  distance: number;
  signalStrength: number;
  connectionType: 'bluetooth' | 'webrtc' | 'wifi' | 'mesh';
  isConnected: boolean;
  lastSeen: Date;
  user?: User;
}

interface EnhancedConnectivityProps {
  currentUser: User;
  availableUsers: User[];
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    sendMessage: (message: any) => void;
    reconnect: () => void;
  };
  onOfflineMode: (enabled: boolean) => void;
}

export function EnhancedConnectivitySystem({ 
  currentUser, 
  availableUsers, 
  wsState,
  onOfflineMode 
}: EnhancedConnectivityProps) {
  const [connectivity, setConnectivity] = useState<ConnectivityState>({
    isOnline: navigator.onLine,
    websocketConnected: wsState.isConnected,
    bluetoothAvailable: false,
    webrtcSupported: false,
    connectionQuality: 'offline',
    signalStrength: 0,
    latency: 0,
    reconnectAttempts: 0,
    lastReconnect: null
  });

  const [nearbyNodes, setNearbyNodes] = useState<NetworkNode[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [meshDiscovery, setMeshDiscovery] = useState(true);
  const [bluetoothScanning, setBluetoothScanning] = useState(false);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latencyTestRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check device capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      const bluetoothAvailable = 'bluetooth' in navigator;
      const webrtcSupported = !!(window.RTCPeerConnection);
      
      setConnectivity(prev => ({
        ...prev,
        bluetoothAvailable,
        webrtcSupported
      }));
    };

    checkCapabilities();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectivity(prev => ({ ...prev, isOnline: true }));
      if (autoReconnect && !wsState.isConnected) {
        wsState.reconnect();
      }
      toast({
        title: "Connection Restored",
        description: "Internet connection is back online",
      });
    };

    const handleOffline = () => {
      setConnectivity(prev => ({ ...prev, isOnline: false, connectionQuality: 'offline' }));
      setOfflineMode(true);
      onOfflineMode(true);
      toast({
        title: "Connection Lost",
        description: "Switched to offline mode",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoReconnect, wsState, onOfflineMode, toast]);

  // Update connectivity state based on WebSocket
  useEffect(() => {
    setConnectivity(prev => ({
      ...prev,
      websocketConnected: wsState.isConnected,
      connectionQuality: wsState.isConnected 
        ? (prev.signalStrength > 80 ? 'excellent' : 
           prev.signalStrength > 60 ? 'good' : 
           prev.signalStrength > 40 ? 'fair' : 'poor')
        : 'offline'
    }));
  }, [wsState.isConnected]);

  // Latency testing
  useEffect(() => {
    if (!wsState.isConnected) return;

    const testLatency = () => {
      const start = Date.now();
      
      // Send ping and measure response time
      wsState.sendMessage({
        type: 'ping',
        timestamp: start
      });

      // Simulate latency measurement (in real implementation, this would be handled by response)
      const latency = Math.random() * 100 + 20; // 20-120ms
      setConnectivity(prev => ({
        ...prev,
        latency,
        signalStrength: Math.max(0, 100 - latency)
      }));
    };

    latencyTestRef.current = setInterval(testLatency, 5000);

    return () => {
      if (latencyTestRef.current) {
        clearInterval(latencyTestRef.current);
      }
    };
  }, [wsState.isConnected, wsState.sendMessage]);

  // Auto-reconnect logic
  const handleReconnect = useCallback(() => {
    if (!connectivity.isOnline || wsState.isConnected) return;

    setConnectivity(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1,
      lastReconnect: new Date()
    }));

    wsState.reconnect();

    toast({
      title: "Reconnecting...",
      description: `Attempt ${connectivity.reconnectAttempts + 1}`,
    });
  }, [connectivity.isOnline, connectivity.reconnectAttempts, wsState, toast]);

  // Bluetooth device discovery
  const scanBluetoothDevices = async () => {
    if (!connectivity.bluetoothAvailable) {
      toast({
        title: "Bluetooth Not Available",
        description: "This device doesn't support Bluetooth",
        variant: "destructive"
      });
      return;
    }

    setBluetoothScanning(true);
    
    try {
      // Simulate bluetooth scanning (real implementation would use Web Bluetooth API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockDevices: NetworkNode[] = [
        {
          id: 'bt-device-1',
          name: 'Nearby Phone',
          type: 'mobile',
          distance: 5,
          signalStrength: 85,
          connectionType: 'bluetooth',
          isConnected: false,
          lastSeen: new Date()
        },
        {
          id: 'bt-device-2',
          name: 'Laptop User',
          type: 'laptop',
          distance: 12,
          signalStrength: 65,
          connectionType: 'bluetooth',
          isConnected: false,
          lastSeen: new Date()
        }
      ];

      setNearbyNodes(prev => {
        const existing = prev.filter(node => node.connectionType !== 'bluetooth');
        return [...existing, ...mockDevices];
      });

      toast({
        title: "Bluetooth Scan Complete",
        description: `Found ${mockDevices.length} nearby devices`,
      });
    } catch (error) {
      toast({
        title: "Bluetooth Scan Failed",
        description: "Failed to scan for nearby devices",
        variant: "destructive"
      });
    } finally {
      setBluetoothScanning(false);
    }
  };

  // Generate mesh network nodes
  useEffect(() => {
    if (!meshDiscovery) return;

    const generateMeshNodes = () => {
      const meshNodes: NetworkNode[] = availableUsers.slice(0, 5).map((user, index) => ({
        id: `mesh-${user.id}`,
        name: user.alias,
        type: Math.random() > 0.5 ? 'mobile' : 'laptop',
        distance: Math.floor(Math.random() * 100) + 10,
        signalStrength: Math.floor(Math.random() * 80) + 20,
        connectionType: 'mesh',
        isConnected: Math.random() > 0.3,
        lastSeen: new Date(),
        user
      }));

      setNearbyNodes(prev => {
        const existing = prev.filter(node => node.connectionType !== 'mesh');
        return [...existing, ...meshNodes];
      });
    };

    generateMeshNodes();
    const interval = setInterval(generateMeshNodes, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [availableUsers, meshDiscovery]);

  const getConnectionIcon = () => {
    if (!connectivity.isOnline) return CloudOff;
    if (!connectivity.websocketConnected) return WifiOff;
    if (connectivity.connectionQuality === 'excellent') return Signal;
    if (connectivity.connectionQuality === 'good') return Wifi;
    return Radio;
  };

  const getConnectionColor = () => {
    if (!connectivity.isOnline) return 'text-red-500';
    if (!connectivity.websocketConnected) return 'text-yellow-500';
    if (connectivity.connectionQuality === 'excellent') return 'text-green-500';
    if (connectivity.connectionQuality === 'good') return 'text-blue-500';
    return 'text-orange-500';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'laptop': return Laptop;
      case 'desktop': return Monitor;
      case 'router': return Router;
      default: return Monitor;
    }
  };

  const ConnectionIcon = getConnectionIcon();

  return (
    <div className="w-full h-full bg-background p-4 space-y-6">
      {/* Connection Status Header */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ConnectionIcon className={`w-5 h-5 ${getConnectionColor()}`} />
              <span>Network Status</span>
            </div>
            <Badge 
              variant={connectivity.websocketConnected ? "default" : "destructive"}
              className={connectivity.websocketConnected ? "bg-green-600" : ""}
            >
              {connectivity.websocketConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Quality */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getConnectionColor()}`}>
                {connectivity.signalStrength}%
              </div>
              <div className="text-sm text-muted-foreground">Signal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {connectivity.latency}ms
              </div>
              <div className="text-sm text-muted-foreground">Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {nearbyNodes.filter(n => n.isConnected).length}
              </div>
              <div className="text-sm text-muted-foreground">Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {connectivity.reconnectAttempts}
              </div>
              <div className="text-sm text-muted-foreground">Reconnects</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Connection Quality</span>
              <span className="capitalize">{connectivity.connectionQuality}</span>
            </div>
            <Progress 
              value={connectivity.signalStrength} 
              className={`h-2 ${
                connectivity.signalStrength > 80 ? 'bg-green-100' :
                connectivity.signalStrength > 60 ? 'bg-blue-100' :
                connectivity.signalStrength > 40 ? 'bg-yellow-100' : 'bg-red-100'
              }`}
            />
          </div>

          {/* Offline Alert */}
          {!connectivity.isOnline && (
            <Alert className="border-red-500/50 bg-red-50 dark:bg-red-900/20">
              <CloudOff className="h-4 w-4" />
              <AlertDescription>
                You're currently offline. Some features may not be available.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Controls */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Connection Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="offline-mode"
                    checked={offlineMode}
                    onCheckedChange={(checked) => {
                      setOfflineMode(checked);
                      onOfflineMode(checked);
                    }}
                  />
                  <Label htmlFor="offline-mode">Offline Mode</Label>
                </div>
                <Badge variant="outline">
                  {offlineMode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-reconnect"
                    checked={autoReconnect}
                    onCheckedChange={setAutoReconnect}
                  />
                  <Label htmlFor="auto-reconnect">Auto Reconnect</Label>
                </div>
                <Badge variant="outline">
                  {autoReconnect ? 'On' : 'Off'}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="mesh-discovery"
                    checked={meshDiscovery}
                    onCheckedChange={setMeshDiscovery}
                  />
                  <Label htmlFor="mesh-discovery">Mesh Discovery</Label>
                </div>
                <Badge variant="outline">
                  {meshDiscovery ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleReconnect}
                  disabled={wsState.isConnected || !connectivity.isOnline}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reconnect
                </Button>
                <Button
                  onClick={scanBluetoothDevices}
                  disabled={bluetoothScanning || !connectivity.bluetoothAvailable}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Bluetooth className="w-4 h-4 mr-1" />
                  {bluetoothScanning ? 'Scanning...' : 'Scan'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Nodes */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Nearby Nodes ({nearbyNodes.length})
            </div>
            <Button
              onClick={() => setNearbyNodes([])}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {nearbyNodes.map((node) => {
                const DeviceIcon = getDeviceIcon(node.type);
                return (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <DeviceIcon className="w-8 h-8 text-muted-foreground" />
                        <div 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            node.isConnected ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{node.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{node.distance}m away</span>
                          <Badge variant="outline" className="text-xs">
                            {node.connectionType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className="font-medium">{node.signalStrength}%</div>
                        <div className="text-muted-foreground">
                          {node.lastSeen.toLocaleTimeString()}
                        </div>
                      </div>
                      <Button
                        variant={node.isConnected ? "default" : "outline"}
                        size="sm"
                        disabled={!connectivity.isOnline}
                      >
                        {node.isConnected ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Connected
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-1" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {nearbyNodes.length === 0 && (
                <div className="text-center py-8">
                  <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No nearby nodes detected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable mesh discovery to find other devices
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Connection History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Connection History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {connectivity.lastReconnect && (
              <div className="flex items-center justify-between p-2 bg-accent/30 rounded">
                <span className="text-sm">Last reconnection attempt</span>
                <span className="text-sm text-muted-foreground">
                  {connectivity.lastReconnect.toLocaleTimeString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Total reconnection attempts</span>
              <Badge variant="outline">{connectivity.reconnectAttempts}</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">WebRTC Support</span>
              <Badge variant={connectivity.webrtcSupported ? "default" : "destructive"}>
                {connectivity.webrtcSupported ? 'Available' : 'Not Available'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Bluetooth Support</span>
              <Badge variant={connectivity.bluetoothAvailable ? "default" : "destructive"}>
                {connectivity.bluetoothAvailable ? 'Available' : 'Not Available'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}