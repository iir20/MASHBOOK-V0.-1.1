import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Wifi,
  WifiOff,
  Bluetooth,
  Radio,
  Network,
  Globe,
  Signal,
  Activity,
  Zap,
  Shield,
  Cpu,
  HardDrive,
  Battery,
  Antenna,
  Satellite,
  Router,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Users,
  MapPin,
  Layers3
} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

interface ConnectionMetrics {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  signalStrength: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  uptime: number;
  dataTransferred: number;
}

interface NetworkNode {
  id: string;
  alias: string;
  meshCallsign: string;
  signalStrength: number;
  distance: number;
  connectionType: 'bluetooth' | 'webrtc' | 'wifi' | 'cellular';
  isOnline: boolean;
  lastSeen: Date;
  capabilities: string[];
  hops: number;
}

interface AdvancedConnectivityProps {
  currentUser: User;
  availableUsers: User[];
  wsState: {
    isConnected: boolean;
    connectionQuality: string;
    reconnectAttempts: number;
  };
}

export function AdvancedConnectivityManager({ 
  currentUser, 
  availableUsers, 
  wsState 
}: AdvancedConnectivityProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [autoConnect, setAutoConnect] = useState(true);
  const [meshEnabled, setMeshEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [webRTCEnabled, setWebRTCEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState<NetworkNode[]>([]);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    latency: 45,
    bandwidth: 2.4,
    packetLoss: 0.1,
    signalStrength: 85,
    quality: 'excellent',
    uptime: 98.5,
    dataTransferred: 156.7
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Get network status from API
  const { data: networkStatus } = useQuery({
    queryKey: ['/api/network/status'],
    refetchInterval: 5000
  });

  // Real-time network visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw network topology
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Central node (current user)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.fill();
      
      // Pulse effect
      const pulse = Math.sin(time * 3) * 5 + 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Connected nodes
      discoveredNodes.forEach((node, index) => {
        const angle = (index * Math.PI * 2) / discoveredNodes.length + time;
        const radius = 80 + Math.sin(time + index) * 20;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = node.isOnline ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = node.signalStrength / 20;
        ctx.stroke();

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = node.isOnline ? '#00ff00' : '#ff0000';
        ctx.fill();

        // Signal strength indicator
        for (let i = 0; i < 3; i++) {
          const strength = node.signalStrength / 100;
          if (strength > i * 0.33) {
            ctx.fillRect(x + 6, y - 6 + (i * 3), 2, 2);
          }
        }
      });

      // Data transmission visualization
      const dataFlows = 5;
      for (let i = 0; i < dataFlows; i++) {
        const progress = (time + i) % Math.PI * 2;
        const x = centerX + Math.cos(progress) * 60;
        const y = centerY + Math.sin(progress) * 60;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${180 + progress * 50}, 70%, 60%)`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [discoveredNodes]);

  // Simulate node discovery
  useEffect(() => {
    const simulateDiscovery = () => {
      const nodes: NetworkNode[] = availableUsers
        .filter(user => user.id !== currentUser.id)
        .map((user, index) => ({
          id: user.deviceId,
          alias: user.alias,
          meshCallsign: user.meshCallsign,
          signalStrength: Math.floor(Math.random() * 40) + 60,
          distance: Math.floor(Math.random() * 500) + 50,
          connectionType: ['bluetooth', 'webrtc', 'wifi'][Math.floor(Math.random() * 3)] as any,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          capabilities: user.nodeCapabilities,
          hops: Math.floor(Math.random() * 3) + 1
        }));
      
      setDiscoveredNodes(nodes);
    };

    simulateDiscovery();
    const interval = setInterval(simulateDiscovery, 10000);
    return () => clearInterval(interval);
  }, [availableUsers, currentUser.id]);

  // Update connection metrics
  useEffect(() => {
    const updateMetrics = () => {
      setConnectionMetrics(prev => ({
        ...prev,
        latency: Math.random() * 20 + 30,
        bandwidth: Math.random() * 2 + 2,
        packetLoss: Math.random() * 0.5,
        signalStrength: Math.random() * 20 + 70,
        quality: prev.signalStrength > 80 ? 'excellent' 
               : prev.signalStrength > 60 ? 'good'
               : prev.signalStrength > 40 ? 'fair' : 'poor'
      }));
    };

    const interval = setInterval(updateMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBluetoothScan = async () => {
    setIsScanning(true);
    
    try {
      if ('bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service']
        });
        
        toast({
          title: "Bluetooth Device Found",
          description: `Connected to ${device.name}`,
        });
        
        setBluetoothEnabled(true);
      }
    } catch (error) {
      toast({
        title: "Bluetooth Scan Failed",
        description: "Unable to scan for Bluetooth devices",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400 border-green-500';
      case 'good': return 'text-blue-400 border-blue-500';
      case 'fair': return 'text-yellow-400 border-yellow-500';
      case 'poor': return 'text-red-400 border-red-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'bluetooth': return <Bluetooth className="w-4 h-4" />;
      case 'webrtc': return <Globe className="w-4 h-4" />;
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'cellular': return <Signal className="w-4 h-4" />;
      default: return <Network className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
              <Network className="w-6 h-6" />
              Advanced Connectivity
            </h1>
            <p className="text-gray-400">Mesh network status and connection management</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={`${wsState.isConnected ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
              {wsState.isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
              {wsState.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="border-gray-600"
            >
              {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </div>

        {/* Connection Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/50 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Wifi className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Signal Strength</p>
                  <p className="text-lg font-semibold text-blue-400">{connectionMetrics.signalStrength}%</p>
                </div>
              </div>
              <Progress value={connectionMetrics.signalStrength} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Latency</p>
                  <p className="text-lg font-semibold text-green-400">{connectionMetrics.latency.toFixed(0)}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Bandwidth</p>
                  <p className="text-lg font-semibold text-purple-400">{connectionMetrics.bandwidth.toFixed(1)} MB/s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-pink-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Connected Nodes</p>
                  <p className="text-lg font-semibold text-pink-400">{discoveredNodes.filter(n => n.isOnline).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="topology" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/50 border-blue-500/20">
            <TabsTrigger value="topology" className="data-[state=active]:bg-blue-500/20">
              <Network className="w-4 h-4 mr-2" />
              Topology
            </TabsTrigger>
            <TabsTrigger value="nodes" className="data-[state=active]:bg-green-500/20">
              <Server className="w-4 h-4 mr-2" />
              Nodes
            </TabsTrigger>
            <TabsTrigger value="protocols" className="data-[state=active]:bg-purple-500/20">
              <Radio className="w-4 h-4 mr-2" />
              Protocols
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-pink-500/20">
              <Activity className="w-4 h-4 mr-2" />
              Metrics
            </TabsTrigger>
          </TabsList>

          {/* Network Topology */}
          <TabsContent value="topology" className="space-y-6">
            <Card className="bg-black/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Layers3 className="w-5 h-5" />
                  Real-time Network Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full h-64 bg-gray-900/50 rounded-lg border border-gray-700"
                  />
                  
                  <div className="absolute top-4 left-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                      <span className="text-gray-300">You ({currentUser.meshCallsign})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300">Online Nodes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-gray-300">Offline Nodes</span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className={getQualityColor(connectionMetrics.quality)}>
                      <Activity className="w-3 h-3 mr-1" />
                      {connectionMetrics.quality.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Node List */}
          <TabsContent value="nodes" className="space-y-6">
            <Card className="bg-black/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-green-400">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Discovered Nodes
                  </div>
                  <Button
                    onClick={() => setIsScanning(!isScanning)}
                    disabled={isScanning}
                    size="sm"
                    variant="outline"
                    className="border-green-500/50 text-green-300"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Scanning...' : 'Scan'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {discoveredNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${node.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <div>
                            <p className="font-medium text-white">{node.alias}</p>
                            <p className="text-sm text-gray-400">{node.meshCallsign}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            {getConnectionTypeIcon(node.connectionType)}
                            <span className="text-gray-400 capitalize">{node.connectionType}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Signal className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">{node.signalStrength}%</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">{node.distance}m</span>
                          </div>
                          
                          <Badge variant="outline" className="text-purple-300 border-purple-500/50">
                            {node.hops} hop{node.hops !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Protocol Settings */}
          <TabsContent value="protocols" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Radio className="w-5 h-5" />
                    Connection Protocols
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-blue-400" />
                      <Label className="text-gray-300">WebRTC</Label>
                    </div>
                    <Switch checked={webRTCEnabled} onCheckedChange={setWebRTCEnabled} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bluetooth className="w-4 h-4 text-purple-400" />
                      <Label className="text-gray-300">Bluetooth LE</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={bluetoothEnabled} onCheckedChange={setBluetoothEnabled} />
                      <Button onClick={handleBluetoothScan} size="sm" variant="outline" className="border-purple-500/50">
                        <Antenna className="w-3 h-3 mr-1" />
                        Scan
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-green-400" />
                      <Label className="text-gray-300">Mesh Routing</Label>
                    </div>
                    <Switch checked={meshEnabled} onCheckedChange={setMeshEnabled} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <Label className="text-gray-300">Auto-connect</Label>
                    </div>
                    <Switch checked={autoConnect} onCheckedChange={setAutoConnect} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Settings className="w-5 h-5" />
                    Advanced Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Connection Timeout</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="flex-1 h-2" />
                      <span className="text-sm text-gray-300">30s</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-400">Retry Attempts</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={60} className="flex-1 h-2" />
                      <span className="text-sm text-gray-300">5</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-400">Mesh Discovery Range</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={40} className="flex-1 h-2" />
                      <span className="text-sm text-gray-300">500m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Connection Metrics */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/50 border-pink-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-400">
                    <Activity className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Network Uptime</span>
                      <span className="text-green-400">{connectionMetrics.uptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={connectionMetrics.uptime} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Packet Loss</span>
                      <span className="text-yellow-400">{connectionMetrics.packetLoss.toFixed(2)}%</span>
                    </div>
                    <Progress value={100 - connectionMetrics.packetLoss} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Data Transferred</span>
                      <span className="text-blue-400">{connectionMetrics.dataTransferred.toFixed(1)} MB</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Connection Quality</span>
                      <Badge variant="outline" className={getQualityColor(connectionMetrics.quality)}>
                        {connectionMetrics.quality.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-400">
                    <HardDrive className="w-5 h-5" />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">CPU Usage</span>
                      <span className="text-orange-400">23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Memory Usage</span>
                      <span className="text-blue-400">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Network Buffer</span>
                      <span className="text-green-400">12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Battery className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">Power Efficient Mode</span>
                    <Badge className="bg-green-500/20 text-green-300 ml-auto">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}