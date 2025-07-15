import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, 
  Activity, 
  Signal, 
  Users, 
  MapPin, 
  Wifi,
  WifiOff,
  Router,
  Globe,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAdvancedMesh } from '@/hooks/use-advanced-mesh';

interface NetworkExplorerProps {
  nodeId: string;
}

export function NetworkExplorer({ nodeId }: NetworkExplorerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    networkMetrics,
    connection,
    refetchNetworkMetrics
  } = useAdvancedMesh(nodeId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchNetworkMetrics();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getConnectionQuality = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return { color: 'text-green-500', icon: Wifi, bars: 4 };
      case 'good':
        return { color: 'text-blue-500', icon: Wifi, bars: 3 };
      case 'poor':
        return { color: 'text-yellow-500', icon: Wifi, bars: 2 };
      case 'critical':
        return { color: 'text-red-500', icon: WifiOff, bars: 1 };
      default:
        return { color: 'text-gray-500', icon: WifiOff, bars: 0 };
    }
  };

  const mockNodes = [
    { id: 'node_1', name: 'Gateway Alpha', type: 'gateway', latency: 12, reliability: 98.5, connections: 5 },
    { id: 'node_2', name: 'Relay Beta', type: 'relay', latency: 28, reliability: 95.2, connections: 3 },
    { id: 'node_3', name: 'Peer Gamma', type: 'peer', latency: 45, reliability: 92.1, connections: 2 },
    { id: 'node_4', name: 'Mobile Delta', type: 'mobile', latency: 67, reliability: 89.3, connections: 1 },
  ];

  const mockRoutes = [
    { from: 'node_1', to: 'node_2', cost: 28, hops: 1, active: true },
    { from: 'node_2', to: 'node_3', cost: 45, hops: 2, active: true },
    { from: 'node_1', to: 'node_4', cost: 67, hops: 3, active: false },
    { from: 'node_3', to: 'node_4', cost: 89, hops: 2, active: true },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cyber-cyan)]">Network Explorer</h2>
          <p className="text-gray-400 mt-1">Mesh topology visualization and management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Nodes</p>
                <p className="text-2xl font-bold text-[var(--cyber-cyan)]">
                  {networkMetrics?.networkStats?.totalNodes || 0}
                </p>
              </div>
              <Network className="w-8 h-8 text-[var(--cyber-cyan)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Routes</p>
                <p className="text-2xl font-bold text-[var(--cyber-green)]">
                  {networkMetrics?.networkStats?.activeRoutes || 0}
                </p>
              </div>
              <Router className="w-8 h-8 text-[var(--cyber-green)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Connected Users</p>
                <p className="text-2xl font-bold text-[var(--cyber-magenta)]">
                  {networkMetrics?.connectedUsers?.length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-[var(--cyber-magenta)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Network Health</p>
                <p className="text-2xl font-bold text-[var(--cyber-yellow)]">
                  {networkMetrics?.networkStats?.networkReliability?.toFixed(1) || '0.0'}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-[var(--cyber-yellow)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Visualization */}
      <Tabs defaultValue="topology" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topology">Topology</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
        </TabsList>

        <TabsContent value="topology" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="w-5 h-5" />
                <span>Network Topology</span>
              </CardTitle>
              <CardDescription>
                Visual representation of mesh network structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 bg-gray-900 rounded-lg p-4 overflow-hidden">
                {/* Animated network visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Central node */}
                    <div className="w-12 h-12 bg-[var(--cyber-cyan)] rounded-full flex items-center justify-center relative">
                      <Network className="w-6 h-6 text-white" />
                      <div className="absolute inset-0 bg-[var(--cyber-cyan)] rounded-full animate-pulse opacity-50"></div>
                    </div>
                    
                    {/* Connected nodes */}
                    {mockNodes.map((node, index) => {
                      const angle = (index * 360) / mockNodes.length;
                      const radius = 120;
                      const x = Math.cos((angle * Math.PI) / 180) * radius;
                      const y = Math.sin((angle * Math.PI) / 180) * radius;
                      
                      return (
                        <div
                          key={node.id}
                          className="absolute w-8 h-8 bg-[var(--cyber-green)] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                          style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          onClick={() => setSelectedNode(node.id)}
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          
                          {/* Connection line */}
                          <div 
                            className="absolute w-0.5 bg-[var(--cyber-cyan)]/50 origin-center"
                            style={{
                              height: `${radius}px`,
                              left: '50%',
                              top: '50%',
                              transform: `translate(-50%, -50%) rotate(${angle + 180}deg)`,
                              transformOrigin: 'center bottom'
                            }}
                          ></div>
                          
                          {/* Node label */}
                          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-xs text-white whitespace-nowrap">
                            {node.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Connection quality indicator */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-2 bg-black/50 rounded-lg p-2">
                    <Signal className={`w-4 h-4 ${getConnectionQuality(connection?.connectionQuality || 'poor').color}`} />
                    <span className="text-xs text-white">
                      {(connection?.connectionQuality || 'poor').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Network Nodes</span>
              </CardTitle>
              <CardDescription>
                Detailed information about mesh network nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockNodes.map((node) => (
                  <div 
                    key={node.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedNode === node.id 
                        ? 'border-[var(--cyber-cyan)] bg-[var(--cyber-cyan)]/10' 
                        : 'border-gray-700 hover:border-[var(--cyber-cyan)]/50'
                    }`}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[var(--cyber-green)] rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">{node.name}</p>
                          <p className="text-sm text-gray-400 capitalize">{node.type} node</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-[var(--cyber-cyan)]">
                          {node.connections} connections
                        </Badge>
                        <Badge variant="outline" className="text-[var(--cyber-green)]">
                          {node.latency}ms
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedNode === node.id && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Latency</p>
                            <p className="text-lg font-bold text-[var(--cyber-cyan)]">{node.latency}ms</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Reliability</p>
                            <p className="text-lg font-bold text-[var(--cyber-green)]">{node.reliability}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Connections</p>
                            <p className="text-lg font-bold text-[var(--cyber-magenta)]">{node.connections}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Reliability Score</p>
                          <Progress value={node.reliability} className="h-2" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Router className="w-5 h-5" />
                <span>Routing Table</span>
              </CardTitle>
              <CardDescription>
                Network routing information and path optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRoutes.map((route, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-[var(--cyber-cyan)] rounded-full"></div>
                          <span className="text-sm">{route.from}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm">{route.to}</span>
                          <div className="w-3 h-3 bg-[var(--cyber-green)] rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-[var(--cyber-yellow)]">
                          {route.hops} hops
                        </Badge>
                        <Badge variant="outline" className="text-[var(--cyber-cyan)]">
                          Cost: {route.cost}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={route.active ? 'text-[var(--cyber-green)]' : 'text-[var(--cyber-red)]'}
                        >
                          {route.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Status */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--cyber-cyan)]">
                {connection.isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-sm text-gray-400">Connection Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--cyber-green)]">
                {connection.metrics.latency}ms
              </div>
              <div className="text-sm text-gray-400">Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--cyber-magenta)]">
                {(connection.metrics.reliability * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Reliability</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}