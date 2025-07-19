import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  Users, 
  Signal, 
  Activity,
  Network,
  Eye,
  Target,
  Radio,
  Wifi
} from 'lucide-react';

interface NetworkNode {
  id: string;
  callsign: string;
  status: 'online' | 'offline' | 'connecting';
  type: 'user' | 'relay' | 'bridge';
  distance: number;
  signalStrength: number;
  lastSeen: Date;
  connections: string[];
  capabilities: string[];
}

interface NeuralInterfaceProps {
  userId: string;
  onNodeSelect?: (nodeId: string) => void;
}

export function NeuralInterface({ userId, onNodeSelect }: NeuralInterfaceProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'passive' | 'active'>('passive');
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Simulate network topology
  useEffect(() => {
    const generateNodes = (): NetworkNode[] => {
      const nodeTypes: NetworkNode['type'][] = ['user', 'relay', 'bridge'];
      const statuses: NetworkNode['status'][] = ['online', 'offline', 'connecting'];
      const capabilities = ['quantum-relay', 'neural-bridge', 'void-comm', 'data-vault', 'stealth-mode'];
      
      return Array.from({ length: 12 }, (_, i) => ({
        id: `node_${i + 1}`,
        callsign: `${['PHANTOM', 'GHOST', 'CIPHER', 'SHADOW', 'VOID', 'NEURAL'][i % 6]}-${String.fromCharCode(945 + (i % 8))}${(10 + i).toString().padStart(2, '0')}`,
        status: i === 0 ? 'online' : statuses[Math.floor(Math.random() * statuses.length)],
        type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
        distance: Math.floor(Math.random() * 500) + 50,
        signalStrength: Math.floor(Math.random() * 100),
        lastSeen: new Date(Date.now() - Math.random() * 3600000),
        connections: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
          `node_${Math.floor(Math.random() * 12) + 1}`
        ),
        capabilities: capabilities.slice(0, Math.floor(Math.random() * 3) + 1)
      }));
    };

    setNodes(generateNodes());

    // Simulate real-time updates
    const interval = setInterval(() => {
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          signalStrength: Math.max(0, Math.min(100, node.signalStrength + (Math.random() - 0.5) * 20)),
          lastSeen: node.status === 'online' ? new Date() : node.lastSeen
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
    onNodeSelect?.(nodeId);
  };

  const getNodeStatusColor = (status: NetworkNode['status']) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-900/20 border-green-400/30';
      case 'connecting': return 'text-yellow-400 bg-yellow-900/20 border-yellow-400/30';
      case 'offline': return 'text-red-400 bg-red-900/20 border-red-400/30';
    }
  };

  const getNodeTypeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'user': return Users;
      case 'relay': return Radio;
      case 'bridge': return Network;
    }
  };

  const getSignalIcon = (strength: number) => {
    if (strength > 70) return { icon: Wifi, color: 'text-green-400' };
    if (strength > 40) return { icon: Signal, color: 'text-yellow-400' };
    return { icon: Signal, color: 'text-red-400' };
  };

  const onlineNodes = nodes.filter(n => n.status === 'online');
  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Neural Mesh Interface
            </h1>
            <p className="text-gray-400">Real-time network topology and node management</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="bg-purple-900/20 text-purple-400">
            <Activity className="w-4 h-4 mr-2" />
            {onlineNodes.length} Nodes Online
          </Badge>
          <Button
            variant={scanMode === 'active' ? 'default' : 'outline'}
            onClick={() => setScanMode(scanMode === 'active' ? 'passive' : 'active')}
            className={scanMode === 'active' ? 'bg-pink-600 hover:bg-pink-700' : 'border-pink-500/30 text-pink-400'}
          >
            {scanMode === 'active' ? (
              <>
                <Target className="w-4 h-4 mr-2" />
                Active Scan
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Passive Mode
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Overview */}
        <Card className="border-purple-500/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-400">
              <Network className="w-5 h-5" />
              <span>Mesh Topology</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {nodes.map((node) => {
                const NodeIcon = getNodeTypeIcon(node.type);
                const signal = getSignalIcon(node.signalStrength);
                const isSelected = selectedNode === node.id;
                
                return (
                  <Card 
                    key={node.id} 
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-pink-500/50 bg-pink-900/20' 
                        : 'border-gray-600 hover:border-purple-500/50'
                    }`}
                    onClick={() => handleNodeSelect(node.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <NodeIcon className="w-4 h-4 text-purple-400" />
                          <span className="font-medium text-purple-400 text-sm">
                            {node.callsign}
                          </span>
                        </div>
                        <Badge className={`text-xs ${getNodeStatusColor(node.status)}`}>
                          {node.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Signal</span>
                          <div className="flex items-center space-x-1">
                            <signal.icon className={`w-3 h-3 ${signal.color}`} />
                            <span className="text-gray-300">{node.signalStrength}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Distance</span>
                          <span className="text-gray-300">{node.distance}m</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Type</span>
                          <span className="text-gray-300 capitalize">{node.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Connections</span>
                          <span className="text-gray-300">{node.connections.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Node Details */}
        <Card className="border-pink-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-pink-400">
              <Target className="w-5 h-5" />
              <span>Node Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNodeData ? (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-gray-700">
                  <h3 className="text-xl font-bold text-pink-400">
                    {selectedNodeData.callsign}
                  </h3>
                  <Badge className={`mt-2 ${getNodeStatusColor(selectedNodeData.status)}`}>
                    {selectedNodeData.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Node Type</label>
                    <div className="text-gray-400 capitalize mt-1">
                      {selectedNodeData.type}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300">Signal Strength</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedNodeData.signalStrength}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm">
                        {selectedNodeData.signalStrength}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300">Distance</label>
                    <div className="text-gray-400 mt-1">
                      {selectedNodeData.distance} meters
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300">Last Seen</label>
                    <div className="text-gray-400 mt-1 text-sm">
                      {selectedNodeData.lastSeen.toLocaleTimeString()}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300">Capabilities</label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedNodeData.capabilities.map(cap => (
                        <Badge key={cap} className="bg-purple-900/30 text-purple-400 text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300">Active Connections</label>
                    <div className="mt-2 space-y-1">
                      {selectedNodeData.connections.map(conn => (
                        <div key={conn} className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                          {conn}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <Button 
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    disabled={selectedNodeData.status !== 'online'}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Establish Connection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a node to view details</p>
                <p className="text-sm mt-1">Click on any node in the mesh topology</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}