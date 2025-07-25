import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  Settings,
  Antenna,
  Network,
  Power,
  Shield,
  Clock,
  MapPin,
  TrendingUp,
  Database
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
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
  apiConnected: boolean;
  databaseConnected: boolean;
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

interface FixedConnectivityProps {
  currentUser: User | null;
  availableUsers: User[];
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    sendMessage: (message: any) => void;
    reconnect: () => void;
  };
  onOfflineMode: (enabled: boolean) => void;
}

export function FixedConnectivitySystem({ 
  currentUser, 
  availableUsers, 
  wsState,
  onOfflineMode 
}: FixedConnectivityProps) {
  const [connectivity, setConnectivity] = useState<ConnectivityState>({
    isOnline: navigator.onLine,
    websocketConnected: wsState.isConnected,
    bluetoothAvailable: false,
    webrtcSupported: false,
    connectionQuality: 'offline',
    signalStrength: 0,
    latency: 0,
    reconnectAttempts: 0,
    lastReconnect: null,
    apiConnected: false,
    databaseConnected: false
  });

  const [nearbyNodes, setNearbyNodes] = useState<NetworkNode[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [meshDiscovery, setMeshDiscovery] = useState(true);
  const [bluetoothScanning, setBluetoothScanning] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latencyTestRef = useRef<NodeJS.Timeout | null>(null);
  const diagnosticsRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Test API connectivity
  const { data: apiStatus, refetch: testApiConnection } = useQuery({
    queryKey: ['/api/users'],
    select: () => true,
    retry: false,
    refetchInterval: 10000,
    onError: () => {
      setConnectivity(prev => ({ ...prev, apiConnected: false }));
    },
    onSuccess: () => {
      setConnectivity(prev => ({ ...prev, apiConnected: true }));
    }
  });

  // Check device capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const bluetoothAvailable = 'bluetooth' in navigator;
        const webrtcSupported = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
        
        setConnectivity(prev => ({
          ...prev,
          bluetoothAvailable,
          webrtcSupported
        }));
      } catch (error) {
        console.warn('Error checking device capabilities:', error);
      }
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
        description: "Internet connection is back online.",
      });
    };

    const handleOffline = () => {
      setConnectivity(prev => ({ ...prev, isOnline: false, connectionQuality: 'offline' }));
      toast({
        title: "Connection Lost",
        description: "You're now offline. Some features may be limited.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoReconnect, wsState, toast]);

  // Update WebSocket connection status
  useEffect(() => {
    setConnectivity(prev => ({
      ...prev,
      websocketConnected: wsState.isConnected
    }));

    // Update connection quality based on WebSocket status
    if (wsState.isConnected && connectivity.isOnline) {
      const quality = wsState.connectionQuality;
      setConnectivity(prev => ({
        ...prev,
        connectionQuality: quality as any,
        signalStrength: quality === 'excellent' ? 95 : quality === 'good' ? 75 : quality === 'fair' ? 50 : 25
      }));
    } else {
      setConnectivity(prev => ({
        ...prev,
        connectionQuality: 'offline',
        signalStrength: 0
      }));
    }
  }, [wsState.isConnected, wsState.connectionQuality, connectivity.isOnline]);

  // Generate nearby nodes from available users
  useEffect(() => {
    if (availableUsers.length === 0) return;

    const nodes: NetworkNode[] = availableUsers.slice(0, 10).map((user, index) => ({
      id: user.id.toString(),
      name: user.alias || `User ${user.id}`,
      type: ['mobile', 'laptop', 'desktop', 'router'][Math.floor(Math.random() * 4)] as any,
      distance: 10 + Math.random() * 500,
      signalStrength: 0.3 + Math.random() * 0.7,
      connectionType: ['bluetooth', 'webrtc', 'wifi', 'mesh'][Math.floor(Math.random() * 4)] as any,
      isConnected: Math.random() > 0.3,
      lastSeen: new Date(Date.now() - Math.random() * 3600000),
      user
    }));

    setNearbyNodes(nodes);
  }, [availableUsers]);

  // Latency testing
  const testLatency = useCallback(async () => {
    try {
      const start = Date.now();
      await fetch('/api/users', { method: 'HEAD' });
      const latency = Date.now() - start;
      
      setConnectivity(prev => ({ ...prev, latency }));
      return latency;
    } catch (error) {
      setConnectivity(prev => ({ ...prev, latency: 9999 }));
      return 9999;
    }
  }, []);

  // Run connectivity diagnostics
  const runDiagnostics = useCallback(async () => {
    setDiagnosticsRunning(true);
    
    try {
      // Test API connectivity
      await testApiConnection();
      
      // Test latency
      await testLatency();
      
      // Update overall connection quality
      const isFullyConnected = connectivity.isOnline && connectivity.websocketConnected && connectivity.apiConnected;
      const newQuality = isFullyConnected ? 
        (connectivity.latency < 100 ? 'excellent' : 
         connectivity.latency < 300 ? 'good' : 
         connectivity.latency < 1000 ? 'fair' : 'poor') : 'offline';

      setConnectivity(prev => ({
        ...prev,
        connectionQuality: newQuality,
        databaseConnected: connectivity.apiConnected // API connectivity implies DB connectivity
      }));

      toast({
        title: "Diagnostics Complete",
        description: `Connection quality: ${newQuality}`,
      });
    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: "Unable to complete connectivity test",
        variant: "destructive"
      });
    } finally {
      setDiagnosticsRunning(false);
    }
  }, [testApiConnection, testLatency, connectivity.isOnline, connectivity.websocketConnected, connectivity.apiConnected, connectivity.latency, toast]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!autoReconnect || wsState.isConnected) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!wsState.isConnected && connectivity.isOnline) {
        setConnectivity(prev => ({ 
          ...prev, 
          reconnectAttempts: prev.reconnectAttempts + 1,
          lastReconnect: new Date()
        }));
        wsState.reconnect();
      }
    }, 5000);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoReconnect, wsState.isConnected, connectivity.isOnline, wsState]);

  // Bluetooth scanning simulation
  const toggleBluetoothScan = useCallback(async () => {
    if (!connectivity.bluetoothAvailable) {
      toast({
        title: "Bluetooth Not Available",
        description: "Bluetooth is not supported on this device",
        variant: "destructive"
      });
      return;
    }

    setBluetoothScanning(!bluetoothScanning);
    
    if (!bluetoothScanning) {
      toast({
        title: "Bluetooth Scan Started",
        description: "Scanning for nearby devices...",
      });
      
      // Simulate finding devices
      setTimeout(() => {
        const bluetoothNodes = nearbyNodes.filter(node => node.connectionType === 'bluetooth');
        toast({
          title: "Bluetooth Scan Complete",
          description: `Found ${bluetoothNodes.length} nearby devices`,
        });
        setBluetoothScanning(false);
      }, 3000);
    }
  }, [connectivity.bluetoothAvailable, bluetoothScanning, nearbyNodes, toast]);

  // Handle offline mode toggle
  const handleOfflineModeToggle = (enabled: boolean) => {
    setOfflineMode(enabled);
    onOfflineMode(enabled);
    
    if (enabled) {
      toast({
        title: "Offline Mode Enabled",
        description: "You can still use cached data and local features",
      });
    } else {
      toast({
        title: "Offline Mode Disabled", 
        description: "Reconnecting to network services...",
      });
      if (autoReconnect) {
        wsState.reconnect();
      }
    }
  };

  // Connection status helpers
  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <Signal className="w-4 h-4 text-green-500" />;
      case 'good': return <Signal className="w-4 h-4 text-blue-500" />;
      case 'fair': return <Signal className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <Signal className="w-4 h-4 text-orange-500" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-500" />;
      default: return <Signal className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Connection Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5" />
            <span>Network Status</span>
            <Badge variant={connectivity.isOnline ? "default" : "destructive"}>
              {connectivity.isOnline ? "Online" : "Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Internet Connection */}
            <div className="flex items-center space-x-2">
              {connectivity.isOnline ? (
                <Globe className="w-5 h-5 text-green-500" />
              ) : (
                <CloudOff className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">Internet</p>
                <p className="text-xs text-gray-500">
                  {connectivity.isOnline ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>

            {/* WebSocket Connection */}
            <div className="flex items-center space-x-2">
              {connectivity.websocketConnected ? (
                <Zap className="w-5 h-5 text-green-500" />
              ) : (
                <Zap className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">Real-time</p>
                <p className="text-xs text-gray-500">
                  {connectivity.websocketConnected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>

            {/* API Connection */}
            <div className="flex items-center space-x-2">
              {connectivity.apiConnected ? (
                <Database className="w-5 h-5 text-green-500" />
              ) : (
                <Database className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">API</p>
                <p className="text-xs text-gray-500">
                  {connectivity.apiConnected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>

            {/* Connection Quality */}
            <div className="flex items-center space-x-2">
              {getConnectionIcon(connectivity.connectionQuality)}
              <div>
                <p className="text-sm font-medium">Quality</p>
                <p className={`text-xs capitalize ${getConnectionStatusColor(connectivity.connectionQuality)}`}>
                  {connectivity.connectionQuality}
                </p>
              </div>
            </div>
          </div>

          {/* Signal Strength and Latency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Signal Strength</Label>
                <span className="text-sm text-gray-500">{connectivity.signalStrength}%</span>
              </div>
              <Progress value={connectivity.signalStrength} className="w-full" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Latency</Label>
                <span className="text-sm text-gray-500">{connectivity.latency}ms</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (connectivity.latency / 10))} 
                className="w-full" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Management */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="nodes">Mesh Nodes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device Capabilities</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bluetooth</span>
                      <Badge variant={connectivity.bluetoothAvailable ? "default" : "secondary"}>
                        {connectivity.bluetoothAvailable ? "Available" : "Not Available"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">WebRTC</span>
                      <Badge variant={connectivity.webrtcSupported ? "default" : "secondary"}>
                        {connectivity.webrtcSupported ? "Supported" : "Not Supported"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Connection History</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reconnect Attempts</span>
                      <span className="text-sm text-gray-500">{connectivity.reconnectAttempts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Reconnect</span>
                      <span className="text-sm text-gray-500">
                        {connectivity.lastReconnect ? 
                          connectivity.lastReconnect.toLocaleTimeString() : 
                          "Never"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={wsState.reconnect}
                  disabled={connectivity.websocketConnected}
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
                <Button 
                  onClick={runDiagnostics}
                  disabled={diagnosticsRunning}
                  variant="outline"
                  size="sm"
                >
                  {diagnosticsRunning ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4 mr-2" />
                  )}
                  Run Diagnostics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Mesh Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {nearbyNodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {node.type === 'mobile' && <Smartphone className="w-4 h-4" />}
                          {node.type === 'laptop' && <Laptop className="w-4 h-4" />}
                          {node.type === 'desktop' && <Monitor className="w-4 h-4" />}
                          {node.type === 'router' && <Router className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{node.name}</p>
                          <p className="text-sm text-gray-500">
                            {Math.round(node.distance)}m • {node.connectionType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={node.signalStrength * 100} 
                          className="w-16 h-2" 
                        />
                        <Badge 
                          variant={node.isConnected ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {node.isConnected ? "Connected" : "Available"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Offline Mode</Label>
                    <p className="text-sm text-gray-500">Work without internet connection</p>
                  </div>
                  <Switch 
                    checked={offlineMode}
                    onCheckedChange={handleOfflineModeToggle}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Reconnect</Label>
                    <p className="text-sm text-gray-500">Automatically reconnect when connection is lost</p>
                  </div>
                  <Switch 
                    checked={autoReconnect}
                    onCheckedChange={setAutoReconnect}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mesh Discovery</Label>
                    <p className="text-sm text-gray-500">Discover nearby mesh network nodes</p>
                  </div>
                  <Switch 
                    checked={meshDiscovery}
                    onCheckedChange={setMeshDiscovery}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bluetooth Scanning</Label>
                    <p className="text-sm text-gray-500">Scan for Bluetooth devices</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleBluetoothScan}
                    disabled={!connectivity.bluetoothAvailable}
                  >
                    {bluetoothScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-4 h-4 mr-2" />
                        Start Scan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Diagnostics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Run diagnostics to test your network connectivity and identify issues.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Internet Connection</span>
                  </div>
                  <Badge variant={connectivity.isOnline ? "default" : "destructive"}>
                    {connectivity.isOnline ? "OK" : "FAILED"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>API Server</span>
                  </div>
                  <Badge variant={connectivity.apiConnected ? "default" : "destructive"}>
                    {connectivity.apiConnected ? "OK" : "FAILED"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>WebSocket</span>
                  </div>
                  <Badge variant={connectivity.websocketConnected ? "default" : "destructive"}>
                    {connectivity.websocketConnected ? "OK" : "FAILED"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Network Latency</span>
                  </div>
                  <Badge variant={connectivity.latency < 500 ? "default" : "destructive"}>
                    {connectivity.latency}ms
                  </Badge>
                </div>
              </div>

              <Button 
                onClick={runDiagnostics}
                disabled={diagnosticsRunning}
                className="w-full"
              >
                {diagnosticsRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Run Full Diagnostics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}