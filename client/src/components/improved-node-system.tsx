import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

import {
  Zap,
  Network,
  Activity,
  Cpu,
  Radio,
  Wifi,
  Globe,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  TrendingUp,
  Users,
  MessageSquare,
  Shield,
  Power,
  Gauge,
  Server,
  Router,
  Antenna,
  Signal,
  Battery,
  HardDrive,
  Memory,
  Thermometer,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Monitor,
  Terminal,
  Download,
  Upload
} from 'lucide-react';

interface NodeMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  storageUsage: number;
  temperature: number;
  powerLevel: number;
  uptime: number;
  peersConnected: number;
  messagesProcessed: number;
  dataTransferred: number;
}

interface NodeConfiguration {
  maxPeers: number;
  routingEnabled: boolean;
  discoveryEnabled: boolean;
  encryptionLevel: number;
  bandwidthLimit: number;
  storageLimit: number;
  autoRestart: boolean;
  debugMode: boolean;
}

interface ImprovedNodeSystemProps {
  currentUser: User | null;
  availableUsers: User[];
  isOffline: boolean;
}

export function ImprovedNodeSystem({ currentUser, availableUsers, isOffline }: ImprovedNodeSystemProps) {
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics>({
    cpuUsage: 25,
    memoryUsage: 45,
    networkLatency: 120,
    storageUsage: 30,
    temperature: 42,
    powerLevel: 85,
    uptime: 86400,
    peersConnected: availableUsers.length,
    messagesProcessed: 1247,
    dataTransferred: 2.4
  });

  const [nodeConfig, setNodeConfig] = useState<NodeConfiguration>({
    maxPeers: 50,
    routingEnabled: true,
    discoveryEnabled: true,
    encryptionLevel: 3,
    bandwidthLimit: 1000,
    storageLimit: 5000,
    autoRestart: true,
    debugMode: false
  });

  const [nodeStatus, setNodeStatus] = useState<'online' | 'offline' | 'maintenance' | 'error'>('online');
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const metricsUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate real-time metrics updates
  useEffect(() => {
    if (!isRunning) return;

    metricsUpdateRef.current = setInterval(() => {
      setNodeMetrics(prev => ({
        ...prev,
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(80, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        networkLatency: Math.max(50, Math.min(500, prev.networkLatency + (Math.random() - 0.5) * 50)),
        temperature: Math.max(35, Math.min(70, prev.temperature + (Math.random() - 0.5) * 3)),
        peersConnected: availableUsers.length + Math.floor(Math.random() * 5),
        messagesProcessed: prev.messagesProcessed + Math.floor(Math.random() * 10),
        dataTransferred: prev.dataTransferred + Math.random() * 0.1
      }));
    }, 2000);

    return () => {
      if (metricsUpdateRef.current) {
        clearInterval(metricsUpdateRef.current);
      }
    };
  }, [isRunning, availableUsers.length]);

  // Add log entries
  const addLog = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setLogs(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  // Node control functions
  const startNode = () => {
    setIsRunning(true);
    setNodeStatus('online');
    addLog('Node started successfully');
    toast({
      title: "Node Started",
      description: "Mesh node is now online and accepting connections",
    });
  };

  const stopNode = () => {
    setIsRunning(false);
    setNodeStatus('offline');
    addLog('Node stopped by user');
    toast({
      title: "Node Stopped",
      description: "Mesh node has been taken offline",
    });
  };

  const restartNode = () => {
    setIsRunning(false);
    setNodeStatus('maintenance');
    addLog('Node restart initiated');
    
    setTimeout(() => {
      setIsRunning(true);
      setNodeStatus('online');
      addLog('Node restart completed successfully');
      toast({
        title: "Node Restarted",
        description: "Mesh node has been restarted and is back online",
      });
    }, 3000);
  };

  const optimizeNode = () => {
    addLog('Running node optimization...');
    
    setTimeout(() => {
      setNodeMetrics(prev => ({
        ...prev,
        cpuUsage: Math.max(10, prev.cpuUsage * 0.7),
        memoryUsage: Math.max(20, prev.memoryUsage * 0.8),
        networkLatency: Math.max(50, prev.networkLatency * 0.6)
      }));
      
      addLog('Node optimization completed');
      toast({
        title: "Optimization Complete",
        description: "Node performance has been optimized",
      });
    }, 2000);
  };

  // Configuration handlers
  const handleConfigChange = (key: keyof NodeConfiguration, value: any) => {
    setNodeConfig(prev => ({ ...prev, [key]: value }));
    addLog(`Configuration updated: ${key} = ${value}`);
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'online':
        return { color: 'text-green-500', icon: CheckCircle, badge: 'default' };
      case 'offline':
        return { color: 'text-red-500', icon: XCircle, badge: 'destructive' };
      case 'maintenance':
        return { color: 'text-yellow-500', icon: AlertTriangle, badge: 'secondary' };
      case 'error':
        return { color: 'text-red-500', icon: XCircle, badge: 'destructive' };
      default:
        return { color: 'text-gray-500', icon: Info, badge: 'secondary' };
    }
  };

  const statusDisplay = getStatusDisplay(nodeStatus);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Format data size
  const formatDataSize = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  if (isOffline && !currentUser) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Server className="w-6 h-6 text-gray-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Node Control Unavailable</h3>
            <p className="text-gray-500">Please login and connect to access node management.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Node Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>Mesh Node Control Panel</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={statusDisplay.badge as any}>
                <statusDisplay.icon className="w-3 h-3 mr-1" />
                {nodeStatus.toUpperCase()}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{nodeMetrics.peersConnected}</div>
              <div className="text-sm text-gray-500">Connected Peers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{nodeMetrics.messagesProcessed}</div>
              <div className="text-sm text-gray-500">Messages Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{formatDataSize(nodeMetrics.dataTransferred)}</div>
              <div className="text-sm text-gray-500">Data Transferred</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{formatUptime(nodeMetrics.uptime)}</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
          </div>

          <div className="flex space-x-2">
            {!isRunning ? (
              <Button onClick={startNode} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Start Node
              </Button>
            ) : (
              <Button onClick={stopNode} variant="destructive">
                <Pause className="w-4 h-4 mr-2" />
                Stop Node
              </Button>
            )}
            <Button onClick={restartNode} variant="outline" disabled={nodeStatus === 'maintenance'}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
            <Button onClick={optimizeNode} variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Optimize
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Node Management Tabs */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>System Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center space-x-1">
                      <Cpu className="w-3 h-3" />
                      <span>CPU Usage</span>
                    </Label>
                    <span className="text-sm text-gray-500">{nodeMetrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={nodeMetrics.cpuUsage} className="w-full" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center space-x-1">
                      <Memory className="w-3 h-3" />
                      <span>Memory Usage</span>
                    </Label>
                    <span className="text-sm text-gray-500">{nodeMetrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={nodeMetrics.memoryUsage} className="w-full" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>Storage Usage</span>
                    </Label>
                    <span className="text-sm text-gray-500">{nodeMetrics.storageUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={nodeMetrics.storageUsage} className="w-full" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center space-x-1">
                      <Thermometer className="w-3 h-3" />
                      <span>Temperature</span>
                    </Label>
                    <span className="text-sm text-gray-500">{nodeMetrics.temperature.toFixed(1)}°C</span>
                  </div>
                  <Progress value={(nodeMetrics.temperature / 100) * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Network Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="w-4 h-4" />
                  <span>Network Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-1">
                    <Signal className="w-3 h-3" />
                    <span>Network Latency</span>
                  </Label>
                  <span className="text-sm text-gray-500">{nodeMetrics.networkLatency}ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Connected Peers</span>
                  </Label>
                  <span className="text-sm text-gray-500">{nodeMetrics.peersConnected}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>Messages Processed</span>
                  </Label>
                  <span className="text-sm text-gray-500">{nodeMetrics.messagesProcessed}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-1">
                    <Download className="w-3 h-3" />
                    <span>Data Transferred</span>
                  </Label>
                  <span className="text-sm text-gray-500">{formatDataSize(nodeMetrics.dataTransferred)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-1">
                    <Battery className="w-3 h-3" />
                    <span>Power Level</span>
                  </Label>
                  <span className="text-sm text-gray-500">{nodeMetrics.powerLevel}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Node Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Network Settings</h3>
                  
                  <div>
                    <Label>Maximum Peers</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        value={[nodeConfig.maxPeers]}
                        onValueChange={([value]) => handleConfigChange('maxPeers', value)}
                        max={100}
                        min={10}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm w-12">{nodeConfig.maxPeers}</span>
                    </div>
                  </div>

                  <div>
                    <Label>Bandwidth Limit (Mbps)</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        value={[nodeConfig.bandwidthLimit]}
                        onValueChange={([value]) => handleConfigChange('bandwidthLimit', value)}
                        max={2000}
                        min={100}
                        step={100}
                        className="flex-1"
                      />
                      <span className="text-sm w-16">{nodeConfig.bandwidthLimit}</span>
                    </div>
                  </div>

                  <div>
                    <Label>Storage Limit (GB)</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        value={[nodeConfig.storageLimit]}
                        onValueChange={([value]) => handleConfigChange('storageLimit', value)}
                        max={10000}
                        min={1000}
                        step={500}
                        className="flex-1"
                      />
                      <span className="text-sm w-16">{nodeConfig.storageLimit}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Security & Features</h3>
                  
                  <div>
                    <Label>Encryption Level</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        value={[nodeConfig.encryptionLevel]}
                        onValueChange={([value]) => handleConfigChange('encryptionLevel', value)}
                        max={5}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-12">Level {nodeConfig.encryptionLevel}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Enable Routing</Label>
                      <Switch
                        checked={nodeConfig.routingEnabled}
                        onCheckedChange={(checked) => handleConfigChange('routingEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Enable Discovery</Label>
                      <Switch
                        checked={nodeConfig.discoveryEnabled}
                        onCheckedChange={(checked) => handleConfigChange('discoveryEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Auto Restart</Label>
                      <Switch
                        checked={nodeConfig.autoRestart}
                        onCheckedChange={(checked) => handleConfigChange('autoRestart', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Debug Mode</Label>
                      <Switch
                        checked={nodeConfig.debugMode}
                        onCheckedChange={(checked) => handleConfigChange('debugMode', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configuration changes will be applied immediately. Some changes may require a node restart.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableUsers.slice(0, 10).map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {user.alias?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.alias || `User ${user.id}`}</p>
                        <p className="text-sm text-gray-500">
                          Peer ID: {user.id} • Online
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="text-xs">
                        Connected
                      </Badge>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}

                {availableUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No peers connected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>System Logs</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLogs([])}
                >
                  Clear Logs
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-1 font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Terminal className="w-8 h-8 mx-auto mb-2" />
                      No log entries
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded text-xs ${
                          log.includes('ERROR') ? 'bg-red-50 text-red-700' :
                          log.includes('WARNING') ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}